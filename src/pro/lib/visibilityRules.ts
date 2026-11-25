/**
 * Declarative Conditional Visibility engine for Overview & Room cards/sections (Phase 3.1).
 * Pure, no React — evaluated outside Edit Mode; Edit Mode always renders all elements.
 */

export type VisibilityDevice = 'phone' | 'tablet' | 'desktop';

export type VisibilityCondition =
  | { kind: 'active_only' }
  | { kind: 'state'; entityId: string; operator: 'eq' | 'neq'; value: string }
  | { kind: 'numeric'; entityId: string; operator: 'gt' | 'lt'; threshold: number }
  | { kind: 'device'; devices: VisibilityDevice[] }
  | { kind: 'user'; adminOnly?: boolean; userIds?: string[] };

export type VisibilityRuleSet = VisibilityCondition[];

export interface VisibilityEvalContext {
  /** Active status for active_only rules; undefined treats active_only as satisfied. */
  isActive?: boolean;
  entities: Record<string, { state?: string; attributes?: Record<string, unknown> } | undefined>;
  device: VisibilityDevice;
  user: { id: string; isAdmin: boolean } | null;
}

const VALID_DEVICES = new Set<VisibilityDevice>(['phone', 'tablet', 'desktop']);

const ACTIVE_ENTITY_STATES = new Set([
  'on',
  'open',
  'opening',
  'playing',
  'buffering',
  'heat',
  'cool',
  'heat_cool',
  'auto',
  'dry',
  'fan_only',
  'cleaning',
  'returning',
  'unlocked',
  'unlocking',
  'jammed',
  'detected',
  'streaming',
  'recording',
  'home',
  'active'
]);

const ROOM_ACTIVITY_DOMAINS = new Set(['light', 'switch', 'fan', 'media_player', 'climate', 'cover', 'lock', 'vacuum', 'binary_sensor']);

function evaluateCondition(condition: VisibilityCondition, ctx: VisibilityEvalContext): boolean {
  switch (condition.kind) {
    case 'active_only':
      return ctx.isActive === undefined ? true : Boolean(ctx.isActive);
    case 'state': {
      const entity = ctx.entities[condition.entityId];
      if (!entity || entity.state === undefined || entity.state === null) {
        return condition.operator === 'neq';
      }
      const actual = String(entity.state).trim().toLowerCase();
      const expected = condition.value.trim().toLowerCase();
      const matches = actual === expected;
      return condition.operator === 'eq' ? matches : !matches;
    }
    case 'numeric': {
      const entity = ctx.entities[condition.entityId];
      if (!entity || entity.state === undefined || entity.state === null) return false;
      const num = Number(entity.state);
      if (!Number.isFinite(num) || !Number.isFinite(condition.threshold)) return false;
      return condition.operator === 'gt' ? num > condition.threshold : num < condition.threshold;
    }
    case 'device':
      return condition.devices.includes(ctx.device);
    case 'user': {
      if (condition.adminOnly && !ctx.user?.isAdmin) return false;
      if (condition.userIds && condition.userIds.length > 0) {
        if (!ctx.user?.id || !condition.userIds.includes(ctx.user.id)) return false;
      }
      return true;
    }
  }
}

/** Evaluates AND-combined visibility rules; empty or absent rules are always visible. */
export function evaluateVisibility(rules: VisibilityRuleSet | undefined, ctx: VisibilityEvalContext): boolean {
  if (!rules || rules.length === 0) return true;
  return rules.every((rule) => evaluateCondition(rule, ctx));
}

/** Sanitizes persisted visibility rules, dropping malformed or empty entries. */
export function normalizeVisibilityRules(raw: unknown): VisibilityRuleSet {
  if (!Array.isArray(raw)) return [];
  const out: VisibilityRuleSet = [];
  let seenActiveOnly = false;

  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const rec = item as Record<string, unknown>;
    if (rec.kind === 'active_only') {
      if (!seenActiveOnly) {
        seenActiveOnly = true;
        out.push({ kind: 'active_only' });
      }
      continue;
    }
    if (rec.kind === 'state') {
      const entityId = typeof rec.entityId === 'string' ? rec.entityId.trim() : '';
      const operator = rec.operator === 'eq' || rec.operator === 'neq' ? rec.operator : null;
      const value = typeof rec.value === 'string' ? rec.value : typeof rec.value === 'number' ? String(rec.value) : '';
      if (entityId && operator) {
        out.push({ kind: 'state', entityId, operator, value });
      }
      continue;
    }
    if (rec.kind === 'numeric') {
      const entityId = typeof rec.entityId === 'string' ? rec.entityId.trim() : '';
      const operator = rec.operator === 'gt' || rec.operator === 'lt' ? rec.operator : null;
      const threshold = typeof rec.threshold === 'number' ? rec.threshold : Number(rec.threshold);
      if (entityId && operator && Number.isFinite(threshold)) {
        out.push({ kind: 'numeric', entityId, operator, threshold });
      }
      continue;
    }
    if (rec.kind === 'device' && Array.isArray(rec.devices)) {
      const devices: VisibilityDevice[] = [];
      for (const d of rec.devices) {
        if (typeof d === 'string' && VALID_DEVICES.has(d as VisibilityDevice) && !devices.includes(d as VisibilityDevice)) {
          devices.push(d as VisibilityDevice);
        }
      }
      if (devices.length > 0 && devices.length < VALID_DEVICES.size) {
        out.push({ kind: 'device', devices });
      }
      continue;
    }
    if (rec.kind === 'user') {
      const adminOnly = rec.adminOnly === true ? true : undefined;
      const userIds = Array.isArray(rec.userIds)
        ? [...new Set(rec.userIds.filter((u): u is string => typeof u === 'string' && u.trim().length > 0).map((u) => u.trim()))]
        : undefined;
      if (adminOnly || (userIds && userIds.length > 0)) {
        out.push({
          kind: 'user',
          ...(adminOnly ? { adminOnly } : {}),
          ...(userIds && userIds.length > 0 ? { userIds } : {})
        });
      }
    }
  }
  return out;
}

/** Sanitizes a sectionRules/cardRules record; returns undefined if empty to preserve clean diffs. */
export function normalizeRulesMap(
  raw: unknown,
  isValidKey?: (key: string) => boolean
): Record<string, VisibilityRuleSet> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const out: Record<string, VisibilityRuleSet> = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (isValidKey && !isValidKey(key)) continue;
    const normalized = normalizeVisibilityRules(val);
    if (normalized.length > 0) {
      out[key] = normalized;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Immutable update for sectionRules/cardRules; deletes entry and returns undefined when empty. */
export function withUpdatedRule(
  map: Record<string, VisibilityRuleSet> | undefined,
  key: string,
  rules: VisibilityRuleSet
): Record<string, VisibilityRuleSet> | undefined {
  const clean = normalizeVisibilityRules(rules);
  const next = { ...(map ?? {}) };
  if (clean.length === 0) {
    delete next[key];
  } else {
    next[key] = clean;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

/** Concise human-readable summary of a rule set for badges & sheets. */
export function summarizeVisibilityRules(rules: VisibilityRuleSet | undefined): string {
  if (!rules || rules.length === 0) return 'Always visible';
  const parts: string[] = [];
  for (const r of rules) {
    if (r.kind === 'active_only') {
      parts.push('Active only');
    } else if (r.kind === 'device') {
      parts.push(r.devices.map((d) => d[0].toUpperCase() + d.slice(1)).join('/'));
    } else if (r.kind === 'user') {
      if (r.adminOnly) parts.push('Admins');
      if (r.userIds?.length) parts.push(`${r.userIds.length} user${r.userIds.length > 1 ? 's' : ''}`);
    } else if (r.kind === 'state') {
      parts.push(`${r.entityId} ${r.operator === 'eq' ? '=' : '≠'} ${r.value}`);
    } else if (r.kind === 'numeric') {
      parts.push(`${r.entityId} ${r.operator === 'gt' ? '>' : '<'} ${r.threshold}`);
    }
  }
  return parts.join(' · ');
}

function isEntityStateActive(state: string | undefined): boolean {
  if (!state) return false;
  return ACTIVE_ENTITY_STATES.has(state.trim().toLowerCase());
}

/** Active check for pinned Overview cards (`entity:`, `scene:`, `script:`, `camera:`, `room:`). */
export function isPinnedCardActive(
  cardId: string,
  entities: Record<string, { state?: string } | undefined>,
  resolvedAreas: readonly { area_id: string; entities?: readonly { entity_id: string; state?: string }[] }[]
): boolean {
  const idx = cardId.indexOf(':');
  const kind = idx > 0 ? cardId.slice(0, idx) : 'entity';
  const targetId = idx > 0 ? cardId.slice(idx + 1) : cardId;
  if (kind === 'room') {
    const area = resolvedAreas.find((a) => a.area_id === targetId);
    if (!area?.entities) return false;
    return area.entities.some((e) => {
      const domain = e.entity_id.split('.')[0];
      return ROOM_ACTIVITY_DOMAINS.has(domain) && isEntityStateActive(entities[e.entity_id]?.state ?? e.state);
    });
  }
  return isEntityStateActive(entities[targetId]?.state);
}

/** Whether an Overview widget or pinned card currently counts as active for `active_only` rules. */
export function isOverviewItemActive(
  itemId: string,
  widgetStatuses: Readonly<Record<string, { count: number; attention: unknown } | undefined>>,
  entities: Record<string, { state?: string } | undefined>,
  resolvedAreas: readonly { area_id: string; entities?: readonly { entity_id: string; state?: string }[] }[]
): boolean {
  if (itemId.includes(':')) {
    return isPinnedCardActive(itemId, entities, resolvedAreas);
  }
  const st = widgetStatuses[itemId];
  return Boolean(st && (st.attention || st.count > 0));
}

/** Filters visible Overview sections & items through `sectionRules` and `cardRules` outside Edit Mode. */
export function applyOverviewVisibilityRules<
  TSec extends { section: string; items: readonly { i: string }[] }
>(
  sections: readonly TSec[],
  rules: {
    sectionRules?: Record<string, VisibilityRuleSet>;
    cardRules?: Record<string, VisibilityRuleSet>;
  },
  ctx: {
    entities: Record<string, { state?: string } | undefined>;
    device: VisibilityDevice;
    user: { id: string; isAdmin: boolean } | null;
    widgetStatuses: Readonly<Record<string, { count: number; attention: unknown } | undefined>>;
    resolvedAreas: readonly { area_id: string; entities?: readonly { entity_id: string; state?: string }[] }[];
  }
): TSec[] {
  const hasAnyRules = Boolean(
    (rules.sectionRules && Object.keys(rules.sectionRules).length > 0) ||
    (rules.cardRules && Object.keys(rules.cardRules).length > 0)
  );
  if (!hasAnyRules) return [...sections];

  const out: TSec[] = [];
  for (const s of sections) {
    const visibleItems = s.items.filter((item) => {
      const cRules = rules.cardRules?.[item.i];
      if (!cRules || cRules.length === 0) return true;
      const isActive = isOverviewItemActive(item.i, ctx.widgetStatuses, ctx.entities, ctx.resolvedAreas);
      return evaluateVisibility(cRules, {
        isActive,
        entities: ctx.entities,
        device: ctx.device,
        user: ctx.user
      });
    });
    if (visibleItems.length === 0) continue;

    const sRules = rules.sectionRules?.[s.section];
    if (sRules && sRules.length > 0) {
      const secActive = visibleItems.some((item) =>
        isOverviewItemActive(item.i, ctx.widgetStatuses, ctx.entities, ctx.resolvedAreas)
      );
      const secVisible = evaluateVisibility(sRules, {
        isActive: secActive,
        entities: ctx.entities,
        device: ctx.device,
        user: ctx.user
      });
      if (!secVisible) continue;
    }

    out.push({ ...s, items: visibleItems });
  }
  return out;
}

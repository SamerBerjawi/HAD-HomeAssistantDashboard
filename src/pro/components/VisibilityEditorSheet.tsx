/**
 * Declarative Conditional Visibility rule editor sheet (Phase 3.1).
 * Shared by Pro Overview (sections & widgets/pinned cards) and RoomPage (sections & tiles).
 */
import { useEffect, useMemo, useState } from 'react';
import { Button, InputGroup, Label, Switch, TextField, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon, EyeIcon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { DEVICE_LABEL, DEVICE_ICON } from './LayoutScopeControls';
import { ProSheet } from './ProSheet';
import { DEVICE_TYPES, type DeviceType } from '../lib/overviewLayout';
import {
  normalizeVisibilityRules,
  summarizeVisibilityRules,
  type VisibilityCondition,
  type VisibilityDevice,
  type VisibilityRuleSet
} from '../lib/visibilityRules';

interface VisibilityEditorSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  page?: 'overview' | 'rooms';
  targetLabel: string;
  allowActiveOnly?: boolean;
  rules: VisibilityRuleSet;
  onSave: (rules: VisibilityRuleSet) => void;
}

type OpKind = 'eq' | 'neq' | 'gt' | 'lt';

export function VisibilityEditorSheet({
  isOpen,
  onOpenChange,
  page = 'overview',
  targetLabel,
  allowActiveOnly = true,
  rules,
  onSave
}: VisibilityEditorSheetProps) {
  const { currentUser } = useUserConfig();
  const resolvedEntities = useAutoLayoutStore((s) => s.resolvedEntities);

  const [activeOnly, setActiveOnly] = useState(false);
  const [devices, setDevices] = useState<VisibilityDevice[]>([]);
  const [adminOnly, setAdminOnly] = useState(false);
  const [onlyMe, setOnlyMe] = useState(false);
  const [entityRules, setEntityRules] = useState<Array<Extract<VisibilityCondition, { kind: 'state' | 'numeric' }>>>([]);

  const [entitySearch, setEntitySearch] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [operator, setOperator] = useState<OpKind>('eq');
  const [compareValue, setCompareValue] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const norm = normalizeVisibilityRules(rules);
    setActiveOnly(norm.some((r) => r.kind === 'active_only'));
    const devRule = norm.find((r): r is Extract<VisibilityCondition, { kind: 'device' }> => r.kind === 'device');
    setDevices(devRule ? [...devRule.devices] : []);
    const userRule = norm.find((r): r is Extract<VisibilityCondition, { kind: 'user' }> => r.kind === 'user');
    setAdminOnly(Boolean(userRule?.adminOnly));
    setOnlyMe(Boolean(currentUser?.id && userRule?.userIds?.includes(currentUser.id)));
    setEntityRules(norm.filter((r): r is Extract<VisibilityCondition, { kind: 'state' | 'numeric' }> => r.kind === 'state' || r.kind === 'numeric'));
    setEntitySearch('');
    setSelectedEntityId('');
    setOperator('eq');
    setCompareValue('');
  }, [isOpen, rules, currentUser?.id]);

  const entitySuggestions = useMemo(() => {
    const q = entitySearch.trim().toLowerCase();
    const list = Object.values(resolvedEntities);
    const filtered = q
      ? list.filter((e) => e.entity_id.toLowerCase().includes(q) || (e.name && e.name.toLowerCase().includes(q)))
      : list;
    return filtered.slice(0, 12);
  }, [resolvedEntities, entitySearch]);

  const draftRules = useMemo<VisibilityRuleSet>(() => {
    const out: VisibilityRuleSet = [];
    if (allowActiveOnly && activeOnly) out.push({ kind: 'active_only' });
    if (devices.length > 0 && devices.length < DEVICE_TYPES.length) {
      out.push({ kind: 'device', devices });
    }
    if (adminOnly || (onlyMe && currentUser?.id)) {
      out.push({
        kind: 'user',
        ...(adminOnly ? { adminOnly: true } : {}),
        ...(onlyMe && currentUser?.id ? { userIds: [currentUser.id] } : {})
      });
    }
    out.push(...entityRules);
    return normalizeVisibilityRules(out);
  }, [allowActiveOnly, activeOnly, devices, adminOnly, onlyMe, currentUser?.id, entityRules]);

  const canAddEntityRule = useMemo(() => {
    const eid = (selectedEntityId || entitySearch).trim();
    if (!eid) return false;
    if (operator === 'gt' || operator === 'lt') {
      return compareValue.trim().length > 0 && Number.isFinite(Number(compareValue));
    }
    return compareValue.trim().length > 0;
  }, [selectedEntityId, entitySearch, operator, compareValue]);

  const handleAddEntityRule = () => {
    const eid = (selectedEntityId || entitySearch).trim();
    if (!eid || !canAddEntityRule) return;
    if (operator === 'gt' || operator === 'lt') {
      const threshold = Number(compareValue);
      setEntityRules((prev) => [...prev, { kind: 'numeric', entityId: eid, operator, threshold }]);
    } else {
      setEntityRules((prev) => [...prev, { kind: 'state', entityId: eid, operator, value: compareValue.trim() }]);
    }
    setSelectedEntityId('');
    setEntitySearch('');
    setCompareValue('');
  };

  return (
    <ProSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      page={page}
      size="md"
      icon={EyeIcon}
      title="Visibility rules"
      subtitle={`${targetLabel} · ${summarizeVisibilityRules(draftRules)}`}
    >
      <div className="flex flex-col gap-4 pb-2">
        <p className="rounded-2xl bg-default/40 px-3 py-2 text-xs text-muted">
          All enabled conditions must match (AND). Everything stays visible in Edit Mode with a Conditional badge so you can always edit rules.
        </p>

        {allowActiveOnly ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-default/35 px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium">Show only when active</p>
              <p className="text-xs text-muted">Visible when on, open, playing, or showing an alert.</p>
            </div>
            <Switch isSelected={activeOnly} onChange={setActiveOnly} aria-label="Show only when active">
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted">Show on devices</Label>
            <span className="text-xs text-muted">{devices.length === 0 ? 'All devices' : `${devices.length} selected`}</span>
          </div>
          <ToggleButtonGroup
            aria-label="Restrict to device types"
            size="sm"
            selectionMode="multiple"
            selectedKeys={new Set(devices)}
            onSelectionChange={(keys) => {
              const selected = [...keys] as VisibilityDevice[];
              setDevices(selected.length === DEVICE_TYPES.length ? [] : selected);
            }}
          >
            {DEVICE_TYPES.map((d: DeviceType) => (
              <ToggleButton key={d} id={d} className="gap-1.5 text-xs">
                <HugeiconsIcon icon={DEVICE_ICON[d]} size={14} />
                {DEVICE_LABEL[d]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl bg-default/35 px-3.5 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">User visibility</p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm">Admins only</span>
            <Switch isSelected={adminOnly} onChange={setAdminOnly} aria-label="Restrict to admins only">
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
          </div>
          {currentUser?.id ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm">Only my account ({currentUser.name})</span>
              <Switch isSelected={onlyMe} onChange={setOnlyMe} aria-label="Restrict to current user">
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted">Entity state or numeric rules</Label>
          {entityRules.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {entityRules.map((rule, idx) => (
                <div key={`${rule.entityId}-${idx}`} className="flex items-center gap-2 rounded-xl bg-default/45 px-3 py-1.5 text-xs">
                  <span className="min-w-0 flex-1 truncate font-mono">
                    {rule.entityId} {rule.kind === 'state' ? (rule.operator === 'eq' ? '=' : '≠') : rule.operator === 'gt' ? '>' : '<'}{' '}
                    {rule.kind === 'state' ? rule.value : rule.threshold}
                  </span>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={`Remove condition for ${rule.entityId}`}
                    onPress={() => setEntityRules((prev) => prev.filter((_, i) => i !== idx))}
                    className="size-7 min-w-0 text-danger"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex flex-col gap-2 rounded-2xl border border-[color-mix(in_srgb,currentColor_12%,transparent)] p-3">
            <TextField
              aria-label="Entity ID or search"
              value={selectedEntityId || entitySearch}
              onChange={(v) => {
                setSelectedEntityId('');
                setEntitySearch(v);
              }}
            >
              <InputGroup fullWidth variant="secondary">
                <InputGroup.Input placeholder="Search entity (e.g. sun.sun, person.alex)…" />
              </InputGroup>
            </TextField>
            {!selectedEntityId && entitySearch.trim().length > 0 && entitySuggestions.length > 0 ? (
              <div className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-xl bg-default/40 p-1">
                {entitySuggestions.map((ent) => (
                  <Button
                    key={ent.entity_id}
                    size="sm"
                    variant="ghost"
                    onPress={() => {
                      setSelectedEntityId(ent.entity_id);
                      setEntitySearch(ent.entity_id);
                      if (!compareValue) setCompareValue(ent.state);
                    }}
                    className="h-auto justify-between px-2 py-1 text-left text-xs font-normal"
                  >
                    <span className="truncate font-medium">{ent.name || ent.entity_id}</span>
                    <span className="ml-2 shrink-0 text-[11px] text-muted">{ent.state}</span>
                  </Button>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <ToggleButtonGroup
                aria-label="Comparison operator"
                size="sm"
                selectionMode="single"
                disallowEmptySelection
                selectedKeys={new Set([operator])}
                onSelectionChange={(keys) => {
                  const next = [...keys][0] as OpKind | undefined;
                  if (next) setOperator(next);
                }}
              >
                <ToggleButton id="eq" className="px-2.5 text-xs">State =</ToggleButton>
                <ToggleButton id="neq" className="px-2.5 text-xs">State ≠</ToggleButton>
                <ToggleButton id="gt" className="px-2.5 text-xs">Value &gt;</ToggleButton>
                <ToggleButton id="lt" className="px-2.5 text-xs">Value &lt;</ToggleButton>
              </ToggleButtonGroup>
              <TextField
                aria-label="Comparison value"
                value={compareValue}
                onChange={setCompareValue}
                className="min-w-28 flex-1"
              >
                <InputGroup fullWidth variant="secondary">
                  <InputGroup.Input placeholder={operator === 'gt' || operator === 'lt' ? 'Number (e.g. 22)' : 'State (e.g. home, on)'} />
                </InputGroup>
              </TextField>
              <Button size="sm" variant="secondary" isDisabled={!canAddEntityRule} onPress={handleAddEntityRule} className="gap-1 text-xs">
                <HugeiconsIcon icon={PlusSignIcon} size={14} />
                Add
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Button
            size="sm"
            variant="ghost"
            isDisabled={draftRules.length === 0}
            onPress={() => {
              onSave([]);
              onOpenChange(false);
            }}
          >
            Clear all
          </Button>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onPress={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onPress={() => {
                onSave(draftRules);
                onOpenChange(false);
              }}
            >
              Apply rules
            </Button>
          </div>
        </div>
      </div>
    </ProSheet>
  );
}

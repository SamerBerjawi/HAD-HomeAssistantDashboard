import { Avatar, Badge, Button, Tag, TagGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Alert02Icon,
  BlindsIcon,
  BulbIcon,
  Door01Icon,
  DropletIcon,
  Fan01Icon,
  FireIcon,
  Home01Icon,
  Location01Icon,
  MusicNote01Icon,
  Robot01Icon,
  SecurityCheckIcon,
  Shield01Icon,
  ToggleOnIcon,
  ViewIcon,
  ViewOffSlashIcon,
  WalkingIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useHAImage } from '@/services/haImageService';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import type { OverviewPersonPillMeta, OverviewStatusPill, PillTone } from '../../lib/overviewPills';
import { BlurFade } from '../../ui/magicui/BlurFade';
import { Marquee } from '../../ui/magicui/Marquee';

const PILL_ICON_TONE: Record<PillTone, string> = {
  default: 'text-muted',
  accent: 'text-[var(--accent)]',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger'
};

function pillIcon(pill: OverviewStatusPill): IconSvgElement {
  switch (pill.kind) {
    case 'smoke':
      return FireIcon;
    case 'leak':
      return DropletIcon;
    case 'alarm':
      if (pill.tone === 'danger') return Alert02Icon;
      if (pill.tone === 'success') return SecurityCheckIcon;
      return Shield01Icon;
    case 'doors':
      return Door01Icon;
    case 'windows':
      return BlindsIcon;
    case 'motion':
      return WalkingIcon;
    case 'person':
      return pill.person?.isHome ? Home01Icon : Location01Icon;
    case 'lights':
      return BulbIcon;
    case 'switches':
      return ToggleOnIcon;
    case 'fans':
      return Fan01Icon;
    case 'vacuums':
      return Robot01Icon;
    case 'media':
      return MusicNote01Icon;
  }
}

function PersonPillAvatar({ person, serverUrl }: { person: OverviewPersonPillMeta; serverUrl: string | null }) {
  const { imageUrl } = useHAImage(person.entityPicture, serverUrl);
  return (
    <Badge.Anchor className="shrink-0">
      <Avatar
        size="sm"
        variant="soft"
        color={person.isHome ? 'success' : 'accent'}
        className="size-6 rounded-full text-[11px]"
      >
        {imageUrl ? <Avatar.Image src={imageUrl} alt={person.name} className="object-cover" /> : null}
        <Avatar.Fallback>{person.initials}</Avatar.Fallback>
      </Avatar>
      <Badge
        size="sm"
        variant="primary"
        color={person.isHome ? 'success' : 'accent'}
        placement="bottom-right"
        className="size-2 min-h-2 min-w-2 rounded-full p-0"
        aria-hidden="true"
      />
    </Badge.Anchor>
  );
}

interface StatusPillsBarProps {
  pills: OverviewStatusPill[];
  serverUrl: string | null;
  hideBadges: boolean;
  isEditMode: boolean;
  onToggleHideBadges: () => void;
  onActivatePill?: (pill: OverviewStatusPill) => void;
}

/**
 * Active status pills bar for pro Overview (docs/pro-ui/DESIGN.md 7.6): HeroUI TagGroup + Tag,
 * Avatar, Badge, and Button wrapped in Magic UI BlurFade.
 */
export function StatusPillsBar({
  pills,
  serverUrl,
  hideBadges,
  isEditMode,
  onToggleHideBadges,
  onActivatePill
}: StatusPillsBarProps) {
  const isTabletOrUp = useMediaQuery('(min-width: 768px)');

  if (hideBadges) {
    if (!isEditMode) return null;
    return (
      <BlurFade duration={0.25} offset={4}>
        <section
          aria-label="Active status pills hidden"
          className="pro-surface flex flex-wrap items-center justify-between gap-3 px-4 py-3"
        >
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
            <HugeiconsIcon icon={ViewOffSlashIcon} size={16} className="shrink-0 text-warning" />
            <span>Status pills are hidden on Overview</span>
          </span>
          <Button size="sm" variant="tertiary" onPress={onToggleHideBadges}>
            <HugeiconsIcon icon={ViewIcon} size={15} />
            Show status pills
          </Button>
        </section>
      </BlurFade>
    );
  }

  if (pills.length === 0) return null;

  const renderTagGroup = (nowrap: boolean) => (
    <TagGroup aria-label="Active home status" variant="surface" size="lg">
      <TagGroup.List className={cn('flex items-center gap-2', nowrap ? 'flex-nowrap' : 'flex-wrap')}>
        {pills.map((pill) => {
          const Icon = pillIcon(pill);
          return (
            <Tag
              key={pill.id}
              id={pill.id}
              textValue={pill.ariaLabel}
              onAction={() => onActivatePill?.(pill)}
              className="pro-surface min-h-9 shrink-0 gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover [&_svg]:size-4!"
            >
              {pill.person ? (
                <PersonPillAvatar person={pill.person} serverUrl={serverUrl} />
              ) : (
                <HugeiconsIcon icon={Icon} size={16} className={cn('shrink-0', PILL_ICON_TONE[pill.tone])} />
              )}
              <span className="font-semibold text-foreground">{pill.label}</span>
              <Badge
                size="sm"
                variant="soft"
                color={pill.tone}
                className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
              >
                {pill.person ? <HugeiconsIcon icon={Icon} size={12} className="shrink-0" /> : null}
                <Badge.Label className="max-w-44 truncate">{pill.badgeText}</Badge.Label>
              </Badge>
            </Tag>
          );
        })}
      </TagGroup.List>
    </TagGroup>
  );

  return (
    <BlurFade duration={0.25} offset={4}>
      <section aria-label="Active status pills">
        {!isTabletOrUp ? (
          <Marquee autoScroll={false} repeat={1} className="-mx-1 px-1 py-1 [--gap:0.5rem]">
            {renderTagGroup(true)}
          </Marquee>
        ) : (
          renderTagGroup(false)
        )}
      </section>
    </BlurFade>
  );
}

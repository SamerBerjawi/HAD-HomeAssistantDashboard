import { Button, Dropdown, Header, Label } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon, MoreHorizontalIcon, Tick02Icon, ViewOffSlashIcon } from '@hugeicons/core-free-icons';
import { SIZE_CELLS, SIZE_LABELS, type WidgetSize } from '../../lib/overviewLayout';

interface WidgetCardMenuProps {
  title: string;
  size: WidgetSize;
  sizes: readonly WidgetSize[];
  canMoveEarlier: boolean;
  canMoveLater: boolean;
  onSetSize: (size: WidgetSize) => void;
  onMove: (dir: -1 | 1) => void;
  onHide: () => void;
  /** Styles the widget offers, if any (WIDGET_DESIGN.md), and the one in use. */
  designs?: readonly { id: string; name: string; description: string }[];
  design?: string;
  onSetDesign?: (design: string) => void;
}

/**
 * The one edit control on a card besides the drag handle (owner decision: "⋯" menu). Size and
 * Arrange live here, so keyboard and screen-reader users can do everything a drag does.
 */
export function WidgetCardMenu({ title, size, sizes, designs, design, onSetDesign, canMoveEarlier, canMoveLater, onSetSize, onMove, onHide }: WidgetCardMenuProps) {
  const showStyles = Boolean(designs && designs.length > 1 && onSetDesign);
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={`Edit ${title}: ${SIZE_LABELS[size]}`} className="pro-touch-44 shrink-0">
        <HugeiconsIcon icon={MoreHorizontalIcon} size={18} />
      </Button>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu
          aria-label={`Edit ${title}`}
          onAction={(key) => {
            const k = String(key);
            if (k.startsWith('size:')) onSetSize(k.slice(5) as WidgetSize);
            else if (k.startsWith('style:')) onSetDesign?.(k.slice(6));
            else if (k === 'earlier') onMove(-1);
            else if (k === 'later') onMove(1);
            else if (k === 'hide') onHide();
          }}
        >
          {sizes.length > 1 ? (
            <Dropdown.Section>
              <Header>Size</Header>
              {sizes.map((s) => (
                <Dropdown.Item key={s} id={`size:${s}`} textValue={s === size ? `${SIZE_LABELS[s]}, current size` : SIZE_LABELS[s]}>
                  <HugeiconsIcon icon={Tick02Icon} size={16} className={s === size ? 'shrink-0 text-[var(--accent)]' : 'invisible shrink-0'} aria-hidden="true" />
                  <Label>{SIZE_LABELS[s]}</Label>
                  <span className="ml-auto pl-4 text-xs text-muted">
                    {SIZE_CELLS[s].w}×{SIZE_CELLS[s].h}
                  </span>
                </Dropdown.Item>
              ))}
            </Dropdown.Section>
          ) : null}
          {showStyles && designs ? (
            <Dropdown.Section>
              <Header>Style</Header>
              {designs.map((d) => (
                <Dropdown.Item key={d.id} id={`style:${d.id}`} textValue={d.id === design ? `${d.name}, current style` : d.name}>
                  <HugeiconsIcon icon={Tick02Icon} size={16} className={d.id === design ? 'shrink-0 text-[var(--accent)]' : 'invisible shrink-0'} aria-hidden="true" />
                  <span className="flex min-w-0 flex-col">
                    <Label>{d.name}</Label>
                    <span className="text-xs text-muted">{d.description}</span>
                  </span>
                </Dropdown.Item>
              ))}
            </Dropdown.Section>
          ) : null}
          <Dropdown.Section>
            <Header>Arrange</Header>
            <Dropdown.Item id="earlier" textValue="Move earlier" isDisabled={!canMoveEarlier}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} className="shrink-0" />
              <Label>Move earlier</Label>
            </Dropdown.Item>
            <Dropdown.Item id="later" textValue="Move later" isDisabled={!canMoveLater}>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="shrink-0" />
              <Label>Move later</Label>
            </Dropdown.Item>
            <Dropdown.Item id="hide" textValue="Hide">
              <HugeiconsIcon icon={ViewOffSlashIcon} size={16} className="shrink-0" />
              <Label>Hide</Label>
            </Dropdown.Item>
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

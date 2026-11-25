/**
 * Per-Tile Customization Sheet (Phase 2.4):
 * Edit custom display name, switch/plug/light display role override, and tap safety confirmation.
 * Writes granularly to `entities.customizations[entityId]`.
 */
import { useEffect, useState } from 'react';
import { Button, InputGroup, Switch, TextField } from '@heroui/react';
import { PencilEdit01Icon } from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import type { EntityDisplayRole, UserDashboardConfig } from '@/types/userConfig';
import { ProSheet } from '../../components/ProSheet';
import { SheetFilter } from '../../widgets/shared/sheet/SheetKit';

interface TileEditSheetProps {
  entityId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_OPTIONS: { id: EntityDisplayRole; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'light', label: 'Light' },
  { id: 'plug', label: 'Plug' },
  { id: 'switch', label: 'Switch' },
  { id: 'helper', label: 'Helper' }
];

export function TileEditSheet({ entityId, isOpen, onOpenChange }: TileEditSheetProps) {
  const { config, updateConfig } = useUserConfig();
  const entity = useAutoLayoutStore((s) => (entityId ? s.resolvedEntities[entityId] ?? null : null));
  const custom = entityId ? config.entities?.customizations?.[entityId] : undefined;
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setNameInput(custom?.customName || custom?.name || '');
  }, [isOpen, entityId, custom?.customName, custom?.name]);

  if (!entityId) return null;

  const saveCustomization = (patch: Record<string, unknown>) => {
    void updateConfig({
      entities: {
        customizations: {
          [entityId]: patch
        }
      }
    } as unknown as Partial<UserDashboardConfig>);
  };

  const defaultName = entity?.name || entityId;
  const domain = entity?.domain ?? entityId.split('.')[0];
  const supportsRoleOverride = domain === 'switch' || domain === 'input_boolean';
  const currentRole: EntityDisplayRole = custom?.displayRole ?? 'auto';
  const confirmAction = Boolean(custom?.confirmAction);

  const commitName = () => {
    const clean = nameInput.trim();
    if (!clean || clean === defaultName) {
      saveCustomization({ customName: null, name: null });
    } else {
      saveCustomization({ customName: clean, name: clean });
    }
  };

  return (
    <ProSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={`Edit ${custom?.customName || defaultName}`}
      subtitle={entityId}
      icon={PencilEdit01Icon}
      page="rooms"
      size="md"
    >
      <div className="flex flex-col gap-5">
        <section aria-label="Tile name" className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted">Display name</h3>
            {custom?.customName || custom?.name ? (
              <Button
                size="sm"
                variant="ghost"
                onPress={() => {
                  setNameInput('');
                  saveCustomization({ customName: null, name: null });
                }}
                className="h-6 px-2 text-xs"
              >
                Reset
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <TextField aria-label="Tile display name" value={nameInput} onChange={setNameInput} className="min-w-0 flex-1">
              <InputGroup fullWidth variant="secondary">
                <InputGroup.Input
                  placeholder={defaultName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitName();
                  }}
                />
              </InputGroup>
            </TextField>
            <Button size="sm" variant="secondary" onPress={commitName} className="h-10 px-3 text-xs">
              Apply
            </Button>
          </div>
        </section>

        {supportsRoleOverride ? (
          <section aria-label="Display role" className="flex flex-col gap-2">
            <div>
              <h3 className="text-xs font-semibold text-muted">Display as</h3>
              <p className="text-xs text-muted">Treat a smart plug switching a lamp as a Light so it joins the Lights section and room light counts.</p>
            </div>
            <SheetFilter
              label="Display role"
              value={currentRole}
              onChange={(role) => saveCustomization({ displayRole: role === 'auto' ? null : role })}
              options={ROLE_OPTIONS}
            />
          </section>
        ) : null}

        <section aria-label="Tap safety" className="flex items-center justify-between gap-3 rounded-2xl bg-default/40 p-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Require confirmation</span>
            <span className="text-xs text-muted">Prompt before toggling, unlocking, or activating on tap</span>
          </div>
          <Switch
            size="sm"
            isSelected={confirmAction}
            onChange={() => saveCustomization({ confirmAction: !confirmAction ? true : null })}
            aria-label="Require confirmation before action"
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
        </section>
      </div>
    </ProSheet>
  );
}

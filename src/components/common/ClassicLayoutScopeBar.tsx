/**
 * Classic UI Multi-User Layout Sharing Bar (Phase 4):
 * Uses `react-aria-components` Button + `base/toggle` so zero raw HTML controls are added.
 */
import { Button as AriaButton } from 'react-aria-components';
import { Toggle } from '../base/toggle/toggle';
import type { ClassicLayoutScopeApi } from '../../hooks/useClassicLayoutScope';

interface ClassicLayoutScopeBarProps {
  layoutScope: ClassicLayoutScopeApi;
  compact?: boolean;
}

export function ClassicLayoutScopeBar({ layoutScope, compact = false }: ClassicLayoutScopeBarProps) {
  const { scope, setAdminTarget, toggleShareEnabled, forkToPersonal, revertToShared } = layoutScope;

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-xs ${compact ? 'pt-1' : ''}`}>
      {scope.isAdmin ? (
        <>
          <Toggle
            size="sm"
            isSelected={scope.shareEnabled}
            onChange={(selected) => void toggleShareEnabled(selected)}
            label="Share layout with all users"
          />
          {scope.shareEnabled ? (
            <div className="inline-flex items-center rounded-xl bg-slate-200/70 p-0.5 dark:bg-white/10">
              <AriaButton
                onPress={() => setAdminTarget('shared')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  scope.activeTarget === 'shared'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                Shared layout
              </AriaButton>
              <AriaButton
                onPress={() => setAdminTarget('personal')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  scope.activeTarget === 'personal'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                My layout
              </AriaButton>
            </div>
          ) : null}
        </>
      ) : scope.shareEnabled ? (
        scope.activeTarget === 'personal' ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-sky-500/15 px-2.5 py-1 font-bold text-sky-700 dark:text-sky-300">
              Personal layout
            </span>
            <AriaButton
              onPress={() => void revertToShared()}
              className="rounded-xl bg-slate-200/80 px-2.5 py-1 font-bold text-slate-700 hover:bg-slate-300 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20 cursor-pointer"
            >
              Revert to shared
            </AriaButton>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-200/70 px-2.5 py-1 font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
              Following Shared layout
            </span>
            <AriaButton
              onPress={() => void forkToPersonal()}
              className="rounded-xl bg-sky-500 px-2.5 py-1 font-bold text-white shadow-xs hover:bg-sky-400 cursor-pointer"
            >
              Customize my own
            </AriaButton>
          </div>
        )
      ) : (
        <span className="rounded-full bg-slate-200/70 px-2.5 py-1 font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
          Personal layout (sharing off)
        </span>
      )}
    </div>
  );
}

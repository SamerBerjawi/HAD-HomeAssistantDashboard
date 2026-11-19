import { useEffect, useState } from 'react';
import { Button, InputOTP, REGEXP_ONLY_DIGITS } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Key01Icon,
  ViewIcon,
  ViewOffSlashIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ProSheet } from '../ProSheet';

interface AlarmCodeSheetProps {
  isOpen: boolean;
  /** "arm Away", "disarm". */
  actionLabel: string;
  numeric: boolean;
  error?: string | null;
  onCancel: () => void;
  onSubmit: (code: string) => void;
}

const MAX = 8;
const STEADY_SLOTS = 6;

/**
 * PIN entry for alarm changes that HA says need a code (DESIGN.md 7.5): steady-width slots
 * (no horizontal layout jump), masked dots by default for wall-tablet privacy with a reveal toggle,
 * and a number pad for numeric codes.
 */
export function AlarmCodeSheet({
  isOpen,
  actionLabel,
  numeric,
  error,
  onCancel,
  onSubmit
}: AlarmCodeSheetProps) {
  const [code, setCode] = useState('');
  const [masked, setMasked] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setMasked(true);
    }
  }, [isOpen]);

  const slots = code.length > STEADY_SLOTS ? Math.min(MAX, code.length) : STEADY_SLOTS;
  const press = (d: string) => setCode((c) => (c.length < MAX ? c + d : c));
  const canSubmit = code.length >= 4 || (!numeric && code.length > 0);

  return (
    <ProSheet
      isOpen={isOpen}
      onOpenChange={(open) => !open && onCancel()}
      title={`Enter code to ${actionLabel}`}
      icon={Key01Icon}
      page="security"
    >
      <form
        className="flex flex-col items-center gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onSubmit(code);
        }}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <InputOTP
              maxLength={slots}
              value={code}
              onChange={setCode}
              pattern={numeric ? REGEXP_ONLY_DIGITS : undefined}
              inputMode={numeric ? 'numeric' : 'text'}
              autoFocus
              isInvalid={!!error}
              aria-label="Alarm code"
              className="justify-center"
            >
              <InputOTP.Group>
                {Array.from({ length: slots }, (_, i) => (
                  <InputOTP.Slot
                    key={i}
                    index={i}
                    className={cn(masked && i < code.length && 'relative text-transparent')}
                  />
                ))}
              </InputOTP.Group>
            </InputOTP>
            {masked && code.length > 0 ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))` }}>
                  {Array.from({ length: slots }, (_, i) => (
                    <span key={i} className="grid place-items-center text-lg font-bold text-foreground">
                      {i < code.length ? '•' : ''}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={masked ? 'Show code' : 'Hide code'}
            onPress={() => setMasked((m) => !m)}
          >
            <HugeiconsIcon icon={masked ? ViewIcon : ViewOffSlashIcon} size={16} />
          </Button>
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}

        {numeric && (
          <div className="grid w-full max-w-64 grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <Button
                key={d}
                variant="tertiary"
                size="lg"
                className="text-lg font-semibold"
                onPress={() => press(d)}
              >
                {d}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="lg"
              isIconOnly
              aria-label="Delete last digit"
              className="w-full"
              onPress={() => setCode((c) => c.slice(0, -1))}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
            </Button>
            <Button
              variant="tertiary"
              size="lg"
              className="text-lg font-semibold"
              onPress={() => press('0')}
            >
              0
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isIconOnly
              aria-label="Confirm code"
              className="w-full"
              isDisabled={!canSubmit}
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
            </Button>
          </div>
        )}
        {!numeric && (
          <Button type="submit" variant="primary" isDisabled={!canSubmit}>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
            Confirm
          </Button>
        )}
      </form>
    </ProSheet>
  );
}

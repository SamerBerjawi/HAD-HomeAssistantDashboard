import { useEffect, useState } from 'react';
import { Button, InputOTP, REGEXP_ONLY_DIGITS } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, CheckmarkCircle02Icon, Key01Icon } from '@hugeicons/core-free-icons';
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

/**
 * PIN entry for alarm changes that HA says need a code (DESIGN.md 7.5): HeroUI InputOTP whose slots
 * grow as you type (codes are 4–8 long), plus a number pad for numeric codes.
 */
export function AlarmCodeSheet({ isOpen, actionLabel, numeric, error, onCancel, onSubmit }: AlarmCodeSheetProps) {
  const [code, setCode] = useState('');
  useEffect(() => {
    if (isOpen) setCode('');
  }, [isOpen]);

  const slots = Math.min(MAX, Math.max(4, code.length + 1));
  const press = (d: string) => setCode((c) => (c.length < MAX ? c + d : c));
  const canSubmit = code.length >= 4 || (!numeric && code.length > 0);

  return (
    <ProSheet isOpen={isOpen} onOpenChange={(open) => !open && onCancel()} title={`Enter code to ${actionLabel}`} icon={Key01Icon} page="security">
      <form
        className="flex flex-col items-center gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onSubmit(code);
        }}
      >
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
              <InputOTP.Slot key={i} index={i} />
            ))}
          </InputOTP.Group>
        </InputOTP>
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}

        {numeric && (
          <div className="grid w-full max-w-64 grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <Button key={d} variant="tertiary" size="lg" className="text-lg font-semibold" onPress={() => press(d)}>
                {d}
              </Button>
            ))}
            <Button variant="ghost" size="lg" isIconOnly aria-label="Delete last digit" className="w-full" onPress={() => setCode((c) => c.slice(0, -1))}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
            </Button>
            <Button variant="tertiary" size="lg" className="text-lg font-semibold" onPress={() => press('0')}>
              0
            </Button>
            <Button type="submit" variant="primary" size="lg" isIconOnly aria-label="Confirm code" className="w-full" isDisabled={!canSubmit}>
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

import { AlertDialog, Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { Alert02Icon, Clock01Icon, DropletIcon, FireIcon, Location01Icon, Shield01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { useAlertStore } from '@/store/useAlertStore';
import { cleanTitle } from '../../lib/toastLogic';

const ICON: Record<string, IconSvgElement> = {
  smoke: FireIcon,
  gas: Alert02Icon,
  co: Alert02Icon,
  moisture: DropletIcon,
  safety: Alert02Icon,
  alarm: Shield01Icon,
  hazard: Alert02Icon
};

/**
 * Emergency alert (DESIGN.md 7.8): red full-screen HeroUI AlertDialog until acknowledged. The red
 * toast that comes with it (alert store, timeout 0) closes on acknowledge.
 */
export default function ProEmergencyAlert({ onOpenSecurity }: { onOpenSecurity: () => void }) {
  const alert = useAlertStore((s) => s.criticalAlert);
  const acknowledge = useAlertStore((s) => s.acknowledgeCriticalAlert);
  const removeToast = useAlertStore((s) => s.removeToast);
  const open = Boolean(alert && !alert.acknowledged);

  const ack = () => {
    if (alert) removeToast(alert.id);
    acknowledge();
  };

  return (
    <AlertDialog.Backdrop isOpen={open} isDismissable={false} className="bg-danger/25 backdrop-blur-sm">
      <AlertDialog.Container size="sm">
        <AlertDialog.Dialog className="pro" data-page="security" role="alertdialog">
          {alert && (
            <>
              <AlertDialog.Header className="flex flex-col items-center gap-3 text-center">
                <span className="grid size-16 place-items-center rounded-2xl bg-danger text-danger-foreground motion-safe:animate-pulse">
                  <HugeiconsIcon icon={ICON[alert.sensorType] ?? Alert02Icon} size={32} />
                </span>
                <AlertDialog.Heading className="text-xl font-semibold text-danger">{cleanTitle(alert.title)}</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm">{alert.message}</p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-muted">
                  {alert.areaName && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-default px-2.5 py-1">
                      <HugeiconsIcon icon={Location01Icon} size={14} />
                      {alert.areaName}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-default px-2.5 py-1">
                    <HugeiconsIcon icon={Clock01Icon} size={14} />
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </AlertDialog.Body>
              <AlertDialog.Footer className="flex-col-reverse gap-2 sm:flex-row">
                <Button
                  variant="tertiary"
                  className="w-full sm:w-auto"
                  onPress={() => {
                    ack();
                    onOpenSecurity();
                  }}
                >
                  <HugeiconsIcon icon={Shield01Icon} size={16} />
                  Open Security
                </Button>
                <Button variant="danger" className="w-full sm:w-auto" autoFocus onPress={ack}>
                  <HugeiconsIcon icon={Tick02Icon} size={16} />
                  Acknowledge
                </Button>
              </AlertDialog.Footer>
            </>
          )}
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}

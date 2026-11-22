/**
 * The car's picture (owner, 2026-11-21): the picture Home Assistant has for the car, the owner's
 * own upload, or none (a plain car outline). Used by the studio's Car tools and, while customizing,
 * by the real Area page (uploads go to `/api/assets`: PNG, JPEG or WebP up to 5 MB).
 */
import { Button } from '@heroui/react';
import { FileTrigger } from 'react-aria-components';
import { HugeiconsIcon } from '@hugeicons/react';
import { Car01Icon, ImageUploadIcon, Cancel01Icon } from '@hugeicons/core-free-icons';

export type CarPictureSource = 'entity' | 'upload' | 'none';

interface Props {
  label: string;
  source: CarPictureSource;
  onSource: (s: Exclude<CarPictureSource, 'upload'>) => void;
  onUpload: (file: File) => void;
  busy?: boolean;
  error?: string | null;
}

export function CarPictureControl({ label, source, onSource, onUpload, busy, error }: Props) {
  const opt = (id: CarPictureSource, text: string, icon: typeof Car01Icon, onPress: () => void) => (
    <Button size="sm" variant={source === id ? 'primary' : 'secondary'} aria-pressed={source === id} isDisabled={busy} onPress={onPress} className="gap-1.5 text-xs">
      <HugeiconsIcon icon={icon} size={14} />
      {text}
    </Button>
  );
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {opt('entity', 'From the car', Car01Icon, () => onSource('entity'))}
        <FileTrigger acceptedFileTypes={['image/png', 'image/jpeg', 'image/webp']} onSelect={(files) => files?.[0] && onUpload(files[0])}>
          {opt('upload', busy ? 'Uploading…' : 'Upload your own…', ImageUploadIcon, () => undefined)}
        </FileTrigger>
        {opt('none', 'None', Cancel01Icon, () => onSource('none'))}
      </div>
      {error ? <span className="text-xs text-[hsl(4_82%_54%)]">{error}</span> : null}
    </div>
  );
}

/**
 * Studio control for the car's picture: the page's `CarPictureControl` editing the live mock car.
 * In the studio the upload stays in the browser (a data URL); the real page uploads it.
 */
import type { CarTileModel } from '../tileTypes';
import { CarPictureControl } from '../page/CarPictureControl';
import { CAR_PICTURE } from './mockArt';

export default function CarPictureTool({ e, onChange }: { e: CarTileModel; onChange: (m: CarTileModel) => void }) {
  const pick = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' && onChange({ ...e, uploadedPicture: reader.result });
    reader.readAsDataURL(file);
  };
  return (
    <CarPictureControl
      label="Car picture"
      source={e.uploadedPicture ? 'upload' : e.picture ? 'entity' : 'none'}
      onSource={(s) => onChange(s === 'entity' ? { ...e, picture: CAR_PICTURE, uploadedPicture: null } : { ...e, picture: null, uploadedPicture: null })}
      onUpload={pick}
    />
  );
}

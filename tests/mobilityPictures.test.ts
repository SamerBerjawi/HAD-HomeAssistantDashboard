import { describe, expect, it } from 'vitest';
import type { HAState } from '@/types';
import { devicePicture, type Device, type HaContext } from '@/pro/lib/mobility/kit';
import { applyVehiclePicture, isSignedHaPicture, pictureSource, vehiclePictureRaw, vehiclePictures } from '@/pro/lib/mobility/pictures';
import { studioMobilityHome } from '@/pro/lib/mobility/sampleVehicles';

const st = (entity_id: string, attributes: Record<string, unknown> = {}): HAState => ({ entity_id, state: 'on', attributes, last_updated: '', last_changed: '' }) as HAState;

describe('vehicle pictures', () => {
  it('takes the integration’s picture, an image entity before the tracker', () => {
    const d: Device = { id: 'dev', info: null, entries: [{ entity_id: 'device_tracker.car' }, { entity_id: 'sensor.car_soc' }, { entity_id: 'image.car' }] as Device['entries'] };
    const ctx = { states: { 'device_tracker.car': st('device_tracker.car', { entity_picture: '/api/tracker.png' }), 'sensor.car_soc': st('sensor.car_soc'), 'image.car': st('image.car', { entity_picture: '/api/image_proxy/image.car?token=x' }) }, registry: [], devices: [], zones: [], now: 0 } as HaContext;
    expect(devicePicture(d, ctx)).toBe('/api/image_proxy/image.car?token=x');
    expect(devicePicture({ ...d, entries: [{ entity_id: 'sensor.car_soc' }] as Device['entries'] }, ctx)).toBeNull();
  });

  it('shows the owner’s choice first, then the integration’s, and none when asked', () => {
    const car = { ...studioMobilityHome('ready').vehicles[0], image: null, picture: '/api/ha.png', deviceId: 'dev' };
    expect(vehiclePictureRaw(applyVehiclePicture(car, {}))).toBe('/api/ha.png');
    expect(pictureSource(car, {})).toBe('entity');
    expect(vehiclePictureRaw(applyVehiclePicture(car, { dev: '/api/assets/mine.png' }))).toBe('/api/assets/mine.png');
    expect(pictureSource(car, { dev: '/api/assets/mine.png' })).toBe('upload');
    expect(vehiclePictureRaw(applyVehiclePicture(car, { dev: 'none' }))).toBeNull();
    expect(pictureSource(car, { dev: 'none' })).toBe('none');
    // Another car's choice does not apply.
    expect(vehiclePictureRaw(applyVehiclePicture(car, { other: 'none' }))).toBe('/api/ha.png');
  });

  it('shows HA’s signed image links directly and tries the next picture after one', () => {
    expect(isSignedHaPicture('/api/image_proxy/image.car_vehicle_image?token=abc&time=1')).toBe(true);
    expect(isSignedHaPicture('https://ha.local:8123/api/camera_proxy/camera.drive?token=abc')).toBe(true);
    expect(isSignedHaPicture('/api/image/serve/abc/512x512')).toBe(false);
    expect(isSignedHaPicture('/api/image_proxy/image.car')).toBe(false);
    const car = { ...studioMobilityHome('ready').vehicles[0], image: '/api/assets/old.png', picture: '/api/image_proxy/image.car?token=x' };
    expect(vehiclePictures(car)).toEqual(['/api/assets/old.png', '/api/image_proxy/image.car?token=x']);
  });
});

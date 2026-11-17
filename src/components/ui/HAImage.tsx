/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useHAImage } from '../../services/haImageService';
import { useAutoLayoutStore } from '../../store/useAutoLayoutStore';

type HAImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
};

/**
 * <img> for Home Assistant artwork. Protected HA URLs are fetched with the Bearer token and shown
 * as blob URLs; nothing is rendered until then, so the browser never sends an unauthenticated
 * request to HA (which logs a "Login attempt failed" notification).
 */
function HAImage({ src, ...imgProps }: HAImageProps) {
  const serverUrl = useAutoLayoutStore((s) => s.serverUrl);
  const { imageUrl } = useHAImage(src, serverUrl);
  if (!imageUrl) return null;
  return <img {...imgProps} src={imageUrl} />;
}

export default React.memo(HAImage);

import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import {resolve} from 'node:path';
const adapter=(name:string)=>resolve('packages/lovelace-cards/pro/'+name);
export default defineConfig({
  plugins:[react(),tailwind()],
  resolve:{alias:[
    {find:/^@\/(store\/useAutoLayoutStore|contexts\/ConfigContext|lib\/cameraSources|services\/haImageService)$/,replacement:adapter('runtime.tsx')},
    {find:/^\.\.?\/(?:.*\/)?(useServiceCall|useHaPicture|useSheetParam|useLayoutScope|shared\/navigate)$/,replacement:adapter('runtime.tsx')},
    {find:'@/services/haWebSocket',replacement:adapter('request.ts')},
    {find:/^(?:\.\.\/)+components\/security\/ProCameraPlayer$/,replacement:adapter('camera.tsx')},
    {find:'@/services/cameraIntegrationService',replacement:adapter('camera.tsx')},
    {find:'@',replacement:resolve('src')},
  ]},
  define:{'process.env.NODE_ENV':'"production"'},
  publicDir:false,
  build:{outDir:'build/at-home-cards',lib:{entry:resolve('packages/lovelace-cards/pro/cards.tsx'),formats:['es'],fileName:()=>'at-home-cards.js'},rollupOptions:{output:{inlineDynamicImports:true}},reportCompressedSize:false},
});

import { defineConfig } from './src/libs/next/config/define-config';

const isVercel = !!process.env.VERCEL_ENV;

// English-only deployment: keep non-English translations out of serverless functions so
// the bundles stay under the Hobby plan's function limit. Server translation falls back
// to the bundled English source when a locale file is missing.
const NON_EN_LOCALES =
  '{ar,bg-BG,de-DE,es-ES,fa-IR,fr-FR,it-IT,ja-JP,ko-KR,nl-NL,pl-PL,pt-BR,ru-RU,tr-TR,vi-VN,zh-CN,zh-TW}';

const vercelConfig = {
  // Vercel serverless optimization: exclude musl binaries from all routes
  // Vercel uses Amazon Linux (glibc), not Alpine Linux (musl)
  // This saves ~16MB (sharp-musl) per serverless function
  outputFileTracingExcludes: {
    '*': [
      'node_modules/.pnpm/@img+sharp-libvips-*musl*',
      // Exclude SPA/desktop/mobile build artifacts from serverless functions
      'public/_spa/**',
      'dist/desktop/**',
      'dist/mobile/**',
      'apps/desktop/**',
      'packages/database/migrations/**',
      `locales/${NON_EN_LOCALES}/**`,
      `.next/server/chunks/locales_${NON_EN_LOCALES}_*`,
    ],
  },
};
const nextConfig = defineConfig({
  ...(isVercel ? vercelConfig : {}),
});

export default nextConfig;

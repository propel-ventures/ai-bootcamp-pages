import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

const rawBasePath = process.env.BASE_PATH ?? '/ai-bootcamp-pages';
const basePath =
  rawBasePath === '/'
    ? '/'
    : `/${rawBasePath.replace(/^\/+|\/+$/g, '')}`;

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://propel-ventures.github.io',
  base: basePath,
  integrations: [react(), tailwind()],
  output: 'static',
  trailingSlash: 'always',
});

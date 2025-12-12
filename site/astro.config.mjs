import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://propel-ventures.github.io',
  base: '/ai-bootcamp-pages',
  integrations: [react(), tailwind()],
  output: 'static',
  trailingSlash: 'always',
});

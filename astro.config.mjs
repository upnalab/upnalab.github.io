import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// Support both custom domain (https://upnalab.com/) and GitHub Pages project preview (https://<user>.github.io/<repo>/)
const base = process.env.ASTRO_BASE_URL || '/';

export default defineConfig({
  site: 'https://upnalab.com',
  base: base,
  integrations: [tailwind(), sitemap()],
  output: 'static',
  build: {
    format: 'directory'
  }
});

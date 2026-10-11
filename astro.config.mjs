import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Support both custom domain (https://upnalab.com/) and GitHub Pages project preview (https://<user>.github.io/<repo>/)
const base = process.env.ASTRO_BASE_URL || '/';

export default defineConfig({
  site: 'https://upnalab.com',
  base: base,
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()]
  },
  output: 'static',
  build: {
    format: 'directory'
  },
  // Old URLs that must keep working (slug typos fixed, pages merged)
  redirects: {
    '/all-projects': '/',
    '/project/explouring-mountains-with-tangibles-and-vr': '/project/exploring-mountains-with-tangibles-and-vr',
    '/project/sliceview-content-for-a-multiview-afrodable-display': '/project/sliceview-content-for-a-multiview-affordable-display'
  }
});

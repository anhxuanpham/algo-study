import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://algo-study.example.com',
  output: 'static',
  integrations: [mdx(), react(), sitemap()],
  vite: {
    build: {
      cssCodeSplit: true,
    },
  },
});

import { URL } from 'node:url';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://algo-study.example.com',
  output: 'static',
  integrations: [
    mdx(),
    react(),
    sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/content-preview/') }),
  ],
  vite: {
    build: {
      cssCodeSplit: true,
    },
  },
});

import process from 'node:process';
import { URL } from 'node:url';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

const githubPages = process.env.GITHUB_PAGES === 'true';
const site = githubPages
  ? 'https://anhxuanpham.github.io'
  : 'https://anhxuanpham.github.io/algo-study';
const base = githubPages ? '/algo-study/' : '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  integrations: [
    mdx(),
    react(),
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname;
        return !pathname.includes('/content-preview');
      },
    }),
  ],
  vite: {
    build: {
      cssCodeSplit: true,
    },
  },
});

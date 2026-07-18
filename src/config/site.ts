export const siteConfig = {
  name: 'Algo Study',
  shortName: 'AS',
  description:
    'Nền tảng học thuật toán bằng tiếng Việt, tập trung vào tư duy, trực quan hóa và luyện tập có chủ đích.',
  locale: 'vi-VN',
  lang: 'vi',
  canonicalUrl: 'https://anhxuanpham.github.io/algo-study',
  navigation: [
    { href: '/', label: 'Tổng quan' },
    { href: '/learn/', label: 'Học' },
    { href: '/foundation-preview/', label: 'Foundation' },
  ],
} as const;

export type SiteConfig = typeof siteConfig;

/** Prefix app paths with Astro `base` (needed on GitHub Pages project sites). */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  const normalized = path.replace(/^\//, '');
  return `${base.endsWith('/') ? base : `${base}/`}${normalized}`;
}

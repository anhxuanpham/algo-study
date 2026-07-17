export const siteConfig = {
  name: 'Algo Study',
  shortName: 'AS',
  description:
    'Nền tảng học thuật toán bằng tiếng Việt, tập trung vào tư duy, trực quan hóa và luyện tập có chủ đích.',
  locale: 'vi-VN',
  lang: 'vi',
  canonicalUrl: 'https://algo-study.example.com',
  navigation: [
    { href: '/', label: 'Tổng quan' },
    { href: '/foundation-preview/', label: 'Foundation' },
  ],
} as const;

export type SiteConfig = typeof siteConfig;

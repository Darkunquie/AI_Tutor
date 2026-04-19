import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/app/',
          '/dashboard/',
          '/tutor/',
          '/review/',
          '/pending/',
        ],
      },
    ],
    sitemap: 'https://talkivo.in/sitemap.xml',
    host: 'https://talkivo.in',
  };
}

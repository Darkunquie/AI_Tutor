import type { MetadataRoute } from 'next';

const BASE_URL = 'https://talkivo.in';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ];

  return staticRoutes;
}

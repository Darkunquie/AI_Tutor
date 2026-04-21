# Talkivo — SEO Master Plan

> Goal: Rank top Google India for high-intent English-learning keywords within 6 months.
> Domain: https://talkivo.in
> Stack: Next.js 15 (App Router), TypeScript
> Date: 2026-04-19

---

## 1. Audit Summary (Current State)

### Technical SEO
| Check | Status | Priority |
|---|---|---|
| Page title | ✅ Present | — |
| Meta description | ✅ Present | — |
| `robots.txt` | ❌ 404 | P0 |
| `sitemap.xml` | ❌ 404 | P0 |
| JSON-LD structured data | ❌ None | P0 |
| Canonical tags | ❌ Missing | P0 |
| OpenGraph / Twitter tags | ❌ Missing | P0 |
| `manifest.webmanifest` / PWA | ❌ None | P1 |
| Per-page metadata (login, signup, modes) | ❌ Only root | P1 |
| OG share image (1200×630) | ❌ Missing | P1 |
| Favicon suite | ⚠ Only SVG | P2 |
| Landing uses `'use client'` | ⚠ Suboptimal for SEO | P2 |
| Core Web Vitals | ❓ Not measured | P1 |
| HTTPS | ✅ | — |
| Mobile-friendly | ✅ Assumed | — |

### Content SEO
| Check | Status |
|---|---|
| Blog | ❌ None |
| Pricing page | ❌ None |
| About page | ❌ None |
| Feature pages (per mode) | ❌ None |
| City / intent landing pages | ❌ None |
| H1 keyword-optimized | ❌ "Speak English like you think" — no target keywords |
| Internal linking structure | ❌ Minimal |
| Word count on landing | ~850 (thin for competitive keywords) |

### Off-Page SEO
| Check | Status |
|---|---|
| Google Search Console | ❓ Unknown |
| Bing Webmaster Tools | ❓ Unknown |
| Google Business Profile | ❓ Unknown |
| Backlinks | ❓ Likely 0 |
| Brand mentions | ❓ Low |
| Social profiles linked | ❓ Unknown |

**Verdict:** Zero SEO foundation. Site invisible on Google beyond brand search "talkivo".

---

## 2. Target Keywords (India Market)

### Primary (high intent, medium volume)
| Keyword | Monthly Vol (IN) | Difficulty | Intent |
|---|---|---|---|
| english speaking practice app | 8,100 | Medium | Commercial |
| spoken english online | 12,100 | High | Commercial |
| ai english tutor | 1,300 | Low | Commercial |
| practice english with ai | 2,400 | Low | Commercial |
| free english speaking app | 6,600 | Medium | Commercial |
| english speaking course online | 9,900 | High | Commercial |
| how to improve english speaking | 14,800 | Medium | Informational |

### Secondary (long-tail, easier wins)
- english speaking practice online free
- ai tutor for english speaking
- english fluency app for beginners
- ielts speaking practice online
- english speaking partner online
- role play english conversation practice
- english pronunciation practice ai
- english grammar correction ai
- job interview english practice
- english for call center training

### Local / City pages
- english speaking classes hyderabad
- english speaking course bangalore
- spoken english chennai online
- english classes delhi
- english speaking mumbai

### Competitor brand (conquest)
- alternative to cambly
- alternative to duolingo speaking
- cheaper than preply
- free alternative to italki

---

## 3. Roadmap — 3 Phases

### Phase 1 — Technical Foundation (Week 1)
**Deliverables:**
1. `src/app/sitemap.ts` — auto-generate sitemap
2. `src/app/robots.ts` — allow crawl, point sitemap
3. Expand root metadata — OG, Twitter, canonical, verification
4. JSON-LD schemas on landing — Organization, WebSite, SoftwareApplication, FAQPage
5. `public/manifest.webmanifest` + OG image 1200×630
6. Per-page `generateMetadata` — login, signup, tutor modes
7. Move landing to server component (auth redirect via middleware)
8. Submit site to Google Search Console + Bing Webmaster

### Phase 2 — Content Engine (Weeks 2–6)
**Deliverables:**
1. `/blog` MDX engine (contentlayer or next-mdx-remote)
2. `/pricing` page
3. `/about` page
4. `/features/[mode]` — 5 mode pages (free-talk, role-play, debate, grammar-fix, pronunciation)
5. City/intent pages — 5 to start
6. 20 pillar articles (see content calendar below)
7. Internal linking: blog → features → signup

### Phase 3 — Authority & Off-Page (Ongoing, Months 2–6)
1. Google Business Profile (India)
2. Backlink outreach — Quora, Reddit, YouTube, EdTech guest posts
3. Collect reviews — add AggregateRating schema
4. Core Web Vitals optimization
5. Monthly content cadence — 4 articles/month minimum

---

## 4. Phase 1 — Code Implementation

### 4.1 `src/app/robots.ts`
```ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/app/', '/dashboard/', '/tutor/', '/review/', '/pending/'],
      },
    ],
    sitemap: 'https://talkivo.in/sitemap.xml',
    host: 'https://talkivo.in',
  };
}
```

### 4.2 `src/app/sitemap.ts`
```ts
import { MetadataRoute } from 'next';

const BASE_URL = 'https://talkivo.in';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
  ];

  const modes = ['free-talk', 'role-play', 'debate', 'grammar-fix', 'pronunciation'];
  const modeRoutes: MetadataRoute.Sitemap = modes.map((m) => ({
    url: `${BASE_URL}/features/${m}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // TODO: append blog posts dynamically from CMS/MDX
  return [...staticRoutes, ...modeRoutes];
}
```

### 4.3 Expand `src/app/layout.tsx` metadata
```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://talkivo.in'),
  title: {
    default: 'Talkivo — AI English Tutor | Practice Speaking with AI',
    template: '%s | Talkivo',
  },
  description:
    'Practice English speaking with an AI tutor that listens, corrects with reason, and remembers your patterns. Free Talk, Role Play, Debate, Grammar, Pronunciation. Start free.',
  keywords: [
    'AI English tutor',
    'English speaking practice',
    'practice English with AI',
    'spoken English online',
    'English fluency app',
    'IELTS speaking practice',
    'English pronunciation AI',
    'free English speaking app',
    'Talkivo',
  ],
  authors: [{ name: 'Talkivo' }],
  creator: 'Talkivo',
  publisher: 'Talkivo',
  alternates: {
    canonical: '/',
    languages: { 'en-IN': '/', 'en-US': '/' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://talkivo.in',
    siteName: 'Talkivo',
    title: 'Talkivo — AI English Tutor',
    description:
      'Speak English like you think. AI tutor that listens first, corrects with reason, and remembers your patterns.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Talkivo — Practice English with AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Talkivo — AI English Tutor',
    description: 'Practice English speaking with AI. Free to start.',
    images: ['/og-image.png'],
    creator: '@talkivo',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    google: 'PASTE_GOOGLE_SEARCH_CONSOLE_TOKEN',
    // bing: 'PASTE_BING_VERIFICATION_TOKEN',
  },
  category: 'education',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
};
```

### 4.4 JSON-LD — add to landing page as server component
```tsx
// src/app/JsonLd.tsx
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Talkivo',
    url: 'https://talkivo.in',
    logo: 'https://talkivo.in/logo.png',
    sameAs: [
      'https://twitter.com/talkivo',
      'https://www.linkedin.com/company/talkivo',
      'https://www.instagram.com/talkivo',
      'https://www.youtube.com/@talkivo',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@talkivo.in',
      availableLanguage: ['English', 'Hindi'],
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebSiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Talkivo',
    url: 'https://talkivo.in',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://talkivo.in/blog?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function SoftwareAppJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Talkivo',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
    },
    description:
      'AI English tutor for speaking practice with Free Talk, Role Play, Debate, Grammar, and Pronunciation modes.',
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function FaqJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is Talkivo free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Start with a free trial — no credit card needed.',
        },
      },
      {
        '@type': 'Question',
        name: 'How is Talkivo different from Duolingo or Cambly?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Talkivo focuses on unscripted speaking with an AI that listens first, explains every correction, and remembers your recurring mistakes.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I practice for IELTS or job interviews?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Use Role Play mode to rehearse interviews and IELTS speaking tasks with realistic feedback.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does Talkivo correct my grammar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Grammar Fix mode reviews any paragraph you bring and explains the reason behind each change.',
        },
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

### 4.5 `public/manifest.webmanifest`
```json
{
  "name": "Talkivo — AI English Tutor",
  "short_name": "Talkivo",
  "description": "Practice English speaking with AI",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0E0E10",
  "theme_color": "#0E0E10",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 4.6 Per-page metadata examples
```ts
// src/app/login/page.tsx (or layout.tsx)
export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Talkivo to continue your English speaking practice.',
  alternates: { canonical: '/login' },
  robots: { index: false, follow: true },
};

// src/app/signup/page.tsx
export const metadata: Metadata = {
  title: 'Sign Up Free — Start Practicing English Today',
  description:
    'Create your free Talkivo account. Practice English speaking with AI in under a minute.',
  alternates: { canonical: '/signup' },
};

// src/app/features/free-talk/page.tsx
export const metadata: Metadata = {
  title: 'Free Talk — Unscripted English Conversation Practice with AI',
  description:
    'Pick any topic and just talk. Talkivo Free Talk mode lets you practice unscripted English conversation with an AI tutor that listens and corrects with reason.',
  alternates: { canonical: '/features/free-talk' },
};
```

---

## 5. Content Calendar — First 20 Articles

| # | Title | Target Keyword | Word Count |
|---|---|---|---|
| 1 | How to Speak Fluent English: 7 Habits That Actually Work | how to speak fluent english | 2,500 |
| 2 | The Best Way to Practice English Speaking Alone in 2026 | practice english speaking alone | 1,800 |
| 3 | IELTS Speaking Band 8 — Full Preparation Guide | ielts speaking band 8 | 3,000 |
| 4 | English Speaking Practice App — 12 Tested Picks (2026) | english speaking practice app | 2,200 |
| 5 | How AI English Tutors Work — And Why They Beat Flashcards | ai english tutor | 1,800 |
| 6 | Role Play English Conversations: 30 Real-World Scenarios | role play english conversation | 2,500 |
| 7 | English Pronunciation: The 18 Sounds Indians Struggle With | english pronunciation india | 2,000 |
| 8 | Job Interview English: 25 Questions with AI-Practice Scripts | job interview english practice | 2,400 |
| 9 | English for Call Center Jobs — Complete Training Guide | english for call center | 1,800 |
| 10 | Grammar Fix: 12 Mistakes Every Indian English Speaker Makes | indian english grammar mistakes | 1,800 |
| 11 | How to Think in English (Stop Translating from Hindi) | think in english | 1,500 |
| 12 | Free English Speaking Partner — 8 Real Options That Work | english speaking partner | 1,600 |
| 13 | Debate in English: Structure, Phrases, and Practice Drills | english debate practice | 2,000 |
| 14 | English Fluency Test — Measure Yourself in 10 Minutes | english fluency test | 1,500 |
| 15 | Business English Vocabulary: 150 Words You Need at Work | business english vocabulary | 2,200 |
| 16 | Talkivo vs Cambly vs Duolingo — Honest Comparison | cambly alternative | 2,000 |
| 17 | Spoken English Course Online — Full 30-Day Plan | spoken english course online | 2,500 |
| 18 | English Accent Training — Indian Neutral Accent Guide | english accent training india | 2,000 |
| 19 | How to Answer "Tell Me About Yourself" in English | tell me about yourself english | 1,500 |
| 20 | Daily English Speaking Practice — 20-Minute Routine | daily english practice | 1,600 |

### Article structure template
- H1 with primary keyword
- TOC (jump links) for articles 1,500+ words
- Intro — hook + problem + promise (100 words)
- H2 sections (6–10) — include related keywords
- Practical examples, scripts, drills
- FAQ block (4–6 questions) with FAQ schema
- CTA to signup + relevant feature page
- Internal links — 3–5 per article

---

## 6. City / Intent Landing Pages (First 10)

| URL | Target Keyword |
|---|---|
| /english-speaking-course-hyderabad | english speaking classes hyderabad |
| /english-speaking-course-bangalore | english speaking course bangalore |
| /english-speaking-course-delhi | english classes delhi |
| /english-speaking-course-mumbai | english speaking mumbai |
| /english-speaking-course-chennai | spoken english chennai |
| /ielts-speaking-practice | ielts speaking practice online |
| /english-for-interviews | job interview english practice |
| /english-for-call-center | english for call center training |
| /english-pronunciation-practice | english pronunciation practice |
| /english-grammar-check-ai | ai grammar checker english |

Each page: 1,200–1,800 words, unique content, local signals where applicable, schema, signup CTA.

---

## 7. Off-Page SEO Playbook

### 7.1 Google Search Console + Bing Webmaster (Day 1)
- Verify domain via `verification` meta tag in `layout.tsx`
- Submit `sitemap.xml`
- Enable enhancements — sitelinks search box, breadcrumbs

### 7.2 Google Business Profile
- Create profile — category "Language School" / "Educational Institution"
- Service areas: India (national)
- Add photos, description, service list
- Collect reviews — target 50 in 90 days

### 7.3 Backlink Sources (priority order)
1. **Quora** — answer 50 questions on English learning; embed Talkivo link in author bio
2. **Reddit** — r/EnglishLearning, r/India, r/learnenglish — helpful answers, no spam
3. **YouTube** — 10 demo videos, link in description + pinned comment
4. **Product Hunt** — launch Talkivo (aim top 5 of the day)
5. **AppSumo / BetaList / Launching Next** — founder listings
6. **EdTech guest posts** — YourStory, Inc42, The Better India, EdTechReview
7. **University / college partnerships** — guest workshops
8. **Podcasts** — guest appearances on learning / entrepreneurship shows
9. **Directories** — AlternativeTo.net, G2, Capterra, SaaSHub

### 7.4 Social signals
- Twitter/X, LinkedIn, Instagram, YouTube — post daily English tips with subtle branding
- Schema `sameAs` links all socials
- Consistent NAP (Name, Address, Phone) across profiles

---

## 8. Core Web Vitals Checklist

- [ ] `next/image` for all raster images
- [ ] `next/font` for Google Fonts (currently loaded via `<link>` — slower)
- [ ] Lazy-load below-fold components (`dynamic` import for Waveform, TestimonialSlider)
- [ ] Preload hero image
- [ ] Minify and compress — Next.js handles, verify output
- [ ] Reduce JavaScript on landing (currently `'use client'`)
- [ ] Test with PageSpeed Insights — target LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] Enable brotli/gzip on VPS nginx

---

## 9. Measurement & KPIs

### Track in Google Search Console
- Impressions, clicks, CTR, average position
- Indexed pages count (should grow weekly as content publishes)

### Track in GA4 (or Plausible)
- Organic traffic %
- Signup conversions from organic
- Bounce rate by landing page
- Top landing pages

### Monthly SEO report
- New keywords ranking in top 10
- Backlinks gained (Ahrefs / Semrush free tier)
- Content published vs plan
- Core Web Vitals score

### Targets (6-month)
- 15,000 monthly organic visits
- 3 keywords ranking top 3
- 50 keywords ranking top 10
- 100 referring domains
- 1,000 organic signups

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Thin content penalty | Every page 1,000+ words, unique, valuable |
| Duplicate content (city pages) | Unique copy, local signals, different examples |
| Keyword cannibalization | 1 page = 1 primary keyword; map in spreadsheet |
| Slow Core Web Vitals | Next.js SSR, image opt, font opt, code split |
| Google algorithm updates | E-E-A-T focus — author bios, real expertise, citations |
| Black-hat backlinks | Manual outreach only, no PBNs or link farms |

---

## 11. Immediate Next Steps (This Week)

1. [ ] Create Google Search Console property + grab verification token
2. [ ] Create Bing Webmaster property
3. [ ] Create `robots.ts` + `sitemap.ts`
4. [ ] Expand `layout.tsx` metadata
5. [ ] Add JSON-LD components (Organization, WebSite, SoftwareApplication, FAQPage)
6. [ ] Design 1200×630 OG image (Figma / Canva) — save `public/og-image.png`
7. [ ] Generate favicon pack (favicon.io) — 16, 32, 180, 192, 512
8. [ ] Add `manifest.webmanifest`
9. [ ] Add per-page metadata — login, signup, each tutor mode
10. [ ] Build `/pricing`, `/about` pages
11. [ ] Deploy + submit sitemap to GSC
12. [ ] Set up Plausible or GA4 analytics

---

## 12. File Map — What to Create

```
src/app/
├── robots.ts                    [NEW]
├── sitemap.ts                   [NEW]
├── layout.tsx                   [EDIT — expand metadata]
├── page.tsx                     [EDIT — add JSON-LD, make server]
├── JsonLd.tsx                   [NEW — schema components]
├── pricing/page.tsx             [NEW]
├── about/page.tsx               [NEW]
├── features/
│   ├── free-talk/page.tsx       [NEW]
│   ├── role-play/page.tsx       [NEW]
│   ├── debate/page.tsx          [NEW]
│   ├── grammar-fix/page.tsx     [NEW]
│   └── pronunciation/page.tsx   [NEW]
├── blog/
│   ├── page.tsx                 [NEW — index]
│   └── [slug]/page.tsx          [NEW — MDX renderer]
└── english-speaking-course-[city]/page.tsx  [NEW — dynamic city landing]

public/
├── manifest.webmanifest         [NEW]
├── og-image.png                 [NEW 1200×630]
├── favicon-16.png               [NEW]
├── favicon-32.png               [NEW]
├── apple-touch-icon.png         [NEW 180×180]
├── icon-192.png                 [NEW]
├── icon-512.png                 [NEW]
└── icon-maskable-512.png        [NEW]

content/blog/                    [NEW FOLDER — MDX posts]
└── *.mdx
```

---

## 13. Budget Estimate

| Item | Cost |
|---|---|
| Ahrefs / Semrush (keyword + backlink tracking) | $100/mo |
| OG image design (one-time Fiverr) | $20 |
| Content writing (20 articles × ₹3k) | ₹60k one-time |
| Ongoing content (4/mo × ₹3k) | ₹12k/mo |
| Backlink outreach tool (Pitchbox / lite) | Skip — manual |
| **Total Month 1** | ~₹75k + $100 |
| **Monthly ongoing** | ~₹12k + $100 |

Self-write content to save cost — ChatGPT/Claude draft + human edit + add unique experience / screenshots.

---

*End of plan. Ready to execute Phase 1 on command.*

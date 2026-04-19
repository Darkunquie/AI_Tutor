# SEO Launch Checklist

## Pre-launch (do immediately)

- [ ] Google Search Console — create property, verify domain
  - Add TXT record to DNS, OR use meta tag in `src/app/layout.tsx` `metadata.verification.google`
- [ ] Bing Webmaster Tools — create property, verify
- [ ] Google Analytics 4 OR Plausible — install tracking
- [ ] Submit sitemap in GSC: https://talkivo.in/sitemap.xml
- [ ] Submit sitemap in Bing
- [ ] Request indexing for priority pages in GSC (one-by-one):
  - /
  - /pricing
  - /features/free-talk
  - /features/role-play
  - /blog/how-to-speak-fluent-english
  - /blog/ielts-speaking-band-8-guide

## Google Business Profile

- [ ] Create profile at business.google.com
- [ ] Category: Language School
- [ ] Service area: India (national, no physical address needed)
- [ ] Add description, photos (logo, OG image, feature screenshots)
- [ ] Collect 10 reviews in first 90 days (ask happy users directly)

## OG image + favicons

- [ ] Design 1200×630 OG image (Figma / Canva)
- [ ] Save to `public/og-image.png`
- [ ] Update `src/app/layout.tsx` openGraph.images and twitter.images to use new file
- [ ] Generate favicon pack at favicon.io:
  - [ ] favicon-16.png, favicon-32.png
  - [ ] apple-touch-icon.png (180×180)
  - [ ] icon-192.png, icon-512.png, icon-maskable-512.png
- [ ] Save all to `public/`
- [ ] Update `src/app/layout.tsx` icons config

## Social profiles

- [ ] Twitter/X @talkivo — create + link in footer + update schema `sameAs`
- [ ] LinkedIn company page
- [ ] Instagram @talkivo
- [ ] YouTube @talkivo — upload 3 demo videos (90 seconds each)

## Content publishing (Month 1)

- [ ] Week 1: Publish 2 more blog posts (use template in `src/content/posts.ts`)
- [ ] Week 2: Publish 2 more blog posts
- [ ] Week 3: Publish 2 more blog posts
- [ ] Week 4: Publish 2 more blog posts
- [ ] Target: 10 new posts in first 30 days

## Backlinks (Month 1)

- [ ] Post 10 Quora answers (use drafts in `seo/QUORA_ANSWERS.md`)
- [ ] Comment on 10 relevant Reddit threads (use drafts in `seo/REDDIT_POSTS.md`)
- [ ] Submit to 8 directories (listings in `seo/OUTREACH_TEMPLATES.md`)
- [ ] Launch on Product Hunt (aim top 5 of the day)
- [ ] Pitch 5 podcasts (template in `seo/OUTREACH_TEMPLATES.md`)
- [ ] Pitch 3 EdTech blogs for guest posts
- [ ] Target: 10 referring domains by day 30

## Core Web Vitals

- [ ] Run PageSpeed Insights on / and /blog/[slug]
- [ ] Target: LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] Lazy-load below-fold components (Waveform, TestimonialSlider)
- [ ] `next/font` instead of Google Fonts link tags
- [ ] Preload hero image
- [ ] Enable brotli/gzip on VPS nginx

## Month 2-3 cadence

- 2 blog posts per week
- 5 Quora answers per week
- 3 Reddit comments per week
- 1 podcast guest per month
- 1 guest post per month
- 5 outreach emails per week

## Monthly reporting

- Total organic sessions
- Top 10 ranking keywords
- Total indexed pages
- New referring domains
- Core Web Vitals scores
- Signups from organic

const SITE_URL = 'https://talkivo.in';

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Talkivo',
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
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
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Talkivo',
        url: SITE_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/blog?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  );
}

export function SoftwareAppJsonLd() {
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Talkivo',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        url: SITE_URL,
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
          'AI English tutor for speaking practice. Free Talk, Role Play, Debate, Grammar Fix, and Pronunciation modes.',
      }}
    />
  );
}

export function FaqJsonLd() {
  return (
    <JsonLdScript
      data={{
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
      }}
    />
  );
}

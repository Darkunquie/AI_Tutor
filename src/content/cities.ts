export type City = {
  slug: string;
  name: string;
  state: string;
  metaTitle: string;
  metaDescription: string;
  keyword: string;
  intro: string;
  localAngle: string;
  testimonialCity: string;
};

export const CITIES: City[] = [
  {
    slug: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    metaTitle: 'English Speaking Classes in Hyderabad — AI Tutor, Online',
    metaDescription:
      'Practice spoken English from home in Hyderabad with Talkivo — an AI tutor that listens, corrects with reason, and remembers your patterns. Free trial, no credit card.',
    keyword: 'english speaking classes hyderabad',
    intro:
      'Hyderabad is one of India\u2019s fastest-growing tech and business hubs \u2014 HITEC City, Gachibowli, Financial District. English fluency is no longer a bonus for roles at Microsoft, Amazon, Google, or the thousands of Indian startups here. Talkivo gives Hyderabadi professionals a patient, always-available AI tutor for English speaking practice.',
    localAngle:
      'Whether you are a software engineer in Madhapur preparing for client calls, a BPO trainee in Kondapur targeting a neutral accent, or a student in Osmania University working toward a study-abroad application, Talkivo fits around your day.',
    testimonialCity: 'Hyderabad',
  },
  {
    slug: 'bangalore',
    name: 'Bangalore',
    state: 'Karnataka',
    metaTitle: 'English Speaking Course in Bangalore — AI Tutor, Online',
    metaDescription:
      'Learn spoken English online in Bangalore with Talkivo — an AI tutor built for working professionals. Free Talk, Role Play, Grammar, and Pronunciation. Start free.',
    keyword: 'english speaking course bangalore',
    intro:
      'Bangalore runs on English. From Koramangala startups to Whitefield enterprises to Electronic City engineering parks, every meeting, every pitch, every client call happens in English. Talkivo helps Bangaloreans move from functional English to confident, natural English \u2014 without scheduling lessons or commuting.',
    localAngle:
      'Product managers at Flipkart, engineers at Infosys, founders in Indiranagar, students in Jayanagar \u2014 Talkivo adapts to your level and schedule. Fifteen minutes a day is enough to change how you sound in six weeks.',
    testimonialCity: 'Bangalore',
  },
  {
    slug: 'delhi',
    name: 'Delhi',
    state: 'Delhi NCR',
    metaTitle: 'English Speaking Classes in Delhi NCR — AI Tutor, Online',
    metaDescription:
      'Practice English speaking in Delhi NCR with Talkivo. AI-powered conversation, role play, grammar correction, and pronunciation drills. Free to start.',
    keyword: 'english speaking classes delhi',
    intro:
      'Delhi and the NCR \u2014 Gurgaon, Noida, Faridabad \u2014 are the heart of corporate India. Consultants at McKinsey, bankers at HSBC, civil services aspirants at Rajinder Nagar, startup founders at Cyber Hub. Each of them needs English that lands \u2014 clear, confident, without hesitation. Talkivo builds that English, one 15-minute session at a time.',
    localAngle:
      'From UPSC interview prep to MBA application SOPs to client-facing consulting work, Talkivo covers the speaking practice Delhi professionals actually need \u2014 on your phone, on your schedule.',
    testimonialCity: 'Delhi NCR',
  },
];

export function getCity(slug: string) {
  return CITIES.find((c) => c.slug === slug);
}

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
  {
    slug: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    metaTitle: 'English Speaking Course in Mumbai — AI Tutor, Online',
    metaDescription:
      'Practice spoken English online in Mumbai with Talkivo. AI English tutor for BKC professionals, Andheri startups, and anyone serious about fluency. Free trial.',
    keyword: 'english speaking course mumbai',
    intro:
      'Mumbai is financial services, media, advertising, and the startup scene all in one city. BKC, Lower Parel, Andheri, Powai \u2014 every pitch, every client meeting, every agency brief happens in English. Talkivo helps Mumbai professionals speak the English their jobs require \u2014 without booking an in-person class.',
    localAngle:
      'Investment bankers, creative directors, product managers, TV hosts, FMCG brand managers \u2014 Talkivo adapts to your level and the vocabulary you actually need for work.',
    testimonialCity: 'Mumbai',
  },
  {
    slug: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    metaTitle: 'Spoken English in Chennai — AI English Tutor, Online',
    metaDescription:
      'Learn spoken English in Chennai with Talkivo \u2014 an AI tutor for IT professionals, students, and anyone who wants confident, natural English. Free trial.',
    keyword: 'spoken english chennai',
    intro:
      'Chennai is India\u2019s IT and manufacturing heartland. OMR, Tidel Park, Guindy, Ambattur \u2014 tens of thousands of engineers, BPO trainees, and manufacturing managers need fluent English for daily work. Talkivo brings the speaking practice Chennai professionals need, at their own pace, from their own phone.',
    localAngle:
      'From IT freshers preparing for client video calls to automotive professionals working with global teams, Talkivo covers the speaking practice Chennai professionals actually need. Optional Tamil interface for beginners.',
    testimonialCity: 'Chennai',
  },
  {
    slug: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    metaTitle: 'English Speaking Classes in Pune — AI Tutor, Online',
    metaDescription:
      'Improve your spoken English in Pune with Talkivo. AI-powered conversation and pronunciation practice for Hinjewadi, Kharadi, and Viman Nagar professionals. Free to start.',
    keyword: 'english speaking classes pune',
    intro:
      'Pune combines India\u2019s biggest student population with a fast-growing IT corridor. Hinjewadi, Kharadi, Viman Nagar, Baner \u2014 every IT park here runs on English-medium work. Talkivo helps Pune professionals move from passable to polished English, in 15-minute daily sessions.',
    localAngle:
      'Whether you are a fresh engineering graduate from COEP or MIT, an IT professional in Hinjewadi, or a management consultant in Kalyani Nagar, Talkivo fits around your schedule.',
    testimonialCity: 'Pune',
  },
  {
    slug: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    metaTitle: 'English Speaking Classes in Kolkata — AI Tutor, Online',
    metaDescription:
      'Practice English speaking in Kolkata with Talkivo. AI-powered conversation, role play, and pronunciation drills. For Salt Lake IT, New Town, and beyond. Free trial.',
    keyword: 'english speaking classes kolkata',
    intro:
      'Kolkata is rebuilding as an eastern India hub \u2014 Salt Lake Sector V, New Town, Rajarhat. IT services, analytics, and finance roles here require English fluency beyond what school and college taught. Talkivo gives Kolkata professionals a patient AI tutor for daily speaking practice.',
    localAngle:
      'From IT services professionals in Sector V to students at Jadavpur and Presidency preparing for higher studies abroad, Talkivo covers the speaking practice Kolkata professionals actually need.',
    testimonialCity: 'Kolkata',
  },
];

export function getCity(slug: string) {
  return CITIES.find((c) => c.slug === slug);
}

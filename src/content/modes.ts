export type Mode = {
  slug: string;
  name: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  hero: string;
  keyword: string;
  intro: string;
  sections: { h: string; b: string }[];
  useCases: string[];
  faqs: { q: string; a: string }[];
};

export const MODES: Mode[] = [
  {
    slug: 'free-talk',
    name: 'Free Talk',
    tagline: 'Pick any topic. Just talk.',
    metaTitle: 'Free Talk — Unscripted English Conversation Practice with AI',
    metaDescription:
      'Pick any topic and just talk. Free Talk mode lets you practice unscripted English conversation with an AI tutor that listens first and corrects with reason.',
    hero: 'Speak first. Think while speaking. That is fluency.',
    keyword: 'unscripted English conversation practice',
    intro:
      'Free Talk is the simplest way to get fluent. Pick any topic — your job, last weekend, a book you are reading — and talk to Talkivo like you would talk to a patient friend. The tutor listens to your full thought, responds naturally, and flags the small things you would fix if you could hear yourself.',
    sections: [
      {
        h: 'Why unscripted practice beats flashcards',
        b: 'Fluency is not vocabulary recall. It is the ability to produce language under the light pressure of real conversation. Free Talk trains exactly that — every session is different, every session stretches the muscles that matter.',
      },
      {
        h: 'How Talkivo corrects without interrupting',
        b: 'Traditional tutors cut in mid-sentence. Talkivo waits. It lets your thought land, then shows the cleaner version in the margin — a quiet note, with the reason behind each change.',
      },
      {
        h: 'Choose your level, change it anytime',
        b: 'Beginner sessions use slower pacing and simpler vocabulary. Advanced sessions push idiom, register, and pace. Switch between them in one tap.',
      },
    ],
    useCases: [
      'Daily 15-minute fluency practice',
      'Warming up before an English-heavy work day',
      'Building confidence before a date, interview, or meeting',
      'Recovering fluency after months of not speaking English',
    ],
    faqs: [
      {
        q: 'Do I need to prepare topics?',
        a: 'No. You can bring your own, or let Talkivo suggest one based on your goals and past sessions.',
      },
      {
        q: 'Will Talkivo correct me mid-sentence?',
        a: 'Never. It waits until you finish a thought. Corrections appear as margin notes, not interruptions.',
      },
    ],
  },
  {
    slug: 'role-play',
    name: 'Role Play',
    tagline: 'Rehearse the conversation before it happens.',
    metaTitle: 'Role Play — Practice Real English Conversations with AI',
    metaDescription:
      'Rehearse interviews, meetings, sales calls, IELTS speaking, and everyday scenes with Talkivo Role Play. An AI tutor plays the other side and gives instant feedback.',
    hero: 'Rehearse the conversation before it happens.',
    keyword: 'role play English conversation practice',
    intro:
      'Every important conversation deserves a rehearsal. Role Play lets you pick a scenario — job interview, client pitch, restaurant order, IELTS speaking test — and practice it with an AI that plays the other side convincingly. You walk in ready.',
    sections: [
      {
        h: '30+ real scenarios, any level',
        b: 'Interview prep, IELTS Part 2/3, business meetings, travel English, customer support, medical consultations, dating small talk. Each scenario is tuned to the vocabulary and pace you will hit in real life.',
      },
      {
        h: 'AI plays the other side realistically',
        b: 'The recruiter is a little impatient. The client wants the ROI number. The IELTS examiner follows the rubric. Talkivo stays in character and pushes you the way a real interlocutor would.',
      },
      {
        h: 'Feedback after the scene, not during',
        b: 'At the end, Talkivo reviews your answers — clarity, fluency, vocabulary choice, pronunciation — and suggests the three highest-leverage changes for next time.',
      },
    ],
    useCases: [
      'Job interview rehearsal (English-medium roles)',
      'IELTS Speaking Band 7 to Band 8 push',
      'Sales call practice',
      'Presentation rehearsal with Q&A',
    ],
    faqs: [
      {
        q: 'Can Talkivo do IELTS speaking practice?',
        a: 'Yes. Scenarios include Part 1, Part 2 cue cards, and Part 3 discussion questions, scored against the official rubric.',
      },
      {
        q: 'Can I upload my own scenario?',
        a: 'Yes. Describe the situation in 2-3 lines and Talkivo will play the matching counterpart.',
      },
    ],
  },
  {
    slug: 'debate',
    name: 'Debate',
    tagline: 'Defend a position. Sharpen your thinking.',
    metaTitle: 'Debate — Practice English Argument and Persuasion with AI',
    metaDescription:
      'Defend a position in English. Talkivo Debate mode sharpens your reasoning, vocabulary, and fluency by pushing you to argue clearly under pressure.',
    hero: 'Defend a position. Sharpen your thinking.',
    keyword: 'English debate practice',
    intro:
      'Debate is the fastest way to stretch vocabulary and argument structure. Pick a motion — remote work, AI ethics, your city planning — and Talkivo takes the opposite side. You learn to reason out loud in English, under pressure, in complete sentences.',
    sections: [
      {
        h: 'Argue like a native, not a textbook',
        b: 'Debate teaches register — the difference between conceding politely and conceding weakly, between hedging and waffling. These nuances separate Band 7 English from Band 9.',
      },
      {
        h: 'Structured feedback on rhetoric',
        b: 'At the end, Talkivo reviews your arguments for logic, evidence, and linguistic precision. It shows you where your point was strong and where your English blunted it.',
      },
      {
        h: 'Level-matched opponents',
        b: 'Beginner debates use simpler motions and shorter turns. Advanced debates use real-world complex motions and full 90-second rebuttals.',
      },
    ],
    useCases: [
      'IELTS Part 3 preparation',
      'MBA interview English',
      'Building argument skills for work meetings',
      'Competitive debate practice',
    ],
    faqs: [
      {
        q: 'Do I pick the motion?',
        a: 'You can pick one, or Talkivo will suggest one matched to your level and interests.',
      },
      {
        q: 'Is my side assigned or chosen?',
        a: 'You choose. Talkivo argues the opposite side, or a steelmanned version of it.',
      },
    ],
  },
  {
    slug: 'grammar-fix',
    name: 'Grammar Fix',
    tagline: 'Bring a paragraph. Leave it better.',
    metaTitle: 'Grammar Fix — AI Grammar Correction with Reasoning',
    metaDescription:
      'Paste any English paragraph and get sentence-by-sentence corrections — with the reasoning behind each change. The best AI grammar checker for serious learners.',
    hero: 'Bring a paragraph. Leave it better.',
    keyword: 'AI grammar checker English',
    intro:
      'Grammar Fix is not a red-line tool. Paste any paragraph — an email, a report draft, a message you are nervous about sending — and Talkivo rewrites it line by line, explaining why each change makes the sentence cleaner, clearer, or more natural.',
    sections: [
      {
        h: 'Every correction comes with a reason',
        b: 'Other tools just change your sentence. Talkivo explains which rule applies, why the original sounded off, and what the pattern is — so next time you will catch it yourself.',
      },
      {
        h: 'Works on any length, any register',
        b: 'Casual messages, business emails, academic writing, resume bullets, blog drafts. Grammar Fix adapts to the voice of the text, not just the rules.',
      },
      {
        h: 'Learn the patterns that follow you around',
        b: 'Talkivo tracks the mistakes you keep making — article usage, verb agreement, prepositions — and builds a quiet practice plan just for you.',
      },
    ],
    useCases: [
      'Email polishing before hitting send',
      'Academic writing support (SOP, essays)',
      'Resume and LinkedIn copy review',
      'Daily writing practice with feedback',
    ],
    faqs: [
      {
        q: 'Is this better than Grammarly?',
        a: 'Grammarly fixes. Talkivo teaches. Every correction comes with a reason you can learn from — so you make fewer mistakes next time.',
      },
      {
        q: 'Can I use it for business writing?',
        a: 'Yes. Grammar Fix adapts to business, academic, or casual register automatically.',
      },
    ],
  },
  {
    slug: 'pronunciation',
    name: 'Pronunciation',
    tagline: 'The sounds you avoid, practised with care.',
    metaTitle: 'Pronunciation Practice — AI Accent and Sound Training',
    metaDescription:
      'Practice the English sounds you struggle with. Talkivo Pronunciation mode targets the 18 sounds Indian speakers most often avoid and trains them with instant feedback.',
    hero: 'The sounds you avoid, practised with care.',
    keyword: 'English pronunciation practice AI',
    intro:
      'Pronunciation is the most unfair part of English. A few tricky sounds — /θ/, /v/, /w/, /ʒ/, the short /æ/ — can make even an advanced speaker sound less fluent than they are. Pronunciation mode targets those sounds directly, with drills calibrated to your voice.',
    sections: [
      {
        h: 'Built for Indian and South Asian speakers',
        b: 'The drills focus on the 18 sounds that most Indian English speakers avoid or replace. Each sound comes with mouth-position guidance, contrastive pairs, and sentence-level practice.',
      },
      {
        h: 'Instant feedback on your actual voice',
        b: 'Talkivo listens to your recording and shows you exactly which syllable missed the target. No more vague "try again" — you see the specific sound that shifted.',
      },
      {
        h: 'Build a neutral, clear accent — not a fake one',
        b: 'The goal is not to sound American. The goal is to be understood on the first try, by anyone, anywhere. Clarity, not imitation.',
      },
    ],
    useCases: [
      'Call-center training',
      'Client-facing roles with international audiences',
      'Presentations to non-Indian audiences',
      'Accent neutralization for global hiring',
    ],
    faqs: [
      {
        q: 'Will this change my accent?',
        a: 'It will make you clearer, not less Indian. The target is neutrality and clarity, not imitation.',
      },
      {
        q: 'How long does it take?',
        a: 'Most learners hear noticeable changes in 3-4 weeks of daily 10-minute sessions.',
      },
    ],
  },
];

export function getMode(slug: string) {
  return MODES.find((m) => m.slug === slug);
}

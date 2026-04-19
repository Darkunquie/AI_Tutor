export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readMinutes: number;
  keyword: string;
  body: { type: 'p' | 'h2' | 'h3' | 'li' | 'cta'; text: string }[];
};

export const POSTS: Post[] = [
  {
    slug: 'how-to-speak-fluent-english',
    title: 'How to Speak Fluent English: 7 Habits That Actually Work',
    description:
      'Forget grammar books. These seven habits — backed by how fluency actually develops — will move you from hesitant to fluent in a few months.',
    date: '2026-04-19',
    readMinutes: 9,
    keyword: 'how to speak fluent english',
    body: [
      { type: 'p', text: 'Fluency is not a vocabulary problem. Most learners who struggle to speak English already know enough words. What they lack is the ability to produce those words under the light pressure of real conversation. The seven habits below target exactly that — the gap between knowing and speaking.' },
      { type: 'h2', text: '1. Speak every single day, even for five minutes' },
      { type: 'p', text: 'The single strongest predictor of fluency improvement is daily speaking time. Not weekly. Daily. Five minutes of real speaking beats an hour of passive reading. Set a floor you can hit on your worst day and never miss it.' },
      { type: 'h2', text: '2. Record yourself and listen back' },
      { type: 'p', text: 'Most learners never hear themselves. Record a 60-second answer to any question and play it back the next day. The gap between how you sound in your head and how you actually sound is where most of the improvement hides.' },
      { type: 'h2', text: '3. Stop translating from your first language' },
      { type: 'p', text: 'If you think the sentence in Hindi and translate word-by-word into English, you will always sound a beat slower than you are. Practice forming short thoughts directly in English — one clause at a time, not one word at a time.' },
      { type: 'h2', text: '4. Shadow one speaker you like' },
      { type: 'p', text: 'Pick a podcast or YouTube speaker whose English you admire. Repeat their sentences aloud, matching their rhythm, stress, and pause pattern. Fifteen minutes a day of shadowing changes the music of your English faster than any grammar drill.' },
      { type: 'h2', text: '5. Talk out loud when you are alone' },
      { type: 'p', text: 'Narrate what you are doing. Describe the room. Summarize the article you just read, out loud. You remove the social anxiety that stops most learners, and you quadruple your speaking volume for free.' },
      { type: 'h2', text: '6. Get corrected with reasons, not red lines' },
      { type: 'p', text: 'A correction without a reason is a memorized fix. A correction with a reason is a pattern you own. Work with tutors, apps, or study partners who tell you why — not just what.' },
      { type: 'h2', text: '7. Build a topic vocabulary, not a general one' },
      { type: 'p', text: 'Generic vocabulary lists are nearly useless. Pick three topics you actually talk about — work, family, a hobby — and build thirty precise phrases per topic. Deep beats wide every time.' },
      { type: 'h2', text: 'How Talkivo helps you stick to these habits' },
      { type: 'p', text: 'Talkivo is an AI English tutor that listens to your full thought, corrects with reason, and remembers the mistakes you keep making. It is designed for daily 15-minute sessions — the cadence that actually produces fluency. Free Talk mode covers habits 1, 2, and 5. Grammar Fix covers habit 6. Pronunciation mode covers habit 4.' },
      { type: 'cta', text: 'Start your first free Talkivo session →' },
    ],
  },
  {
    slug: 'ielts-speaking-band-8-guide',
    title: 'IELTS Speaking Band 8: The Full Preparation Guide',
    description:
      'What Band 8 actually sounds like, the four criteria examiners score on, and a 30-day practice plan to move from Band 6.5 to Band 8.',
    date: '2026-04-19',
    readMinutes: 14,
    keyword: 'ielts speaking band 8',
    body: [
      { type: 'p', text: 'Band 8 in IELTS Speaking is not about perfect grammar or a fake accent. It is about four specific things, scored by the examiner across three parts of the test. This guide breaks down exactly what they are and gives you a 30-day plan to move from Band 6.5 to Band 8.' },
      { type: 'h2', text: 'What IELTS Speaking actually scores' },
      { type: 'p', text: 'Four criteria, equally weighted:' },
      { type: 'li', text: 'Fluency and Coherence — can you speak at length without long pauses or self-corrections, with ideas that follow logically?' },
      { type: 'li', text: 'Lexical Resource — do you use a wide range of vocabulary with precision, including less common words and collocations?' },
      { type: 'li', text: 'Grammatical Range and Accuracy — do you use a mix of simple and complex structures mostly correctly?' },
      { type: 'li', text: 'Pronunciation — are you clear, with natural stress and intonation, easy to understand at all times?' },
      { type: 'h2', text: 'The three parts, and what Band 8 sounds like in each' },
      { type: 'h3', text: 'Part 1 — Interview (4-5 min)' },
      { type: 'p', text: 'Short personal questions. Home, family, work, hobbies. Band 8 answers are two to three sentences long — not one, not five. You give a direct answer, a small justification, and a concrete example. You sound conversational, not rehearsed.' },
      { type: 'h3', text: 'Part 2 — Long Turn (3-4 min)' },
      { type: 'p', text: 'A cue card with four bullet points. You get one minute to prepare, then speak for one to two minutes. Band 8 answers cover all four bullets, use at least two complex structures, and include two or three less common words used correctly. You do not run out of things to say.' },
      { type: 'h3', text: 'Part 3 — Discussion (4-5 min)' },
      { type: 'p', text: 'Abstract follow-up questions. Society, trends, future. Band 8 answers compare, hypothesize, and concede — "it depends on", "one could argue that", "in the long run". You go beyond opinion into analysis.' },
      { type: 'h2', text: 'The 30-day plan' },
      { type: 'h3', text: 'Week 1 — Fluency floor' },
      { type: 'p', text: 'Goal: never pause for longer than 2 seconds mid-sentence. Daily drill: 15 minutes of Free Talk on any topic. Record and listen back. Count your self-corrections. Aim to reduce them by half by end of week.' },
      { type: 'h3', text: 'Week 2 — Lexical upgrade' },
      { type: 'p', text: 'Goal: retire 10 overused words (good, bad, big, thing, very, nice, people, problem, important, do). Build a replacement list with more precise alternatives. Force yourself to use two less common words in every answer.' },
      { type: 'h3', text: 'Week 3 — Grammar range' },
      { type: 'p', text: 'Goal: use at least three complex structures naturally — conditionals, relative clauses, passive where appropriate. Practice 10 cue cards a day, forcing at least two complex sentences per answer.' },
      { type: 'h3', text: 'Week 4 — Full mock tests' },
      { type: 'p', text: 'Goal: simulate the real test. One full 11-14 minute mock per day, recorded. Review against all four criteria. Close the weakest gap each day.' },
      { type: 'h2', text: 'How Talkivo fits into the plan' },
      { type: 'p', text: 'Talkivo Role Play mode runs the full IELTS Speaking test — Part 1, Part 2 cue cards, Part 3 discussion — and scores you against the official rubric. Use Free Talk for fluency drills, Grammar Fix for written sentence upgrades you then speak aloud, and Pronunciation for the clarity work that lifts Band 7 to Band 8.' },
      { type: 'cta', text: 'Start IELTS practice with Talkivo — free →' },
    ],
  },
  {
    slug: 'ai-english-tutor-how-it-works',
    title: 'How AI English Tutors Work — And Why They Beat Flashcards',
    description:
      'The difference between memorization apps and real AI tutors, how speech recognition and feedback loops actually work, and what to look for when choosing one.',
    date: '2026-04-19',
    readMinutes: 8,
    keyword: 'ai english tutor',
    body: [
      { type: 'p', text: 'The term "AI English tutor" covers everything from flashcard apps with a chatbot bolted on, to genuine conversational AI that listens, corrects, and adapts. The difference matters. Here is what actually makes an AI tutor work.' },
      { type: 'h2', text: 'What an AI English tutor actually does' },
      { type: 'p', text: 'A real AI English tutor does four things in sequence: it listens to your speech, transcribes it accurately, understands the meaning and errors, and responds naturally — both with a conversational reply and with structured feedback on what you said.' },
      { type: 'h2', text: 'Why AI beats flashcards for speaking' },
      { type: 'p', text: 'Flashcards test recall. Speaking is production under pressure. An AI tutor gives you the one thing flashcards cannot — unlimited, judgment-free speaking time with instant feedback. That is where fluency actually builds.' },
      { type: 'h2', text: 'The three components of a good AI tutor' },
      { type: 'h3', text: '1. Speech recognition tuned for non-native speakers' },
      { type: 'p', text: 'Generic speech-to-text is trained on native speakers and misrecognizes accented English. A good AI tutor uses models adapted for Indian, South Asian, and other non-native English accents — so the corrections target what you actually said, not what the system thought you said.' },
      { type: 'h3', text: '2. Error analysis that explains, not just flags' },
      { type: 'p', text: 'A red line is not teaching. A good AI tutor points to the error, explains the rule, and shows the pattern — so the next time you speak, you catch it yourself.' },
      { type: 'h3', text: '3. Memory that persists across sessions' },
      { type: 'p', text: 'Fluency work is weeks, not hours. A good AI tutor remembers your recurring mistakes, the topics you practice, and the level you are at — and quietly adapts as you improve.' },
      { type: 'h2', text: 'What to avoid' },
      { type: 'p', text: 'Apps that only give multiple-choice grammar drills, or chatbots that respond with canned replies, are not AI tutors — they are worksheets with a friendly skin. Look for tools that let you speak freely, on any topic, and give feedback with reasons.' },
      { type: 'h2', text: 'How Talkivo approaches it' },
      { type: 'p', text: 'Talkivo is built around the idea that fluency comes from talking, not from memorizing. Its AI tutor listens without interrupting, corrects with reasons, and remembers the patterns you keep repeating. Five modes — Free Talk, Role Play, Debate, Grammar Fix, Pronunciation — cover the full range of speaking practice.' },
      { type: 'cta', text: 'Try Talkivo free — no credit card →' },
    ],
  },
];

export function getPost(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}

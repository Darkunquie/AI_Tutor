import type { Scenario, DebateTopic } from '../types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'restaurant',
    title: 'Restaurant',
    description: 'Order food, ask about menu, handle complaints',
    aiRole: 'waiter/waitress',
    userRole: 'customer',
    starterPrompt: 'Welcome to The Golden Fork! I\'ll be your server today. Can I start you off with something to drink?',
  },
  {
    id: 'job_interview',
    title: 'Job Interview',
    description: 'Practice answering interview questions professionally',
    aiRole: 'interviewer',
    userRole: 'job candidate',
    starterPrompt: 'Thank you for coming in today. Please have a seat. Let\'s start by having you tell me a little about yourself.',
  },
  {
    id: 'airport',
    title: 'Airport',
    description: 'Check-in, security, boarding gate conversations',
    aiRole: 'airport staff',
    userRole: 'traveler',
    starterPrompt: 'Good morning! Welcome to the check-in counter. May I see your passport and booking confirmation, please?',
  },
  {
    id: 'doctor',
    title: 'Doctor Visit',
    description: 'Describe symptoms, understand prescriptions',
    aiRole: 'doctor',
    userRole: 'patient',
    starterPrompt: 'Hello, please come in and have a seat. What brings you in today? How have you been feeling?',
  },
  {
    id: 'hotel',
    title: 'Hotel Check-in',
    description: 'Reservation, room requests, checkout',
    aiRole: 'hotel receptionist',
    userRole: 'guest',
    starterPrompt: 'Good evening and welcome to the Grand Hotel! Do you have a reservation with us?',
  },
  {
    id: 'shopping',
    title: 'Shopping',
    description: 'Ask for help, returns, size exchanges',
    aiRole: 'sales assistant',
    userRole: 'shopper',
    starterPrompt: 'Hi there! Welcome to our store. Is there anything specific I can help you find today?',
  },
];

export const DEBATE_TOPICS: DebateTopic[] = [
  { topic: 'Social media does more harm than good', level: 'BEGINNER' },
  { topic: 'Working from home is better than office work', level: 'BEGINNER' },
  { topic: 'AI will replace most jobs in the future', level: 'INTERMEDIATE' },
  { topic: 'University education is overrated', level: 'INTERMEDIATE' },
  { topic: 'Privacy is more important than security', level: 'ADVANCED' },
  { topic: 'Capitalism is the best economic system', level: 'ADVANCED' },
];

export const PRONUNCIATION_CATEGORIES: string[] = [
  'Daily Conversations',
  'Travel Phrases',
  'Business English',
  'Tongue Twisters',
  'News Headlines',
  'Famous Quotes',
  'Idioms & Expressions',
];

export const FREE_TALK_TOPICS: string[] = [
  'Self Introduction',
  'Travel and holidays',
  'Food and cooking',
  'Movies and TV shows',
  'Technology and gadgets',
  'Sports and fitness',
  'Music and entertainment',
  'Work and career',
  'Hobbies and interests',
  'Family and relationships',
  'Current events',
];

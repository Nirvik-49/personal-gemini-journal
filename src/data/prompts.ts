import { JournalPrompt } from '../types';

export const JOURNAL_PROMPTS: JournalPrompt[] = [
  {
    id: 'evening-reflection',
    title: 'Evening Decompression',
    subtitle: 'Unpack the moments, emotions, and lessons from today.',
    prompt: "I'd like to reflect on my day. What was one thing that surprised me, one challenge I faced, and how I am feeling right now before resting?",
    category: 'reflection',
  },
  {
    id: 'gratitude-wins',
    title: 'Gratitude & Small Wins',
    subtitle: 'Spotlight the quiet victories and people you appreciate.',
    prompt: "Help me reflect on 3 specific things or interactions I felt genuine gratitude for recently, and why they mattered to me.",
    category: 'gratitude',
  },
  {
    id: 'decision-clarity',
    title: 'Navigating a Dilemma',
    subtitle: 'Explore choices, values, and what your gut is telling you.',
    prompt: "I have a decision I'm weighing and feeling stuck on. Can you guide me through exploring the underlying values and possibilities?",
    category: 'growth',
  },
  {
    id: 'emotional-vent',
    title: 'Emotional Processing',
    subtitle: 'Give yourself a safe harbor to speak without judgment.',
    prompt: "I'm experiencing a complex wave of emotions right now and need space to articulate them clearly without feeling rushed.",
    category: 'emotions',
  },
  {
    id: 'morning-focus',
    title: 'Morning Clarity & Focus',
    subtitle: 'Ground your energy and set a conscious tone for today.',
    prompt: "Good morning. I want to ground my focus today around one intentional theme, a healthy boundary, and a mindful attitude.",
    category: 'mindfulness',
  },
];

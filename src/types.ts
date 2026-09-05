export interface JournalMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  messages: JournalMessage[];
  summary: string;
  mood: string;
  keyThemes: string[];
  actionableInsights?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SummaryResponse {
  title: string;
  summary: string;
  mood: string;
  keyThemes: string[];
  actionableInsights?: string[];
}

export interface JournalPrompt {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  category: 'reflection' | 'gratitude' | 'emotions' | 'growth' | 'mindfulness';
}

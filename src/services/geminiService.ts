import { auth } from '../firebase';
import { JournalMessage, SummaryResponse } from '../types';

function extractCleanErrorMessage(errorData: { error?: unknown }, fallback: string): string {
  const raw = errorData?.error;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.error?.message) return parsed.error.message;
      if (parsed?.message) return parsed.message;
    } catch {
      // not JSON string
    }
    const match = raw.match(/"message"\s*:\s*"([^"]+)"/);
    if (match && match[1]) return match[1];
    return raw;
  }
  return fallback;
}

export async function sendChatMessage(
  messages: { role: string; text: string }[],
  entryContext?: string
): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to converse with Gemini.');
  }

  const idToken = await currentUser.getIdToken();

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      messages,
      entryContext,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errMsg = extractCleanErrorMessage(
      errorData,
      `Chat request failed (${response.status}). Please try again in a moment.`
    );
    throw new Error(errMsg);
  }

  const data = await response.json();
  return data.reply;
}

export async function generateEntrySummary(
  messages: JournalMessage[],
  titleHint?: string
): Promise<SummaryResponse> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to generate an AI summary.');
  }

  const idToken = await currentUser.getIdToken();

  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      messages: messages.map(m => ({ role: m.role, text: m.text })),
      titleHint,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errMsg = extractCleanErrorMessage(
      errorData,
      `Summary request failed (${response.status}). Please try again in a moment.`
    );
    throw new Error(errMsg);
  }

  return response.json();
}

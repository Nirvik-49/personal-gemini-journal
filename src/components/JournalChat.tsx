import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  CheckCircle2,
  RefreshCw,
  Tag,
  Smile,
  Lightbulb,
  FileText,
  AlertTriangle,
  Mic,
  MicOff,
  Webhook,
} from 'lucide-react';
import { JournalEntry, JournalMessage } from '../types';
import { JOURNAL_PROMPTS } from '../data/prompts';
import { sendChatMessage, generateEntrySummary } from '../services/geminiService';
import { saveJournalEntry } from '../services/journalService';
import { sendWebhookNotification, getActiveWebhookUrl } from '../services/webhookService';
import { WebhookSettingsModal } from './WebhookSettingsModal';
import { User } from '../firebase';

interface JournalChatProps {
  user: User;
  currentEntry: JournalEntry;
  onUpdateEntry: (entry: JournalEntry) => void;
  onEntrySaved: () => void;
}

export const JournalChat: React.FC<JournalChatProps> = ({
  user,
  currentEntry,
  onUpdateEntry,
  onEntrySaved,
}) => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [webhookNotice, setWebhookNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const textBeforeListeningRef = useRef<string>('');

  // Check speech recognition support
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const toggleVoiceDictation = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        'Voice dictation is not supported by your current browser. Please try Chrome, Edge, or Safari.'
      );
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      textBeforeListeningRef.current = input ? (input.endsWith(' ') ? input : `${input} `) : '';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(textBeforeListeningRef.current + transcript);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage(
            'Microphone access was denied. Please allow microphone permissions in your browser.'
          );
        } else if (event.error === 'no-speech') {
          // Silent timeout or brief pause
        } else if (event.error !== 'aborted') {
          setErrorMessage(`Voice dictation issue: ${event.error}. Please try again.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setErrorMessage('Could not activate microphone. Please check permissions.');
      setIsListening(false);
    }
  };

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentEntry.messages, isSending]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText ?? input).trim();
    if (!textToSend || isSending) return;

    setInput('');
    setErrorMessage(null);

    const userMessage: JournalMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...currentEntry.messages, userMessage];

    // Optimistically update entry state
    const entryWithUserMsg: JournalEntry = {
      ...currentEntry,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };
    onUpdateEntry(entryWithUserMsg);

    setIsSending(true);

    try {
      // Call server-side Gemini multi-turn endpoint
      const reply = await sendChatMessage(
        updatedMessages.map((m) => ({ role: m.role, text: m.text })),
        currentEntry.title
      );

      const modelMessage: JournalMessage = {
        id: `msg-${Date.now() + 1}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'model',
        text: reply,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, modelMessage];
      const entryWithModelReply: JournalEntry = {
        ...entryWithUserMsg,
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
      };

      onUpdateEntry(entryWithModelReply);

      // Persist to Cloud Firestore under user's isolated account
      setSaveStatus('saving');
      await saveJournalEntry(user.uid, entryWithModelReply);
      setSaveStatus('saved');
      onEntrySaved();
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: unknown) {
      console.error('Failed to send message:', err);
      const msg = err instanceof Error ? err.message : 'Failed to communicate with Gemini.';
      setErrorMessage(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleRetryLastMessage = async () => {
    if (isSending || currentEntry.messages.length === 0) return;
    setErrorMessage(null);
    setIsSending(true);

    try {
      const reply = await sendChatMessage(
        currentEntry.messages.map((m) => ({ role: m.role, text: m.text })),
        currentEntry.title
      );

      const modelMessage: JournalMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'model',
        text: reply,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...currentEntry.messages, modelMessage];
      const entryWithModelReply: JournalEntry = {
        ...currentEntry,
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
      };

      onUpdateEntry(entryWithModelReply);
      setSaveStatus('saving');
      await saveJournalEntry(user.uid, entryWithModelReply);
      setSaveStatus('saved');
      onEntrySaved();
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: unknown) {
      console.error('Retry failed:', err);
      const msg = err instanceof Error ? err.message : 'Retry failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (currentEntry.messages.length === 0 || isSummarizing) return;

    setIsSummarizing(true);
    setErrorMessage(null);

    try {
      const summaryResult = await generateEntrySummary(
        currentEntry.messages,
        currentEntry.title
      );

      const updatedEntry: JournalEntry = {
        ...currentEntry,
        title: summaryResult.title || currentEntry.title,
        summary: summaryResult.summary,
        mood: summaryResult.mood || currentEntry.mood || 'Reflective',
        keyThemes: summaryResult.keyThemes || currentEntry.keyThemes || [],
        actionableInsights: summaryResult.actionableInsights || [],
        updatedAt: new Date().toISOString(),
      };

      onUpdateEntry(updatedEntry);

      // Save to Cloud Firestore
      setSaveStatus('saving');
      await saveJournalEntry(user.uid, updatedEntry);
      setSaveStatus('saved');
      onEntrySaved();
      setTimeout(() => setSaveStatus('idle'), 3000);

      // Trigger asynchronous webhook notification to Discord/Slack (strict non-blocking)
      const sentimentTag = summaryResult.mood || currentEntry.mood || 'Reflective';
      const previewText =
        summaryResult.summary ||
        currentEntry.messages
          .filter((m) => m.role === 'user')
          .map((m) => m.text)
          .join(' ') ||
        'New reflection session recorded.';

      sendWebhookNotification(previewText, sentimentTag)
        .then((res) => {
          if (res.success) {
            setWebhookNotice('Dispatched to webhook');
            setTimeout(() => setWebhookNotice(null), 5000);
          }
        })
        .catch((webhookErr) => {
          console.warn('Asynchronous webhook dispatch background failure:', webhookErr);
        });
    } catch (err: unknown) {
      console.error('Failed to generate summary:', err);
      const msg = err instanceof Error ? err.message : 'Failed to synthesize summary.';
      setErrorMessage(msg);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto w-full px-4 sm:px-6 py-4">
      {/* Top Header Card */}
      <div className="bg-white border border-[#EEEEEE] rounded-2xl p-4 sm:p-5 shadow-2xs mb-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <input
              id="journal-title-input"
              type="text"
              value={currentEntry.title}
              onChange={(e) => {
                const updated = { ...currentEntry, title: e.target.value };
                onUpdateEntry(updated);
              }}
              placeholder="Session Title (e.g. Unpacking Today's Thoughts)..."
              className="w-full text-base sm:text-lg font-semibold text-[#1A1A1A] bg-transparent border-b border-transparent hover:border-[#EEEEEE] focus:border-[#7C3AED] focus:outline-none transition-colors"
            />
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span>{currentEntry.messages.length} conversation turns</span>
              <span>•</span>
              <span className="font-mono text-[10px]">
                Isolated: /users/{user.uid.slice(0, 6)}.../journals
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {saveStatus === 'saving' && (
              <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#7C3AED]" />
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Persisted in Firestore
              </span>
            )}

            <button
              type="button"
              id="webhook-settings-button"
              onClick={() => setIsWebhookModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#F9F9FB] text-gray-700 hover:bg-[#F3F4F6] border border-[#EEEEEE] transition-colors cursor-pointer"
              title="Configure Discord / Slack Webhook URL"
            >
              <Webhook
                className={`w-3.5 h-3.5 ${
                  getActiveWebhookUrl() ? 'text-[#7C3AED]' : 'text-gray-400'
                }`}
              />
              <span className="hidden sm:inline">Webhook</span>
              {getActiveWebhookUrl() && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>

            <button
              id="generate-summary-button"
              onClick={handleGenerateSummary}
              disabled={isSummarizing || currentEntry.messages.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#1A1A1A] text-white hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
              title="Analyze session and generate executive AI summary"
            >
              {isSummarizing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#A78BFA]" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
                  <span>
                    {currentEntry.summary ? 'Update Summary' : 'Generate AI Summary'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Summary Banner if generated */}
        {currentEntry.summary && (
          <div className="mt-4 pt-4 border-t border-[#EEEEEE] bg-[#F9F9FB] rounded-xl p-4 border">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                  AI Reflection Summary
                </span>
              </div>
              <div className="flex items-center gap-2">
                {webhookNotice && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full animate-in fade-in">
                    <Webhook className="w-3 h-3 text-emerald-600" />
                    <span>{webhookNotice}</span>
                  </span>
                )}
                {currentEntry.mood && (
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-[#7C3AED] text-xs font-medium border border-[#EDE9FE] shadow-2xs">
                    <Smile className="w-3 h-3 text-[#7C3AED]" />
                    <span>Mood: {currentEntry.mood}</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-3">
              {currentEntry.summary}
            </p>

            {/* Key Themes & Insights */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#EEEEEE]">
              {currentEntry.keyThemes?.map((theme, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-gray-700 border border-[#EEEEEE]"
                >
                  <Tag className="w-2.5 h-2.5 text-gray-400" />
                  {theme}
                </span>
              ))}
            </div>

            {currentEntry.actionableInsights && currentEntry.actionableInsights.length > 0 && (
              <div className="mt-3 pt-2 border-t border-[#EEEEEE]">
                <span className="text-[11px] font-semibold text-[#1A1A1A] flex items-center gap-1 mb-1">
                  <Lightbulb className="w-3 h-3 text-[#7C3AED]" />
                  Takeaways & Gentle Affirmations:
                </span>
                <ul className="space-y-1">
                  {currentEntry.actionableInsights.map((insight, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-1.5 shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="truncate sm:whitespace-normal">{errorMessage}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {currentEntry.messages.length > 0 &&
              currentEntry.messages[currentEntry.messages.length - 1].role === 'user' && (
                <button
                  onClick={() => handleRetryLastMessage()}
                  disabled={isSending}
                  className="px-2.5 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSending ? 'Retrying...' : 'Retry'}
                </button>
              )}
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-900 text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-6 rounded-2xl bg-transparent p-2 sm:p-4 mb-2">
        {currentEntry.messages.length === 0 ? (
          <div className="py-8 sm:py-14 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-[#1A1A1A] mb-1">
              Welcome to your private journaling space
            </h3>
            <p className="text-xs text-gray-500 mb-8 leading-relaxed">
              Gemini acts as your thoughtful, empathetic listening partner. Share what’s on your mind or pick a prompt below to begin.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
              {JOURNAL_PROMPTS.map((prompt) => (
                <button
                  key={prompt.id}
                  id={`prompt-btn-${prompt.id}`}
                  onClick={() => handleSendMessage(prompt.prompt)}
                  className="p-3.5 rounded-xl bg-white border border-[#EEEEEE] hover:border-[#7C3AED]/40 hover:bg-[#FAFAFC] transition-all text-left shadow-2xs group cursor-pointer"
                >
                  <p className="text-xs font-semibold text-[#1A1A1A] group-hover:text-[#7C3AED] transition-colors">
                    {prompt.title}
                  </p>
                  <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                    {prompt.subtitle}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          currentEntry.messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                {isUser ? (
                  <>
                    <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl rounded-tr-none max-w-[85%] sm:max-w-[75%] shadow-xs">
                      <p className="text-sm leading-relaxed text-gray-800 italic font-serif whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1.5 mr-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex gap-3 items-start max-w-[85%] sm:max-w-[80%]">
                      <div className="w-6 h-6 mt-1 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] flex-shrink-0 flex items-center justify-center text-white shadow-2xs">
                        <Sparkles className="w-3 h-3" />
                      </div>
                      <div className="bg-[#F3F4F6] p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed text-gray-700">
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1.5 ml-9">
                      Gemini • {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </>
                )}
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex flex-col items-start">
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 mt-1 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] flex-shrink-0 flex items-center justify-center text-white shadow-2xs">
                <Sparkles className="w-3 h-3" />
              </div>
              <div className="bg-[#F3F4F6] p-4 rounded-2xl rounded-tl-none text-xs text-gray-500 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-bounce"></span>
                </div>
                <span>Gemini is listening & reflecting...</span>
              </div>
            </div>
            <span className="text-[10px] text-gray-400 mt-1.5 ml-9">Gemini • Just now</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer adhering strictly to Clean Minimalism Design HTML */}
      <footer className="pt-2 pb-2 bg-gradient-to-t from-[#F9F9FB] to-transparent shrink-0">
        {isListening && (
          <div className="max-w-2xl sm:max-w-3xl mx-auto mb-2 px-3 py-1.5 rounded-lg bg-[#F5F3FF] border border-[#EDE9FE] flex items-center justify-between text-xs text-[#7C3AED]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="font-medium">Listening to your voice dictation...</span>
            </div>
            <button
              onClick={toggleVoiceDictation}
              className="text-[11px] underline hover:text-[#6D28D9] cursor-pointer"
            >
              Stop recording
            </button>
          </div>
        )}

        <div
          className={`max-w-2xl sm:max-w-3xl mx-auto bg-white border ${
            isListening ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/20' : 'border-[#EEEEEE]'
          } rounded-xl shadow-lg flex items-center p-2 focus-within:ring-2 focus-within:ring-[#7C3AED]/20 transition-all gap-1.5`}
        >
          <textarea
            id="chat-message-input"
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening... Speak your reflection now...'
                : 'Write your heart out... (Press Enter to reflect)'
            }
            className="flex-1 bg-transparent border-none outline-none px-3 text-sm py-2.5 text-gray-700 placeholder:text-gray-400 resize-none"
            disabled={isSending}
          />

          {/* Voice Dictation Button (microphone icon) using Web Speech API */}
          <button
            type="button"
            id="voice-dictation-button"
            onClick={toggleVoiceDictation}
            disabled={isSending}
            title={
              !speechSupported
                ? 'Voice dictation is not supported in this browser'
                : isListening
                ? 'Stop voice dictation'
                : 'Voice Dictation: speak your reflection'
            }
            className={`p-2.5 rounded-lg transition-all flex items-center justify-center shrink-0 cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white shadow-xs animate-pulse'
                : 'text-gray-400 hover:text-[#7C3AED] hover:bg-[#F5F3FF]'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            id="send-message-button"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isSending}
            className="bg-[#1A1A1A] text-white px-4 sm:px-5 py-2.5 rounded-lg text-xs font-medium hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
            title="Send Entry"
          >
            <span className="hidden sm:inline">Send Entry</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-center text-gray-400 mt-2">
          Your thoughts are saved to your secure Cloud Firestore vault.
        </p>
      </footer>

      {/* External Webhook Settings Modal */}
      <WebhookSettingsModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
      />
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Smile,
  Tag,
  Lightbulb,
  MessageSquare,
  Copy,
  Check,
} from 'lucide-react';
import { JournalEntry } from '../types';

interface JournalDetailModalProps {
  entry: JournalEntry | null;
  onClose: () => void;
  onResume: (entry: JournalEntry) => void;
}

export const JournalDetailModal: React.FC<JournalDetailModalProps> = ({
  entry,
  onClose,
  onResume,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary');
  const [copied, setCopied] = useState(false);

  if (!entry) return null;

  const handleCopySummary = () => {
    if (!entry.summary) return;
    navigator.clipboard.writeText(
      `${entry.title}\n\nAI Summary:\n${entry.summary}\n\nMood: ${entry.mood}\nThemes: ${entry.keyThemes?.join(', ')}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-[#EEEEEE] shadow-2xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#EEEEEE] flex items-start justify-between gap-4 bg-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base sm:text-lg font-semibold text-[#1A1A1A]">
                {entry.title || 'Journal Reflection'}
              </h2>
              {entry.mood && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F5F3FF] text-[#7C3AED] border border-[#EDE9FE]">
                  <Smile className="w-2.5 h-2.5 text-[#7C3AED]" />
                  {entry.mood}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(entry.createdAt).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span>{entry.messages.length} conversation turns</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-[#F3F4F6] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3 border-b border-[#EEEEEE] flex items-center justify-between gap-4 bg-[#FDFDFD]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('summary')}
              className={`pb-2.5 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'summary'
                  ? 'border-[#7C3AED] text-[#7C3AED]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Summary & Insights
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`pb-2.5 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'transcript'
                  ? 'border-[#7C3AED] text-[#7C3AED]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Conversation Transcript ({entry.messages.length})
            </button>
          </div>

          {activeTab === 'summary' && entry.summary && (
            <button
              onClick={handleCopySummary}
              className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2.5 px-2.5 py-1 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-gray-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'summary' ? (
            <div className="space-y-4">
              {entry.summary ? (
                <div className="bg-[#F9F9FB] border border-[#EEEEEE] rounded-xl p-4">
                  <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-wider block mb-2">
                    Executive Reflection Summary
                  </span>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {entry.summary}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No summary was generated for this session yet.
                </div>
              )}

              {/* Key themes */}
              {entry.keyThemes && entry.keyThemes.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    Key Themes Explored
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.keyThemes.map((theme, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#F9F9FB] text-gray-700 border border-[#EEEEEE]"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable insights */}
              {entry.actionableInsights && entry.actionableInsights.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-[#7C3AED]" />
                    Takeaways & Affirmations
                  </h4>
                  <ul className="space-y-1.5">
                    {entry.actionableInsights.map((insight, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-gray-700 bg-[#F9F9FB] border border-[#EEEEEE] rounded-lg p-2.5 flex items-start gap-2.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-1.5 shrink-0" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {entry.messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    {isUser ? (
                      <>
                        <div className="bg-white border border-[#E5E7EB] p-3.5 rounded-2xl rounded-tr-none max-w-[85%] shadow-xs">
                          <p className="text-xs sm:text-sm leading-relaxed text-gray-800 italic font-serif whitespace-pre-wrap">
                            {m.text}
                          </p>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 mr-1">
                          {new Date(m.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex gap-2.5 items-start max-w-[85%]">
                          <div className="w-5 h-5 mt-1 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] flex-shrink-0 flex items-center justify-center text-white">
                            <Sparkles className="w-2.5 h-2.5" />
                          </div>
                          <div className="bg-[#F3F4F6] p-3.5 rounded-2xl rounded-tl-none text-xs sm:text-sm leading-relaxed text-gray-700">
                            <p className="whitespace-pre-wrap">{m.text}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 ml-7">
                          Gemini • {new Date(m.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#EEEEEE] flex items-center justify-between bg-[#FDFDFD]">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-[#F3F4F6] transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={() => {
              onResume(entry);
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-[#1A1A1A] text-white hover:bg-black transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>Resume In Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};


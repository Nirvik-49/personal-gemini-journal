import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Calendar,
  Smile,
  Tag,
  MessageSquare,
  Trash2,
  ChevronRight,
  Sparkles,
  PlusCircle,
} from 'lucide-react';
import { JournalEntry } from '../types';
import { deleteJournalEntry } from '../services/journalService';
import { User } from '../firebase';
import { MoodAnalytics } from './MoodAnalytics';

interface JournalHistoryListProps {
  user: User;
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onViewEntryDetails: (entry: JournalEntry) => void;
  onNewSession: () => void;
}

export const JournalHistoryList: React.FC<JournalHistoryListProps> = ({
  user,
  entries,
  onSelectEntry,
  onViewEntryDetails,
  onNewSession,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract unique moods
  const uniqueMoods = useMemo(() => {
    const moods = new Set<string>();
    entries.forEach((e) => {
      if (e.mood) moods.add(e.mood);
    });
    return Array.from(moods);
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.keyThemes?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMood =
        selectedMood === 'all' || entry.mood?.toLowerCase() === selectedMood.toLowerCase();

      return matchesSearch && matchesMood;
    });
  }, [entries, searchQuery, selectedMood]);

  const handleDelete = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this journal entry?')) {
      return;
    }

    try {
      setDeletingId(entryId);
      await deleteJournalEntry(user.uid, entryId);
    } catch (err) {
      console.error('Failed to delete entry:', err);
      alert('Failed to delete entry. Please check permissions.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-[#1A1A1A] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#7C3AED]" />
            <span>Reflections Archive</span>
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Cloud Firestore isolated: /users/{user.uid.slice(0, 8)}...
          </p>
        </div>

        <button
          id="history-new-session-button"
          onClick={onNewSession}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[#1A1A1A] text-white hover:bg-black shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-3.5 h-3.5 text-[#A78BFA]" />
          <span>New Reflection</span>
        </button>
      </div>

      {/* Mood Analytics & Sentiment Tracker */}
      <MoodAnalytics
        entries={entries}
        selectedMood={selectedMood}
        onSelectMood={(mood) => setSelectedMood(mood)}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#EEEEEE] rounded-xl p-3 shadow-2xs mb-6 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="journal-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by topic, summary text, or theme..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#F9F9FB] border border-[#EEEEEE] rounded-lg focus:outline-none focus:border-[#7C3AED] focus:bg-white transition-colors text-gray-700"
          />
        </div>

        {/* Mood filter pills */}
        {uniqueMoods.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] text-gray-400 mr-1 shrink-0">Filter Mood:</span>
            <button
              onClick={() => setSelectedMood('all')}
              className={`px-3 py-1 rounded-lg text-xs transition-colors whitespace-nowrap ${
                selectedMood === 'all'
                  ? 'bg-[#1A1A1A] text-white font-medium'
                  : 'bg-[#F9F9FB] text-gray-600 hover:bg-[#F3F4F6] border border-[#EEEEEE]'
              }`}
            >
              All Moods
            </button>
            {uniqueMoods.map((mood) => (
              <button
                key={mood}
                onClick={() => setSelectedMood(mood)}
                className={`px-3 py-1 rounded-lg text-xs transition-colors whitespace-nowrap ${
                  selectedMood === mood
                    ? 'bg-[#7C3AED] text-white font-medium'
                    : 'bg-[#F9F9FB] text-gray-600 hover:bg-[#F3F4F6] border border-[#EEEEEE]'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white border border-[#EEEEEE] rounded-2xl p-10 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center mx-auto mb-3 border border-[#EDE9FE]">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[#1A1A1A] mb-1">
            {searchQuery || selectedMood !== 'all'
              ? 'No matching journal entries found'
              : 'No journal reflections yet'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5 leading-relaxed">
            {searchQuery || selectedMood !== 'all'
              ? 'Try adjusting your search criteria or clearing filters to view all entries.'
              : 'Begin your first reflection with Gemini to log thoughts, explore feelings, and synthesize AI summaries.'}
          </p>
          <button
            onClick={onNewSession}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-[#1A1A1A] text-white hover:bg-black transition-colors inline-flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#A78BFA]" />
            Start First Journal Session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => onSelectEntry(entry)}
              className="bg-white border border-[#EEEEEE] hover:border-[#7C3AED]/50 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm sm:text-base font-semibold text-[#1A1A1A] group-hover:text-[#7C3AED] transition-colors line-clamp-1">
                    {entry.title || 'Untitled Reflection'}
                  </h3>
                  {entry.mood && (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F5F3FF] text-[#7C3AED] border border-[#EDE9FE]">
                      <Smile className="w-2.5 h-2.5" />
                      {entry.mood}
                    </span>
                  )}
                </div>

                {/* Date & messages count */}
                <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(entry.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {entry.messages.length} messages
                  </span>
                </div>

                {/* AI Summary Snippet */}
                {entry.summary ? (
                  <div className="bg-[#F9F9FB] rounded-lg p-3 border border-[#F0F0F0] mb-3">
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-[#7C3AED] uppercase tracking-wider mb-1">
                      <Sparkles className="w-3 h-3" />
                      AI Summary
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {entry.summary}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic mb-3">
                    No summary generated yet. Click to resume and synthesize.
                  </p>
                )}

                {/* Key Themes */}
                {entry.keyThemes && entry.keyThemes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {entry.keyThemes.slice(0, 3).map((theme, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] bg-[#F9F9FB] text-gray-600 border border-[#EEEEEE]"
                      >
                        <Tag className="w-2 h-2 text-gray-400" />
                        {theme}
                      </span>
                    ))}
                    {entry.keyThemes.length > 3 && (
                      <span className="text-[10px] text-gray-400 self-center">
                        +{entry.keyThemes.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#EEEEEE] text-xs text-gray-500">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewEntryDetails(entry);
                  }}
                  className="text-xs text-[#7C3AED] hover:text-[#6D28D9] font-medium flex items-center gap-1 hover:underline"
                >
                  Read Full Summary
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(e, entry.id)}
                    disabled={deletingId === entry.id}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <span className="flex items-center text-xs text-[#1A1A1A] font-medium group-hover:text-[#7C3AED] group-hover:translate-x-0.5 transition-all">
                    Open <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

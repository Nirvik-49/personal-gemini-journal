import React from 'react';
import { Sparkles, Plus, BookOpen, MessageSquare, LogOut, X } from 'lucide-react';
import { User, signOut, auth } from '../firebase';
import { JournalEntry } from '../types';

interface SidebarProps {
  user: User;
  entries: JournalEntry[];
  currentEntry: JournalEntry | null;
  activeTab: 'chat' | 'history';
  onSelectTab: (tab: 'chat' | 'history') => void;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewSession: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  entries,
  currentEntry,
  activeTab,
  onSelectTab,
  onSelectEntry,
  onNewSession,
  isOpen,
  onClose,
}) => {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  // Get user initials
  const getInitials = () => {
    if (user.displayName) {
      const parts = user.displayName.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return user.displayName.slice(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'GJ';
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white text-[#1A1A1A] select-none">
      {/* Top Brand Header */}
      <div>
        <div className="p-6 border-b border-[#EEEEEE] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-white shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h1 className="text-lg font-semibold tracking-tight text-[#1A1A1A]">
                Gemini Journal
              </h1>
            </div>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-mono text-[10px]">
              Private Space
            </p>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action: New Session */}
        <div className="p-4 pb-2">
          <button
            id="sidebar-new-session-button"
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1A1A1A] text-white hover:bg-black rounded-xl text-xs font-medium transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>New Reflection</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 py-2 flex gap-1 border-b border-[#EEEEEE]">
          <button
            onClick={() => {
              onSelectTab('chat');
              onClose();
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-[#F3F4F6] text-[#1A1A1A]'
                : 'text-gray-500 hover:text-[#1A1A1A] hover:bg-[#FAFAFA]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Chat Session</span>
          </button>
          <button
            onClick={() => {
              onSelectTab('history');
              onClose();
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-[#F3F4F6] text-[#1A1A1A]'
                : 'text-gray-500 hover:text-[#1A1A1A] hover:bg-[#FAFAFA]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>All Archive</span>
          </button>
        </div>
      </div>

      {/* Middle: Recent Reflections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Recent Reflections
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">
              {entries.length}
            </span>
          </div>

          {entries.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400 border border-dashed border-[#EEEEEE] rounded-lg">
              No previous reflections recorded.
            </div>
          ) : (
            <div className="space-y-1.5">
              {entries.slice(0, 8).map((entry) => {
                const isCurrent = currentEntry?.id === entry.id && activeTab === 'chat';
                return (
                  <div
                    key={entry.id}
                    onClick={() => {
                      onSelectEntry(entry);
                      onClose();
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-all border text-left ${
                      isCurrent
                        ? 'bg-[#F9F9F9] border-[#F0F0F0] shadow-2xs'
                        : 'border-transparent hover:bg-[#FAFAFA] hover:border-[#EEEEEE]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-xs font-medium truncate text-[#1A1A1A]">
                        {entry.title || 'Untitled Reflection'}
                      </div>
                      {entry.mood && (
                        <span className="shrink-0 text-[10px] text-[#7C3AED] bg-[#F5F3FF] px-1.5 py-0.2 rounded font-medium">
                          {entry.mood}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {entry.summary
                        ? `AI Summary: ${entry.summary}`
                        : entry.messages.length > 0
                        ? entry.messages[entry.messages.length - 1].text
                        : 'Fresh reflection session...'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-[#EEEEEE] flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-8 h-8 rounded-full border border-[#EEEEEE] object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {getInitials()}
            </div>
          )}
          <div className="text-xs overflow-hidden">
            <div className="font-medium text-[#1A1A1A] truncate">
              {user.displayName || 'User'}
            </div>
            <div className="text-gray-400 text-[10px] truncate max-w-[130px]">
              {user.email || 'Encrypted Vault'}
            </div>
          </div>
        </div>

        <button
          id="sidebar-sign-out-button"
          onClick={handleSignOut}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 border-r border-[#EEEEEE] flex-col bg-white shrink-0 h-full overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-2xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

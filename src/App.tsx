/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, User, testConnection } from './firebase';
import { syncUserProfile, subscribeUserJournals } from './services/journalService';
import { JournalEntry } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AuthView } from './components/AuthView';
import { JournalChat } from './components/JournalChat';
import { JournalHistoryList } from './components/JournalHistoryList';
import { JournalDetailModal } from './components/JournalDetailModal';
import { SecuritySpecModal } from './components/SecuritySpecModal';

function createFreshEntry(userId: string): JournalEntry {
  const now = new Date().toISOString();
  return {
    id: `journal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    title: 'New Journal Reflection',
    messages: [],
    summary: '',
    mood: 'Reflective',
    keyThemes: [],
    actionableInsights: [],
    createdAt: now,
    updatedAt: now,
  };
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [selectedEntryForDetail, setSelectedEntryForDetail] = useState<JournalEntry | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize Auth & test Firestore connectivity
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        syncUserProfile(currentUser);
        setCurrentEntry(createFreshEntry(currentUser.uid));
      } else {
        setEntries([]);
        setCurrentEntry(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to user's isolated Firestore entries
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeUserJournals(
      user.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
      },
      (err) => {
        console.error('Failed to subscribe to user journals:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleNewSession = () => {
    if (!user) return;
    setCurrentEntry(createFreshEntry(user.uid));
    setActiveTab('chat');
  };

  const handleSelectEntryFromHistory = (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setActiveTab('chat');
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-[#FDFDFD] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-gray-500 font-mono">
            Initializing secure vault...
          </p>
        </div>
      </div>
    );
  }

  // If not logged in, render clean single-screen authentication view
  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#EDE9FE] selection:text-[#7C3AED]">
        <Navbar
          user={null}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          onNewSession={handleNewSession}
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        />
        <main className="flex-1 flex flex-col">
          <AuthView />
        </main>
        <SecuritySpecModal
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
        />
      </div>
    );
  }

  // Authenticated layout with Sidebar + Main content container matching Clean Minimalism
  return (
    <div className="flex h-screen w-screen bg-[#FDFDFD] text-[#1A1A1A] font-sans antialiased overflow-hidden selection:bg-[#EDE9FE] selection:text-[#7C3AED]">
      {/* Sidebar navigation & recent reflections */}
      <Sidebar
        user={user}
        entries={entries}
        currentEntry={currentEntry}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onSelectEntry={handleSelectEntryFromHistory}
        onNewSession={handleNewSession}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F9F9FB] h-full overflow-hidden">
        <Navbar
          user={user}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          onNewSession={handleNewSession}
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {activeTab === 'chat' && currentEntry ? (
            <JournalChat
              user={user}
              currentEntry={currentEntry}
              onUpdateEntry={(updated) => setCurrentEntry(updated)}
              onEntrySaved={() => {
                // Journal saved, entries listener will automatically refresh
              }}
            />
          ) : (
            <JournalHistoryList
              user={user}
              entries={entries}
              onSelectEntry={handleSelectEntryFromHistory}
              onViewEntryDetails={(entry) => setSelectedEntryForDetail(entry)}
              onNewSession={handleNewSession}
            />
          )}
        </main>
      </div>

      {/* Entry Reading Modal */}
      <JournalDetailModal
        entry={selectedEntryForDetail}
        onClose={() => setSelectedEntryForDetail(null)}
        onResume={handleSelectEntryFromHistory}
      />

      {/* Security Architecture Modal */}
      <SecuritySpecModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
}


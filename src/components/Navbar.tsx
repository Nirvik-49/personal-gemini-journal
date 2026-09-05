import React from 'react';
import { ShieldCheck, Plus, Menu, BookOpen, MessageSquare } from 'lucide-react';
import { User } from '../firebase';

interface NavbarProps {
  user: User | null;
  activeTab: 'chat' | 'history';
  onSelectTab: (tab: 'chat' | 'history') => void;
  onNewSession: () => void;
  onOpenSecurityModal: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onSelectTab,
  onNewSession,
  onOpenSecurityModal,
  onToggleSidebar,
}) => {
  return (
    <header className="h-16 border-b border-[#EEEEEE] bg-white flex items-center justify-between px-4 sm:px-8 shrink-0 z-20">
      {/* Left: Mobile Toggle & Encrypted Session Status */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && user && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 -ml-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Open Reflections Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <button
          id="security-session-indicator"
          onClick={onOpenSecurityModal}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#F9F9FB] transition-colors group cursor-pointer text-left"
          title="Click to view Security & Cloud Isolation Specs"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 ring-2 ring-green-100 animate-pulse"></span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
              Encrypted Session
            </span>
            <span className="hidden sm:inline-block text-[10px] text-gray-400 uppercase tracking-wider font-mono">
              (Firestore Isolated)
            </span>
          </div>
        </button>
      </div>

      {/* Center/Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {user ? (
          <>
            {/* View switcher for quick navigation */}
            <div className="hidden sm:flex items-center p-1 bg-[#F9F9FB] rounded-lg border border-[#EEEEEE]">
              <button
                id="nav-tab-active-chat"
                onClick={() => onSelectTab('chat')}
                className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === 'chat'
                    ? 'bg-white text-[#1A1A1A] shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Active Session</span>
              </button>
              <button
                id="nav-tab-history"
                onClick={() => onSelectTab('history')}
                className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === 'history'
                    ? 'bg-white text-[#1A1A1A] shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Archive</span>
              </button>
            </div>

            {/* Security Spec Modal Button */}
            <button
              id="security-info-button"
              onClick={onOpenSecurityModal}
              className="text-xs font-medium text-gray-500 hover:text-[#1A1A1A] flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              title="Security & Isolation Specs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden lg:inline">Security Specs</span>
            </button>

            {/* New Session Action */}
            <button
              id="navbar-new-session-button"
              onClick={onNewSession}
              className="text-xs font-medium text-[#7C3AED] hover:text-[#6D28D9] flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-[#F5F3FF] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>
          </>
        ) : (
          <button
            onClick={onOpenSecurityModal}
            className="text-xs font-medium text-gray-500 hover:text-[#1A1A1A] flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero-Trust Architecture</span>
          </button>
        )}
      </div>
    </header>
  );
};


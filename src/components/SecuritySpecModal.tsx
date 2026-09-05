import React from 'react';
import { ShieldCheck, X, Lock, KeyRound, Database, CheckCircle2 } from 'lucide-react';

interface SecuritySpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecuritySpecModal: React.FC<SecuritySpecModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-[#EEEEEE] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#EEEEEE] flex items-start justify-between gap-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1A1A1A]">
                Security Architecture & Cloud Isolation
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Zero-trust cloud architecture applied to Gemini Journal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-[#F3F4F6] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-gray-700">
          {/* Section 1 */}
          <div className="bg-[#F9F9FB] border border-[#EEEEEE] rounded-xl p-4">
            <div className="flex items-center gap-2 font-medium text-[#1A1A1A] mb-1.5">
              <Lock className="w-4 h-4 text-[#7C3AED]" />
              <span>1. Firebase Authentication & Server JWT Validation</span>
            </div>
            <p className="text-gray-600 leading-relaxed mb-2">
              User identity is authenticated via Firebase Auth OAuth 2.0 with Google. No plain-text passwords or custom auth forms are handled.
            </p>
            <div className="bg-[#1A1A1A] text-gray-200 p-2.5 rounded-lg font-mono text-[11px] leading-tight">
              Authorization: Bearer &lt;firebaseIdToken&gt;
              <br />
              <span className="text-emerald-400">✓</span> Backend verifies RS256 signature, expiry, issuer & audience
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-[#F9F9FB] border border-[#EEEEEE] rounded-xl p-4">
            <div className="flex items-center gap-2 font-medium text-[#1A1A1A] mb-1.5">
              <Database className="w-4 h-4 text-sky-600" />
              <span>2. Cloud Firestore Zero-Trust Isolation</span>
            </div>
            <p className="text-gray-600 leading-relaxed mb-2">
              All journaling entries, chat sessions, and generated summaries are strictly partitioned by UID under:
            </p>
            <pre className="bg-[#1A1A1A] text-purple-200 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
{`match /users/{userId}/journals/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}`}
            </pre>
            <p className="text-gray-500 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Zero cross-user data leakage guaranteed by server-side Firestore security rules.
            </p>
          </div>

          {/* Section 3 */}
          <div className="bg-[#F9F9FB] border border-[#EEEEEE] rounded-xl p-4">
            <div className="flex items-center gap-2 font-medium text-[#1A1A1A] mb-1.5">
              <KeyRound className="w-4 h-4 text-rose-600" />
              <span>3. API Key & Secret Management</span>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Gemini API keys are never exposed to client browsers or bundled into client code. Requests to Gemini models are proxied strictly through server-side Express routes with prompt sanitization and length bounds to prevent injection attacks.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EEEEEE] bg-[#FDFDFD] text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-[#1A1A1A] text-white hover:bg-black transition-colors cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};


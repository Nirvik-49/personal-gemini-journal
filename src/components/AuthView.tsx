import React, { useState } from 'react';
import { Shield, Sparkles, Lock, Database, ArrowRight, AlertCircle } from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '../firebase';

export const AuthView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('Firebase Auth sign-in failed:', err);
      const msg = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#FDFDFD]">
      <div className="w-full max-w-md bg-white border border-[#EEEEEE] rounded-2xl shadow-sm p-6 sm:p-8">
        {/* App Emblem */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] text-white flex items-center justify-center shadow-xs mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1A1A1A]">
            Gemini Journal
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-widest font-mono">
            Private Space
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-sm leading-relaxed">
            Engage in private multi-turn reflective journaling with Gemini. Entries and AI summaries persist in your isolated Cloud Firestore account.
          </p>
        </div>

        {/* Security Highlights */}
        <div className="space-y-3 mb-8 bg-[#F9F9FB] border border-[#EEEEEE] rounded-xl p-4 text-xs text-gray-600">
          <div className="flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <strong className="text-[#1A1A1A] font-medium block">Isolated Cloud Firestore</strong>
              Data stored under <code className="text-[11px] font-mono bg-white border border-[#EEEEEE] px-1 py-0.5 rounded text-gray-700">/users/&#123;uid&#125;/journals</code> guarded by zero-trust security rules.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-[#7C3AED] mt-0.5 shrink-0" />
            <div>
              <strong className="text-[#1A1A1A] font-medium block">Secure Firebase Auth</strong>
              Federated OAuth 2.0 with cryptographic JWT verification on server endpoints.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Database className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
            <div>
              <strong className="text-[#1A1A1A] font-medium block">Automated AI Summaries</strong>
              Gemini synthesizes multi-turn conversations into executive reflections, mood analysis, and themes.
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Sign In CTA */}
        <button
          id="google-sign-in-button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium text-xs sm:text-sm text-[#1A1A1A] bg-white border border-[#EEEEEE] hover:bg-[#FAFAFC] hover:border-[#E5E7EB] active:scale-[0.99] transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
              <ArrowRight className="w-4 h-4 ml-auto text-gray-400" />
            </>
          )}
        </button>

        <p className="text-center text-[10px] text-gray-400 mt-5">
          Your thoughts are saved to your secure Cloud Firestore vault.
        </p>
      </div>
    </div>
  );
};


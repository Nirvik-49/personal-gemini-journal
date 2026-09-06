import React, { useState, useEffect } from 'react';
import {
  Webhook,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Send,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import {
  DISCORD_WEBHOOK_URL,
  getActiveWebhookUrl,
  setLocalWebhookUrl,
  sendWebhookNotification,
} from '../services/webhookService';

interface WebhookSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebhookSettingsModal: React.FC<WebhookSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    error?: string;
    message?: string;
  } | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrlInput(getActiveWebhookUrl());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setLocalWebhookUrl(urlInput.trim());
    setTestResult({
      success: true,
      message: urlInput.trim()
        ? 'Webhook URL saved for this browser session.'
        : 'Webhook URL cleared.',
    });
  };

  const handleTestDispatch = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Save whatever is currently typed in first
    setLocalWebhookUrl(urlInput.trim());

    try {
      const res = await sendWebhookNotification(
        'Testing webhook dispatch: "Today I embraced quiet mindfulness and grateful focus."',
        'Grateful'
      );

      if (res.success) {
        setTestResult({
          success: true,
          message: 'Test notification delivered successfully! Check your Discord/Slack channel.',
        });
      } else if (res.skipped) {
        setTestResult({
          success: false,
          error: 'Please enter a valid webhook URL before sending a test notification.',
        });
      } else {
        setTestResult({
          success: false,
          error: res.error || 'Failed to dispatch test notification.',
        });
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown test dispatch failure',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const samplePayloadJson = JSON.stringify(
    {
      title: '📝 New Reflection Journal Logged',
      preview: 'Today I embraced quiet mindfulness and grateful focus…',
      sentimentTag: 'Grateful',
      timestamp: new Date().toISOString(),
      sourceFooter: 'Personal Gemini Journal • Cloud Run',
      embeds: [
        {
          title: '📝 New Reflection Journal Logged',
          description: 'Today I embraced quiet mindfulness and grateful focus…',
          color: 8141549,
          fields: [
            { name: 'Mood / Sentiment Tag', value: 'Grateful', inline: true },
            { name: 'Timestamp', value: 'Just now', inline: true },
          ],
          footer: { text: 'Personal Gemini Journal • Cloud Run' },
        },
      ],
    },
    null,
    2
  );

  const copySamplePayload = () => {
    navigator.clipboard.writeText(samplePayloadJson);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const activeUrl = getActiveWebhookUrl();
  const isConfigured = Boolean(activeUrl && activeUrl.startsWith('http'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#EEEEEE] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#EEEEEE] bg-[#FDFDFD]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center border border-[#EDE9FE]">
              <Webhook className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A]">
                External Webhook Notifications
              </h3>
              <p className="text-xs text-gray-400">
                Discord / Slack / Automation Webhook Dispatch
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-[#F3F4F6] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status Indicator */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F9F9FB] border border-[#EEEEEE]">
            <span className="font-medium text-gray-600">Current Status:</span>
            {isConfigured ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Active & Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Unconfigured (Silent Mode)
              </span>
            )}
          </div>

          {/* Webhook URL Input */}
          <div>
            <label
              htmlFor="webhook-url-input"
              className="block font-semibold text-gray-700 mb-1"
            >
              Discord / Slack Webhook URL
            </label>
            <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">
              Whenever you generate an AI summary for a reflection, an asynchronous POST
              payload will be delivered to this URL.
            </p>
            <input
              id="webhook-url-input"
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://discord.com/api/webhooks/... or https://hooks.slack.com/..."
              className="w-full px-3 py-2 rounded-xl border border-[#EEEEEE] bg-[#FDFDFD] focus:border-[#7C3AED] focus:outline-none text-xs text-gray-800 font-mono placeholder:text-gray-300"
            />
          </div>

          {/* Code Configuration Info */}
          <div className="p-3 rounded-xl bg-[#F5F3FF] border border-[#EDE9FE] text-[#5B21B6] space-y-1 text-[11px]">
            <div className="font-semibold flex items-center gap-1">
              <span>Developers:</span>
            </div>
            <p className="leading-relaxed text-gray-600">
              You can also permanently paste your URL into the{' '}
              <code className="px-1 py-0.5 rounded bg-white font-mono text-[10px] text-[#7C3AED] border border-[#DDD6FE]">
                DISCORD_WEBHOOK_URL
              </code>{' '}
              constant in{' '}
              <code className="px-1 py-0.5 rounded bg-white font-mono text-[10px] text-[#7C3AED] border border-[#DDD6FE]">
                /src/services/webhookService.ts
              </code>{' '}
              or set{' '}
              <code className="px-1 py-0.5 rounded bg-white font-mono text-[10px] text-[#7C3AED] border border-[#DDD6FE]">
                VITE_DISCORD_WEBHOOK_URL
              </code>
              .
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              className="px-3.5 py-1.5 rounded-xl bg-[#1A1A1A] text-white font-medium hover:bg-black transition-colors cursor-pointer text-xs"
            >
              Save URL
            </button>

            <button
              type="button"
              onClick={handleTestDispatch}
              disabled={isTesting || !urlInput.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-[#7C3AED] text-white font-medium hover:bg-[#6D28D9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5 text-xs shadow-xs"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching Test...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test Notification</span>
                </>
              )}
            </button>
          </div>

          {/* Test Status Output */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">
                {testResult.message || testResult.error}
              </span>
            </div>
          )}

          {/* Collapsible Sample Payload */}
          <div className="border-t border-[#EEEEEE] pt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Payload Specification Preview
              </span>
              <button
                type="button"
                onClick={copySamplePayload}
                className="text-[10px] text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedPayload ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-2.5 rounded-lg bg-[#F9F9FB] border border-[#EEEEEE] text-[10px] font-mono text-gray-700 overflow-x-auto max-h-32">
              {samplePayloadJson}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EEEEEE] bg-[#FDFDFD] flex items-center justify-between text-[11px] text-gray-400">
          <span>Non-blocking • Errors will never interrupt journaling</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-gray-700 hover:bg-[#F3F4F6] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

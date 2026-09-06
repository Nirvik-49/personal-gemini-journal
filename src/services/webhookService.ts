/**
 * External Webhook Notification Service
 * Dispatches asynchronous notifications to Discord or Slack webhooks
 * upon journal entry submission and AI reflection synthesis.
 */

// ============================================================================
// 1. Webhook URL Configuration
// Paste your Discord or Slack Webhook URL here:
// Example: "https://discord.com/api/webhooks/1234567890/abcde_fg..."
// ============================================================================
export const DISCORD_WEBHOOK_URL: string = "";

/**
 * Storage key for optional local browser webhook override
 */
const LOCAL_STORAGE_WEBHOOK_KEY = "gemini_journal_webhook_url";

/**
 * Resolves the active webhook URL from:
 * 1. The hardcoded constant above (if provided)
 * 2. The environment variable (VITE_DISCORD_WEBHOOK_URL)
 * 3. Browser localStorage override (for live testing)
 */
export function getActiveWebhookUrl(): string {
  if (DISCORD_WEBHOOK_URL && DISCORD_WEBHOOK_URL.trim() !== "") {
    return DISCORD_WEBHOOK_URL.trim();
  }

  // Check client environment variable
  try {
    const envUrl = (import.meta as unknown as { env?: { VITE_DISCORD_WEBHOOK_URL?: string } })?.env?.VITE_DISCORD_WEBHOOK_URL;
    if (envUrl && envUrl.trim() !== "") {
      return envUrl.trim();
    }
  } catch {
    // ignore
  }

  // Check localStorage override
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_WEBHOOK_KEY);
      if (stored && stored.trim() !== "") {
        return stored.trim();
      }
    }
  } catch {
    // ignore
  }

  return "";
}

/**
 * Saves a local webhook URL override in the browser for testing
 */
export function setLocalWebhookUrl(url: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      if (!url || url.trim() === "") {
        window.localStorage.removeItem(LOCAL_STORAGE_WEBHOOK_KEY);
      } else {
        window.localStorage.setItem(LOCAL_STORAGE_WEBHOOK_KEY, url.trim());
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Threat Modeling & Data Sanitization:
 * Strips malicious control characters, log injection sequences,
 * and caps maximum preview length to prevent accidental payload overflow.
 */
function sanitizeTextPayload(input: string, maxLength = 280): string {
  if (!input || typeof input !== "string") return "";

  // Normalize Unicode, remove control characters (except basic whitespace)
  const cleaned = input
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return cleaned.slice(0, maxLength).trim() + "…";
}

/**
 * Dispatches an asynchronous POST request to the configured Discord or Slack webhook.
 *
 * Payload structure includes:
 * - Title: "📝 New Reflection Journal Logged"
 * - Preview: Short snippet of the journal entry text
 * - Mood/Sentiment Tag: The AI-extracted emotional tag
 * - Timestamp: Current date and time
 * - Source Footer: "Personal Gemini Journal • Cloud Run"
 *
 * Guardrails:
 * - Non-blocking asynchronous dispatch
 * - Strict try/catch wrapper prevents any interruption to main journal submission flow
 * - Input sanitization against log injection and data overexposure
 */
export async function sendWebhookNotification(
  entryText: string,
  sentimentTag: string
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  try {
    const webhookUrl = getActiveWebhookUrl();

    // Gracefully skip if no webhook URL has been configured yet
    if (!webhookUrl || !webhookUrl.startsWith("http")) {
      console.info(
        "[Webhook Service] Notice: DISCORD_WEBHOOK_URL is not configured. Webhook dispatch was skipped."
      );
      return { success: false, skipped: true, error: "Webhook URL not configured" };
    }

    // Sanitize outgoing text snippet & sentiment tag
    const sanitizedPreview = sanitizeTextPayload(entryText, 260) || "Reflective journal entry completed.";
    const sanitizedMood = sanitizeTextPayload(sentimentTag, 40) || "Reflective";
    const now = new Date();
    const isoTimestamp = now.toISOString();
    const formattedTimestamp = now.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    const isSlack = webhookUrl.includes("hooks.slack.com");

    // Unified payload supporting raw JSON consumers, Discord Rich Embeds, and Slack formatting
    const payload = {
      // 1. Raw Specification Fields
      title: "📝 New Reflection Journal Logged",
      preview: sanitizedPreview,
      sentimentTag: sanitizedMood,
      timestamp: isoTimestamp,
      sourceFooter: "Personal Gemini Journal • Cloud Run",

      // 2. Discord Webhook Embed format
      content: isSlack ? undefined : "📝 **New Reflection Journal Logged**",
      embeds: isSlack
        ? undefined
        : [
            {
              title: "📝 New Reflection Journal Logged",
              description: sanitizedPreview,
              color: 0x7c3aed, // Purple accent (#7C3AED)
              fields: [
                {
                  name: "Mood / Sentiment Tag",
                  value: sanitizedMood,
                  inline: true,
                },
                {
                  name: "Timestamp",
                  value: formattedTimestamp,
                  inline: true,
                },
              ],
              footer: {
                text: "Personal Gemini Journal • Cloud Run",
              },
              timestamp: isoTimestamp,
            },
          ],

      // 3. Slack Webhook Text format
      text: `📝 *New Reflection Journal Logged*\n*Mood/Sentiment:* ${sanitizedMood}\n*Preview:* ${sanitizedPreview}\n*Timestamp:* ${formattedTimestamp}\n_Personal Gemini Journal • Cloud Run_`,
    };

    // Execute asynchronous HTTP POST dispatch
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.warn(
        `[Webhook Service] Webhook endpoint responded with HTTP ${response.status}: ${errorText}`
      );
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText || "Endpoint error"}`,
      };
    }

    console.info("[Webhook Service] Notification successfully dispatched to webhook endpoint.");
    return { success: true };
  } catch (err: unknown) {
    // Strict non-blocking catch: never crash or block the primary journal submission flow
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn("[Webhook Service] Non-blocking error occurred during webhook dispatch:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

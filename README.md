# Personal Gemini Journal 🚀
> **Accelerate AI with Cloud Run APAC Ideathon 2026 Submission**

Personal Gemini Journal is a secure, production-grade journaling web application built to transform personal reflection through conversational AI, real-time voice input, automated mood analytics, and external automation webhook dispatches. Powered by Google AI Studio, deployed on Google Cloud Run, authenticated via Firebase Auth, and backed by Cloud Firestore, the application ensures complete per-user privacy and data isolation.

---

## 🔗 Submission Links
* **Live Application URL:** [https://geminijournalnirvik2026.ai.studio](https://geminijournalnirvik2026.ai.studio)
* **Public GitHub Repository:** [https://github.com/Nirvik-49/personal-gemini-journal](https://github.com/Nirvik-49/personal-gemini-journal)

---

## 📋 Brief Description: What We Built & Integration Overview

Personal Gemini Journal combines generative AI with modern serverless cloud infrastructure to create a private digital sanctuary for personal reflection.

### 🔑 How We Used Google Cloud Components & APIs:

1. **Firebase Authentication (`Firebase Auth`)**
   - Implements Google OAuth 2.0 single sign-on (SSO) to establish secure user identity sessions.
   - Binds every journaling session to an explicit, authenticated user identity (`uid`).

2. **Cloud Firestore (`Firestore Isolated Data Vault`)**
   - Serves as the primary persistence layer for storing chat sessions, reflection logs, and AI-generated metadata.
   - Implements strict **per-user database isolation rules** (`/users/{userId}/journals/{document=**}`). Users can only read, write, or query their own reflection data.

3. **Google Cloud Run (`Cloud Run`)**
   - Hosts the production-grade web application container with auto-scaling from 0 to handle concurrent traffic spikes efficiently.
   - Operates as a stateless compute layer serving static assets and dynamic requests over HTTPS.

4. **Gemini API (`Google AI Studio`)**
   - Drives multi-turn conversational processing, extracting emotional sentiment tags, generating structured reflection summaries, and calculating sentiment arcs.
   - Configured with resilient multi-model failover strategies to guarantee prompt delivery.

5. **Google Cloud Secret Manager (`Secret Manager`)**
   - Securely stores server-side API keys and environment variables at runtime, ensuring sensitive credentials are never exposed in client bundles.

---

## ✨ Key Features & Innovations

* **🔒 Secure Per-User Data Isolation:** Strict security rules enforced directly at the Cloud Firestore database tier.
* **🤖 Automated AI Summarization & Failover:** Instant reflection summaries generated via the Gemini API with automatic model fallback strategies.
* **📊 Mood Analytics & Sentiment Arc Tracker:** Dynamically extracts emotional tags and tracks mood trajectories across historical reflections in the Archive view.
* **🎙️ Voice-to-Text Dictation Mode:** Real-time speech-to-text input integrated into the composer using the browser-native Web Speech API.
* **🔔 External Webhook Notifications (Slack/Discord):** Asynchronously dispatches rich JSON payloads (entry snippet, sentiment tag, timestamp, and source footer) to configured Discord/Slack channels or webhook test endpoints.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Generative AI** | Gemini API (`gemini-2.0-flash` / `gemini-1.5-flash`) | Multi-turn chat, mood analysis, & automated summarization |
| **Compute & Hosting** | Google Cloud Run | Serverless container deployment & HTTPS routing |
| **Authentication** | Firebase Auth | Google SSO and session management |
| **Database** | Cloud Firestore | Isolated document storage per authenticated UID |
| **Secrets Management**| Google Cloud Secret Manager | Server-side key storage and runtime configuration |
| **Voice Interface** | Web Speech API | Real-time speech-to-text dictation in entry composer |
| **Integrations** | Webhooks (Discord/Slack/Custom) | Asynchronous JSON payload dispatch on reflection completion |
| **Development** | Google AI Studio App Builder | Web layout, UI components, & deployment pipeline |

---

## 🛡️ Security Architecture & Firestore Rules

To enforce strict security, user privacy, and non-blocking integration safety, Cloud Firestore access is restricted exclusively to authenticated owners:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/journals/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Note: Webhook notification triggers execute in non-blocking try-catch blocks to prevent third-party network issues from interrupting local journaling transactions.

## Local Development & Deployment Steps
### Prerequisites
- Node.js (v18 or higher)

- Google Cloud SDK (gcloud CLI) installed and authenticated

- An active Google Cloud Platform (GCP) project with billing enabled

### 1. Local Setup
Clone the repository and install dependencies:
```
git clone [https://github.com/Nirvik-49/personal-gemini-journal.git](https://github.com/Nirvik-49/personal-gemini-journal.git)
cd personal-gemini-journal
npm install
```

Start the local development server:
```
npm run dev
```

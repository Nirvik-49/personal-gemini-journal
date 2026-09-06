# Personal Gemini Journal 🚀
> **Accelerate AI with Cloud Run APAC Ideathon 2026 Submission**

Personal Gemini Journal is a secure, production-grade journaling web application built to transform personal reflection through conversational AI, real-time voice input, and automated mood analytics. Powered by Google AI Studio, deployed seamlessly on Google Cloud Run, authenticated via Firebase Auth, and backed by Cloud Firestore, the application ensures complete per-user privacy and data isolation.

---

## 📋 Brief Description: What We Built & Integration Overview

Personal Gemini Journal combines state-of-the-art generative AI with modern serverless cloud infrastructure to create a private digital sanctuary for personal reflection.

### 🔑 How We Used Google Cloud Components & APIs:

1. **Firebase Authentication (`Firebase Auth`)**
   - Implements Google OAuth 2.0 single sign-on (SSO) to establish secure user identity sessions.
   - Generates verified JSON Web Tokens (JWTs) that bind every journaling session to an explicit, authenticated user identity (`uid`).

2. **Cloud Firestore (`Firestore Isolated Data Vault`)**
   - Serves as the primary persistence layer for storing chat sessions, reflection logs, and AI-generated metadata.
   - Implements strict **per-user database isolation rules** (`/users/{userId}/journals/{document=**}`). Users can only read, write, or query their own encrypted reflection data; cross-tenant access is blocked at the database rule level.

3. **Google Cloud Run (`Cloud Run`)**
   - Hosts the production-grade web application container with auto-scaling from 0 to handle concurrent traffic spikes efficiently.
   - Operates as a stateless compute layer that bridges the user client with Google Cloud services and the Gemini API while serving static and dynamic assets over HTTPS.

4. **Gemini API (`Google AI Studio`)**
   - Drives multi-turn conversational processing, extracting emotional sentiment tags, generating structured reflection summaries, and calculating longitudinal sentiment arcs.
   - Configured with resilient multi-model failover strategies to guarantee prompt delivery and zero-downtime availability.

5. **Google Cloud Secret Manager (`Secret Manager`)**
   - Securely stores and injects server-side API keys and environment variables at runtime, ensuring sensitive credentials are never hardcoded or exposed in client bundles.

---

## ✨ Key Features & Freestyle Innovations

### 🔒 1. Secure Per-User Data Isolation
- Strict security rules enforced directly at the Cloud Firestore database tier.
- JWT validation ensures zero data leakage between different authenticated sessions.

### 🤖 2. Automated AI Summarization & Multi-Model Failover
- Real-time generation of concise, high-value reflection summaries after each journal turn.
- Intelligent multi-model fallback logic that gracefully degrades across Gemini 1.5/2.0 model tiers if rate limits occur.

### 📊 3. Mood Analytics & Sentiment Arc Tracker *(Freestyle Feature)*
- **Emotional Tag Cloud:** Automatically categorizes entries with dynamic emotional tags (e.g., *Reflective*, *Focused Momentum*, *Uplifting*).
- **Sentiment Trajectory Graph:** Visualizes mood changes over time across historical reflections in the Archive tab.
- **Metrics Breakdown:** Computes top dominant emotions and positive vs. reflective proportions across all logged entries.

### 🎙️ 4. Voice-to-Text Dictation Mode *(Freestyle Feature)*
- Hands-free dictation integrated directly into the message composer using the browser-native **Web Speech API**.
- Real-time streaming transcription with live listening indicators (`Listening to your voice dictation...`) and instant stop control.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Generative AI** | Gemini API (`gemini-2.0-flash` / `gemini-1.5-flash`) | Multi-turn chat, mood analysis, & automated summarization |
| **Compute & Hosting** | Google Cloud Run | Serverless container deployment & HTTPS routing |
| **Authentication** | Firebase Auth | Google SSO, identity tokens, and session management |
| **Database** | Cloud Firestore | Isolated document storage per authenticated UID |
| **Secrets Management**| Google Cloud Secret Manager | Server-side key storage and runtime environment configuration |
| **Voice Interface** | Web Speech API | Real-time speech-to-text dictation in entry composer |
| **Development** | Google AI Studio App Builder | Web layout, UI components, & rapid previewing |

---

## 🛡️ Security Architecture & Firestore Rules

To enforce strict security and privacy, Cloud Firestore access is restricted exclusively to authenticated owners:

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

🏷️ Challenge Hashtag
#AccelerateAIwithCloudRun

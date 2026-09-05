# Personal Gemini Journal 🚀

An authenticated, secure multi-turn reflection journal powered by Gemini API, Google Cloud Run, Firebase Authentication, and Cloud Firestore. Built for the Accelerate AI with Cloud Run APAC Ideathon.

## ✨ Key Features
- 🔒 **Secure Data Isolation:** Per-user Firestore database isolation and JWT authentication via Firebase Auth.
- 🤖 **Automated AI Summaries:** Instant reflection summaries generated via the Gemini API using resilient multi-model failover.
- 📊 **Mood Analytics Dashboard:** Extracts emotional sentiment tags and tracks sentiment arcs over time in the Archive view.
- 🎙️ **Voice Dictation Mode:** Built-in Web Speech API integration to dictate reflections directly into the message composer.

## 🛠️ Architecture & Tech Stack
- **AI Models:** Gemini API (Google AI Studio)
- **Frontend & App Engine:** Google AI Studio App Builder
- **Authentication:** Firebase Auth (Google Sign-In)
- **Database:** Cloud Firestore (Isolated Rules)
- **Deployment:** Google Cloud Run
- **Secret Management:** Google Cloud Secret Manager

## 🏷️ Challenge Hashtag
`#AccelerateAIwithCloudRun`

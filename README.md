# Phrase Learner

A single-user phrase learning app with spaced repetition.

## Tech Stack

- **Frontend**: Angular 19, standalone components
- **Database**: Firebase Firestore
- **AI**: GROQ API (Llama 3.1 for autofill)
- **Hosting**: Azure Static Web Apps

## Features

- Add phrases with meaning, example, and personal notes
- AI-powered autofill (✨ button)
- Spaced repetition review system
- Mobile-first responsive design
- Voice input support

## Review Logic

- **Know**: Mark as Mastered, won't appear again
- **Don't Know**: Keep in Learning, show again in current session

## Local Development

### Prerequisites

- Node.js 22+

### Setup

1. Clone the repo
2. Update `Frontend/src/environments/environment.ts` with your Firebase and GROQ credentials
3. Run:

```bash
cd Frontend
npm install
npm start
```

Open http://localhost:4200

## Deploy to Azure Static Web Apps

1. Push to GitHub
2. Create Azure Static Web App:
   - **Source**: GitHub
   - **App location**: `/Frontend`
   - **Output location**: `dist/phrase-learner/browser`
3. Add the following GitHub repository secrets:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `GROQ_API_KEY`

## Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Create a `phrases` collection. Each document uses the following fields:

| Field | Type |
|---|---|
| `text` | string |
| `meaning` | string \| null |
| `example` | string \| null |
| `personal_note` | string \| null |
| `status` | number (0 = New, 1 = Learning, 2 = Mastered) |
| `created_at` | string (ISO 8601) |
| `last_reviewed_at` | string \| null |
| `next_review_at` | string (ISO 8601) |

4. Set Firestore security rules as needed (e.g. restrict to authenticated users or allow all for single-user use)

## Project Structure

```
phrases-static/
├── Frontend/
│   └── src/
│       ├── app/
│       │   ├── add-phrase/
│       │   ├── dashboard/
│       │   ├── review/
│       │   ├── models/
│       │   └── services/
│       └── environments/
├── .github/workflows/
└── README.md
```

## License

MIT

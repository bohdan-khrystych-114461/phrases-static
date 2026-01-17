# Phrase Learner

A single-user phrase learning app with spaced repetition.

## Tech Stack

- **Frontend**: Angular 19, standalone components
- **Database**: Supabase (PostgreSQL)
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
2. Configure `Frontend/src/config.js` with your Supabase and GROQ credentials
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
3. Add deployment token to GitHub secrets as `AZURE_STATIC_WEB_APPS_API_TOKEN`

## Supabase Setup

Create a `phrases` table:

```sql
CREATE TABLE phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  meaning TEXT,
  example TEXT,
  personal_note TEXT,
  status INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE phrases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON phrases FOR ALL USING (true);
```

## Project Structure

```
phrases2/
├── Frontend/
│   └── src/
│       ├── app/
│       │   ├── add-phrase/
│       │   ├── dashboard/
│       │   ├── review/
│       │   ├── models/
│       │   └── services/
│       ├── config.js
│       └── environments/
├── .github/workflows/
└── README.md
```

## License

MIT

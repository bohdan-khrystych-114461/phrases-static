# Deploying to Render

## Backend (Web Service)

1. **Create a new Web Service** on Render
2. **Connect your GitHub repo**
3. **Settings:**
   - **Root Directory:** `Backend`
   - **Runtime:** Docker
   - **Instance Type:** Free (or paid for better performance)

4. **Environment Variables:**
   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Your PostgreSQL connection string from Render |
   | `FRONTEND_URL` | Your static site URL (e.g., `https://phrase-learner.onrender.com`) |
   | `GROQ_API_KEY` | Your Groq API key for AI auto-fill |

5. **Create a PostgreSQL database** on Render and copy the **Internal Database URL** to `DATABASE_URL`

---

## Frontend (Static Site)

1. **Create a new Static Site** on Render
2. **Connect your GitHub repo**
3. **Settings:**
   - **Root Directory:** `Frontend`
   - **Build Command:** `npm install && npm run build:prod`
   - **Publish Directory:** `dist/phrase-learner/browser`

4. **After deploying**, edit `config.js` in your repo:
   ```javascript
   window.API_URL = 'https://YOUR-BACKEND-URL.onrender.com/api';
   ```
   Replace `YOUR-BACKEND-URL` with your actual backend service URL.

---

## Post-Deployment

1. Update `FRONTEND_URL` on the backend with your static site URL
2. Update `config.js` in the frontend with your backend URL
3. Redeploy both services

---

## Local Development

For local development, the app still works with Docker:
```bash
docker-compose up
```
Or use the existing Dockerfile in the root directory.

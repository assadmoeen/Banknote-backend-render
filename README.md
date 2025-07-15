# Banknote Checker Backend

This is the Express backend for the Banknote Checker app.

## 📦 Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`.

3. Run locally:
   ```bash
   npm start
   ```

## 🌐 Deploy to Render

- Set `Root Directory` to `server`
- Use `Build Command`: `npm install`
- Use `Start Command`: `npx ts-node server/index.ts`
- Add env var: `DATABASE_URL`

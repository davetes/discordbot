# Tidy Bot Control

Web control panel + backend service for managing a Discord bot.

## Tech stack

- Next.js (frontend)
- FastAPI + `discord.py` (backend)

## Repo layout

- `src/`: Next.js app
- `backend/`: FastAPI service that starts and manages the Discord bot

## Requirements

- Node.js (recommended: LTS)
- Python 3.11+ (3.10 may work if dependencies allow)

## Local development

### 1) Frontend (Next.js)

From the project root:

```sh
npm install
npm run dev
```

The frontend runs on `http://localhost:3000`.

### 2) Backend (FastAPI + Discord bot)

Create the backend env file:

- Copy `backend/.env.example` to `backend/.env`
- Fill in the required values

Install backend dependencies:

```sh
pip install -r backend/requirements.txt
```

Run the API:

```sh
uvicorn backend.app.main:app --reload --port 8000
```

The API will be available on:

- `http://localhost:8000/health`
- `http://localhost:8000/docs`

## Configuration

Backend configuration is read from `backend/.env`.

- `FRONTEND_ORIGIN`
- `DISCORD_BOT_TOKEN`
- `DISCORD_GUILD_ID`
- `DISCORD_DEFAULT_CHANNEL_ID`

## Scripts

From the project root:

- `npm run dev`: start the frontend dev server
- `npm run build`: build the frontend
- `npm run start`: run the built frontend
- `npm run lint`: lint the frontend
- `npm run test`: run tests (`vitest run`)

# Aria — Personal Video Companion

A friendly, privacy-first video companion app that simulates a real face-to-face conversation by combining LLM responses, TTS, and realistic talking videos (D-ID or SadTalker).

## Key Features

- Video-first UI with live chat and voice support
- Real talking videos (via D-ID or local SadTalker) with lip-sync
- Voice chat (speech recognition + TTS) and captions
- Conversation memory and personalized responses

## Architecture Overview

- Frontend: React + Vite + TypeScript
- Backend (optional local): SadTalker wrapper (Flask) for local GPU-based video rendering
- TTS: Browser SpeechSynthesis or server-side TTS (edge-tts) via `/speak`

## Quick Start (Development)

1. Install dependencies

```bash
npm install
```

2. Run the app

```bash
npm run dev
```

3. Open the SadTalker web test (optional)

```bash
# serve the test static page
npm run sadtalker:serve-static
# open http://localhost:8081/test.html
```

## Environment Variables

Create a `.env` file from `.env.example` and set the keys you need (D-ID, Groq, SadTalker, etc.). See `.env.example` for placeholders.

## Running the local SadTalker server

Follow `docs/SADTALKER.md` — it includes a `server.py` wrapper and examples for `/talk` and `/speak` endpoints.

## Testing

- Node test script: `npm run sadtalker:test-speak -- http://SERVER:5000 "Hello"`
- Web test page: http://localhost:8081/test.html

## Contributing

See `CONTRIBUTING.md` for development guidelines, branch naming conventions, and PR instructions.

## License & Attribution

See `LICENSE` (if provided) and `docs/UPGRADE_CHECKLIST.md` for notes about third-party services and paid features.

## Screenshots

Add screenshots or GIFs of the UI here (use `docs/assets/` for images).

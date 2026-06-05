# Frontend Overview

## Overview

iStream frontend is a vibe-coded React application built with Vite, TypeScript, Tailwind CSS, etc. It is designed to be the user-facing layer for live streaming, chat, payments, and VOD playback, while integrating closely with the backend APIs and streaming pipeline.

The frontend is optimized for developer productivity and rich UI interactions: fast Vite HMR, expressive Tailwind-based layouts, Radix UI primitives, and client-side state management for realtime streaming workflows.

## Technology stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn-ui / Radix UI
- React Router
- HLS.js
- Socket.io client
- Zustand
- Framer Motion
- Axios

## Local setup

From the `frontend` folder:

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on port `8080` by default and proxies requests to the backend through configured app URLs.

## Vite environment variables

This frontend uses Vite env variables to configure runtime values. Create a `.env` or `.env.local` file in the `frontend/` directory and add only variables that start with `VITE_`.

Example variables used in this repo:

```env
VITE_BACKEND_URL=http://localhost:8888/api/
VITE_RAZORPAY_KEY=your_razorpay_api_key_here
```

### How Vite env works

- Vite only exposes variables prefixed with `VITE_` to client code.
- Place them in `frontend/.env` or `frontend/.env.local`.
- Do not store secret server-only values here.
- Rebuild or restart the dev server after changing env values.

so copy the example.env as .env in the frontend/ folder.

## Scripts

From `frontend`:

- `npm run dev` — start the Vite development server
- `npm run build` — build for production
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint

## Notes

- This frontend is intentionally built to be fast and modular, with UI components organized around shadcn/ui patterns.
- Keep env configuration minimal and use the backend for secrets and authentication flows.
- The main application entrypoint is `frontend/src/App.tsx`, and the Vite config is in `frontend/vite.config.ts`.

## Recommended workflow

1. build the repo root services first or start the backend stack with Tilt from the repository root
2. open `frontend` and install dependencies
3. configure `frontend/.env` with `VITE_BACKEND_URL` and `VITE_RAZORPAY_KEY`
4. run `npm run dev`


## visit next

- [getting-started](../docs/getting-started.md)
- [architecture](../docs/architecture.md)


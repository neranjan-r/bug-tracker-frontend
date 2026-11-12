# Bug Tracker — Frontend Client

React + Vite + Tailwind CSS + dnd-kit + Socket.io frontend for the Bug Tracker application.

## Setup
```bash
npm install
cp .env.example .env
npm run dev
```

## Scripts
- `npm run dev` — Start Vite development server
- `npm run build` — Build production bundle into `dist/`
- `npm run preview` — Preview production build locally

## Environment Variables
- `VITE_API_URL` — Backend API base URL (e.g. `http://localhost:5000/api`)

Includes `vercel.json` and `public/_redirects` for SPA deep-link routing on Vercel and Netlify.

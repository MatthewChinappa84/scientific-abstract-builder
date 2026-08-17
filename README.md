# Scientific Abstract Builder — V5

A minimal local-first conference abstract builder based on the supplied conference abstract example.

## Current mode

This version runs in **local demo mode**. It does not call the OpenAI API, so no API credits or billing are required.

The demo takes the supplied scientific information and produces a simple continuous abstract from the source text. This is intentionally temporary while the interface and workflow are being developed.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Later

When the interface is finalized, the `/api/generate` route can be switched back to the OpenAI API for genuine scientific abstract composition.

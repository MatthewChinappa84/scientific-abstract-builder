# Scientific Abstract Builder — V7

A minimal local-first conference abstract formatter based on the supplied conference abstract example.

## Purpose

Students enter their conference details and paste or type their completed abstract. The builder formats the content into the conference template.

It does **not** use AI rewriting and does not require an OpenAI API key or API credits.

## Word limit

The abstract has a **hard maximum of 250 words**. Abstracts over 250 words are rejected rather than automatically truncated.

The interface displays the live word count.

## Formatting

- Abstract text is fully justified.
- The first author's name is bold.
- Other authors remain normal weight.
- Conference-style A4 output is preserved.

## Current mode

This version runs in local demo mode. It does not call the OpenAI API.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

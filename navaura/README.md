# NavAura

NavAura is an AI-powered maternal and infant nutrition companion designed for mothers from postpartum day one through the first two years of a child’s life.

## Overview

The platform helps mothers track their own nutrition alongside their baby’s feeding progression. A mother can photograph a meal, receive structured food identification, and understand what is relevant to her nutrition and what may matter for her baby’s age, feeding stage, texture, and safety context.

## Problem

Postpartum nutrition is deeply personal and highly contextual. Mothers need support that balances their own energy and nutrient intake while also understanding how feeding choices may affect a baby’s developmental stage and safety. Existing generic nutrition apps do not connect the two journeys in one place or provide evidence-based guidance.

## Solution

NavAura unifies:

- mother nutrition and hydration logging
- baby feeding and introduction tracking
- AI-powered meal recognition
- evidence-backed safety guidance
- personalized recommendations grounded in verified data sources and age-aware rules

The product is built as a production-grade Next.js app with a secure server-side AI pipeline and a privacy-first architecture.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL + Auth + Storage
- Groq Vision via the OpenAI-compatible API
- Zod validation
- Framer Motion
- Lucide React

## AI Architecture

User image → client validation → Next.js API → Groq vision model → structured JSON → Zod validation → food normalization → nutrition and safety engine → personalized response.

This design keeps the medical and safety-sensitive logic deterministic and evidence-driven while using the AI layer only for visual recognition.

## ML Architecture

NavAura includes a reproducible evaluation layer for measurable tasks such as food recognition, normalization, and safety classification. The current pipeline is designed to support classical ML benchmarking and structured evaluation rather than fabricating unsupported accuracy claims.

## Dataset Sources

The project includes datasets under the repository Datasets directory, including food and nutrition sources such as FoodData Central and UNICEF/WHO-related contextual data. The ingestion pipeline coordinates dataset inspection, normalization, validation, and import steps without requiring manual spreadsheet work.

## Database Schema

The application is designed around Supabase tables including users, profiles, mothers, babies, meals, meal_items, feeding_logs, hydration_logs, wellness_logs, food_introductions, and AI analysis records. RLS should be enforced so users only access their own health data.

## Security

- server-side secret management
- no public upload buckets
- private meal storage with signed access where needed
- input validation on both client and server
- Groq key stored only in server env
- no raw health data in application logs
- RLS and ownership checks for user-specific tables

## Privacy

NavAura treats maternal and infant nutrition data as sensitive health information. The app minimizes the context sent to external providers and does not log raw images or full health records.

## Model Evaluation

The evaluation pipeline documents actual measured results for tasks such as food recognition, normalization, and safety rule classification. Claims are limited to what is empirically demonstrated in held-out benchmarks.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment Variables

Required variables:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- GROQ_API_KEY
- GROQ_VISION_MODEL
- NEXT_PUBLIC_SITE_URL

## Local Development

- run the app with `npm run dev`
- lint with `npm run lint`
- build with `npm run build`
- test with `npm test`

## Dataset Ingestion

The repository includes scripts under `scripts/data` for inspection, normalization, validation, and import.

## Supabase Setup

1. create a Supabase project
2. enable Auth
3. configure storage bucket `meal-images` as private
4. create required tables and RLS policies
5. add redirect URLs for local and production environments

## Groq Setup

1. create a Groq API key
2. set `GROQ_API_KEY`
3. configure `GROQ_VISION_MODEL` if needed
4. verify the model supports visual input

## Vercel Deployment

1. import the GitHub repository into Vercel
2. add environment variables
3. deploy the app
4. configure production site URL in Supabase and Vercel
5. verify authentication, storage, and scanner routes after deployment

## Limitations

- AI-based food recognition remains probabilistic and must be validated with user correction.
- Not every food in the dataset is normalized in a production ingestion pass yet.
- Safety-sensitive guidance must continue to rely on deterministic rules and evidence-backed references rather than model output alone.

## Future Improvements

- richer nutrition database normalization
- real baby and maternal profile flows in Supabase
- full feeding, hydration, and wellness analytics
- more comprehensive evaluation benchmark datasets
- production migration and seed scripts

# VeritasAI — Fake News Detection System

An AI-powered web application that analyzes news articles and images to classify them as real, fake, or uncertain, with confidence scores and detailed explanations.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/fakenews-detector run dev` — run the frontend (port 25171)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `OPENAI_API_KEY` — OpenAI API key for AI detection
- Required env: `SESSION_SECRET` — Express session secret for admin auth

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + React Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI gpt-4o-mini (text + vision for image analysis)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- File uploads: multer (memory storage)
- Auth: express-session (admin panel)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions (`articles.ts`, `admins.ts`)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/detect.ts` — OpenAI detection logic (text + vision)
- `artifacts/fakenews-detector/src/pages/` — React pages (Home, Result, History, Admin)
- `artifacts/fakenews-detector/src/components/` — Shared UI components

## Architecture decisions

- Contract-first: OpenAPI spec → codegen → typed React Query hooks + Zod schemas
- Lazy OpenAI client initialization (created per-request, not at module load) so server starts even if OPENAI_API_KEY is missing
- Image uploads processed in memory via multer (no disk storage needed for base64 → OpenAI Vision)
- Admin auth uses express-session with SHA-256 password hashing (salted)
- Image detection uses two OpenAI calls: first to extract text via vision, second to classify as fake/real

## Product

- **Home**: Submit news article by text or image screenshot for AI analysis
- **Results**: Detailed verdict page with confidence bar, explanation, and key indicators
- **History**: Browse all past detections, filter by verdict (real/fake/uncertain)
- **Admin Dashboard**: Secured login (`admin` / `admin123`), stats, daily chart, override verdicts, delete articles

## User preferences

- Tamil/English mix user — respond in both when needed
- Wants deploy-ready code for GitHub/Vercel
- Real database required (no mocks)
- Image upload for fake news detection is a key requirement

## Gotchas

- OPENAI_API_KEY must be set in Secrets panel — server starts without it but detection returns error
- Admin password is SHA-256 hashed with salt `fakenews_salt_2024` — change in production
- Image route (`POST /api/articles/image`) uses multer middleware — NOT in OpenAPI spec (raw route)
- The `/articles/image` route must be registered BEFORE `/articles/:id` in Express to avoid param conflict

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

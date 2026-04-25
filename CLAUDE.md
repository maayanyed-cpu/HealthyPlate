HealthyPlate
AI nutrition companion for families with kids ages 1–10. Snap a meal → vision model identifies foods + portions → a per-child taste graph learns what they accept → app suggests recipes, mini-games, and a personalized supplement pack.

Source-of-truth references

public/prototype.html — the design system and full screen flow (welcome, onboarding, home, snap, plan, insights, friends). When you build a screen, read this file first to match the visual language exactly. Also accessible at /prototype.html in the live app.
Healthy_Plate_Investor_Deck.pptx — product context, market positioning, business model. Read for "why" questions, not for layout.

Stack

Web app: Next.js 14 (App Router), TypeScript, Tailwind CSS — at the repo root (not in web/, so Vercel auto-detects)
Database: Postgres on Vercel (Neon under the hood). Prisma 6 ORM. Schema in prisma/schema.prisma; client in lib/db.ts; getCurrentChild helper in lib/getCurrentChild.ts. Singleton "default-user" until Clerk auth lands.
AI: Anthropic API via @anthropic-ai/sdk for the food-detection vision call (stubbed in v0)
Auth: Clerk (deferred until after core screens work)
Mobile: Expo / React Native — later phase, after web is solid
Package manager: pnpm

Design system
Pull all tokens from the prototype's :root CSS variables. Do not invent new colors.

Primary palette: --sage-deep (#4A6B5F), --sage (#5A8073), --cream (#F5F1E8), --cream-soft (#FAF7F0)
Accents: --carrot (#D88463), --tomato (#C95C4D), --gold (#E5B96A), --berry (#8B5A6B)
Typography: Fraunces (serif, headers) + Inter (sans, body) via next/font/google
Radii: --radius-sm 12, --radius 20, --radius-lg 28, --radius-xl 36

The aesthetic is "premium parent-focused": warm, calm, lots of whitespace, soft shadows. Not bright/cartoonish, even though kids are the end-beneficiary — the parent is the buyer.

Folder structure (current)
HealthyPlate/
├── CLAUDE.md
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs
├── app/
│   ├── layout.tsx               # root: fonts + globals
│   ├── globals.css              # design tokens (CSS vars) + .app-frame
│   ├── page.tsx                 # welcome
│   ├── onboarding/
│   │   └── page.tsx             # step 1 only (name, age, gender)
│   ├── (app)/                   # frame + bottom nav
│   │   ├── layout.tsx
│   │   ├── home/page.tsx
│   │   ├── plan/page.tsx        # stub (Coming soon)
│   │   ├── insights/page.tsx    # stub
│   │   └── friends/page.tsx     # stub
│   └── snap/                    # frame, no bottom nav (full-screen flow)
│       ├── layout.tsx
│       ├── page.tsx             # viewfinder + reveal animation
│       ├── confirm/page.tsx     # detected foods (after before-shot)
│       └── analysis/page.tsx    # balance + nutrients + % consumed
├── components/
│   ├── BottomNav.tsx
│   ├── PlateSvg.tsx             # before/after plate art
│   └── ComingSoon.tsx
├── lib/
│   ├── db.ts                    # Prisma client singleton + ensureDefaultUser
│   ├── getCurrentChild.ts       # server helper: latest child for default user
│   └── mockData.ts              # 10 foods + hardcoded snap result + plan
├── prisma/
│   ├── schema.prisma            # User, Child
│   └── migrations/              # SQL migration history (committed)
└── public/
    └── prototype.html           # the design source-of-truth, also live at /prototype.html

Data model (in-memory shapes in lib/mockData.ts)

Child: id, name, age, gender
Meal: id, childId, mealType, loggedAt, status (pending|complete)
Meal: id, childId, mealType (breakfast|lunch|dinner|snack), loggedAt, status (pending|complete)
DetectedFood: id, mealId, foodKey, name, emoji, portionGrams, confidence, phase (before|after), percentEaten
TasteGraphEntry: (deferred — no taste-test screen in v0)
SupplementRecommendation: (deferred)

Conventions

One screen at a time. Build it, match the prototype, commit, then move on.
Mock data lives in lib/mockData.ts with typed exports — never hard-code data inside JSX.
Use Server Components by default; opt into "use client" only when needed (forms, animations, camera).
Tailwind utilities only. No CSS-in-JS, no styled-components.
Keep components tiny and prop-driven. If a component is only used once, inline it.

Working style

I am non-technical. Be explicit about commands to run and what success looks like.
Pause and confirm before destructive operations (deleting files, dropping migrations, force-pushing).
After any structural change, update this CLAUDE.md to reflect the new state.
For visual work, compare the rendered output to public/prototype.html and report differences before declaring done.

Common commands
```
# Dev server (from repo root)
pnpm dev

# Type-check + lint
pnpm typecheck && pnpm lint

# Build (what Vercel runs — also generates Prisma client)
pnpm build

# Prisma — pull live env vars first, then run
vercel env pull .env.local
set -a && source .env.local && set +a && pnpm prisma migrate dev --name <change_name>
pnpm prisma studio   # GUI for browsing DB rows
```

Status

[x] Prototype HTML complete (now at public/prototype.html)
[x] Project folder structured at /Users/maayanyedidia/HealthyPlate/
[x] Next.js scaffold at root
[x] Design system extracted to Tailwind
[x] Welcome + onboarding (step 1) ported
[x] App shell + bottom nav
[x] Home screen
[x] Snap flow (mock plate, no real camera) → confirm → analysis
[x] Plan / Insights / Friends stubs (Coming soon)
[ ] Real camera (file upload or getUserMedia)
[ ] Vision API integration (Anthropic SDK)
[ ] Full 4-step onboarding (allergies, habits, height/weight)
[ ] Taste test (~300 foods)
[x] Persistent DB (Postgres on Vercel/Neon, Prisma 6) — User, Child, Meal, DetectedFood tables
[x] Snap loop persists Meals + DetectedFood (foods still stubbed pending vision API)
[x] Home meal counters from real DB queries; pending-meal callout gated on actual pending Meal
[ ] Auth + multi-child (Clerk)
[x] Deploy to Vercel (auto on push to main)

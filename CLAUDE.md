HealthyPlate
AI nutrition companion for families with kids ages 1–10. Snap a meal → vision model identifies foods + portions → a per-child taste graph learns what they accept → app suggests recipes, mini-games, and a personalized supplement pack.
Source-of-truth references

prototypes/healthy-plate-prototype.html — the design system and full screen flow (welcome, onboarding, home, snap, plan, insights, friends). When you build a screen, read this file first to match the visual language exactly.
Healthy_Plate_Investor_Deck.pptx — product context, market positioning, business model. Read for "why" questions, not for layout.

Stack

Web app: Next.js 14 (App Router), TypeScript, Tailwind CSS — lives in web/
Database: Prisma + SQLite for local dev, Postgres (Neon) for production
AI: Anthropic API via @anthropic-ai/sdk for the food-detection vision call
Auth: Clerk (deferred until after core screens work)
Mobile: Expo / React Native — later phase, after web is solid
Package manager: pnpm (fall back to npm if pnpm isn't installed)

Design system
Pull all tokens from the prototype's :root CSS variables. Do not invent new colors.

Primary palette: --sage-deep (#4A6B5F), --sage (#5A8073), --cream (#F5F1E8), --cream-soft (#FAF7F0)
Accents: --carrot (#D88463), --tomato (#C95C4D), --gold (#E5B96A), --berry (#8B5A6B)
Typography: Fraunces (serif, headers) + Inter (sans, body) via next/font/google
Radii: --radius-sm 12, --radius 20, --radius-lg 28, --radius-xl 36

The aesthetic is "premium parent-focused": warm, calm, lots of whitespace, soft shadows. Not bright/cartoonish, even though kids are the end-beneficiary — the parent is the buyer.
Folder structure (target)
HealthyPlate/
├── CLAUDE.md
├── Healthy_Plate_Investor_Deck.pptx
├── prototypes/
│   └── healthy-plate-prototype.html
└── web/
    ├── app/
    │   ├── page.tsx              # welcome
    │   ├── onboarding/
    │   └── (app)/                # app shell with bottom nav
    │       ├── home/
    │       ├── plan/
    │       ├── snap/
    │       ├── insights/
    │       └── friends/
    ├── components/
    │   └── ui/                   # Button, Card, Pill, TopBar, etc.
    ├── lib/
    │   ├── db.ts                 # Prisma client
    │   └── mockData.ts           # typed seed data
    └── prisma/
        └── schema.prisma
Data model (planned)

Child: id, name, age, createdAt
Meal: id, childId, photoUrl, loggedAt
DetectedFood: id, mealId, name, portionGrams, confidence
TasteGraphEntry: childId, foodName, acceptanceProbability, sampleCount
SupplementRecommendation: childId, items, monthlyPriceCents

Conventions

One screen at a time. Build it, match the prototype, commit, then move on.
Mock data lives in web/lib/mockData.ts with typed exports — never hard-code data inside JSX.
Use Server Components by default; opt into "use client" only when needed (forms, animations, camera).
Tailwind utilities only. No CSS-in-JS, no styled-components.
Keep components tiny and prop-driven. If a component is only used once, inline it.

Working style

I am non-technical. Be explicit about commands to run and what success looks like.
Pause and confirm before destructive operations (deleting files, dropping migrations, force-pushing).
After any structural change, update this CLAUDE.md to reflect the new state.
For visual work, compare the rendered output to prototypes/healthy-plate-prototype.html and report differences before declaring done.

Common commands
bash# Dev server (from web/)
pnpm dev

# Type-check + lint
pnpm typecheck && pnpm lint

# Prisma
pnpm prisma migrate dev
pnpm prisma studio

# Build
pnpm build
Status

 Prototype HTML complete
 Project folder structured at /Users/maayanyedidia/HealthyPlate/
 Next.js scaffold in web/
 Design system extracted to Tailwind
 Welcome + onboarding ported
 App shell + bottom nav
 Home, Plan, Insights, Friends screens
 Snap flow with real camera
 Vision API integration
 Auth + multi-child
 Deploy to Vercel
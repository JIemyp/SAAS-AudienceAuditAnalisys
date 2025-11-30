# Audience Research Tool

AI-powered tool for comprehensive target audience research. Generate detailed analysis including segments, pain points, and deep triggers.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript
- **Backend/DB:** Supabase (Auth, PostgreSQL, Storage)
- **Styling:** Tailwind CSS v4
- **UI Components:** Custom components with Radix-like patterns
- **Forms:** React Hook Form + Zod
- **Animations:** Framer Motion
- **Export:** XLSX (SheetJS)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

### ✅ Implemented

- **Authentication:** Google OAuth via Supabase
- **Onboarding Wizard:** 5-step guided form with validation
- **File Upload:** Drag & drop with TTL warnings
- **AI Processing:** Animated progress screen
- **Results Pages:**
  - Overview (audience portrait)
  - Segments list (grid of 10 segments)
  - Segment detail (with pains accordion)
  - Export to Excel

### 🚧 Planned

- **Backend Integration:** Connect to Claude API for real AI generation
- **Creatives Module:** Generate creative hypotheses
- **Tests Module:** Track creative tests and results
- **API Integrations:** Meta Ads, Google Ads

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth routes (login)
│   ├── (dashboard)/       # Protected routes
│   │   └── projects/      # Project pages
├── components/
│   ├── ui/                # Atomic components
│   ├── wizard/            # Wizard components
│   ├── layout/            # Layout components
│   └── navigation/        # Navigation components
├── lib/                   # Utilities and configs
├── types/                 # TypeScript types
└── hooks/                 # Custom hooks
```

## Database Schema

See the technical specification for full Supabase schema details. Key tables:

- `projects` - Project metadata
- `audience_overviews` - General audience analysis
- `segments` - Audience segments
- `pains` - Pain points per segment
- `project_files` - Uploaded documents (with TTL)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Notes

- Supabase credentials are required for authentication and data persistence
- File uploads are currently UI-only (backend integration pending)
- AI generation is mocked with animated progress (Claude API integration pending)

# BriefCraft

Creative brief & script management app for ad teams. Built with Next.js 14, Prisma, SQLite, and Tailwind CSS.

## Features

1. **Client Switching Sidebar** - Toggle between clients/brands, favorite/star, active + archived projects
2. **Project Grid** - Cards with thumbnails, tags, type filtering (UGC, Static, Concept Test, Hook Test)
3. **Multi-Column Scripting View** - 3-column editor (Visual, Script, Notes) with inline editing
4. **Drag & Drop Sections** - Rearrange script sections and rows with drag handles
5. **Embedded Video + Timestamps** - Video preview with timestamp annotations
6. **Image Grid / Asset Picker** - Drop image references with tagging (moodboard, thumbnail, etc.)
7. **Threaded Comments** - Right-side panel with @mentions, resolve/unresolve, pinned comments
8. **Script Template Library** - Save and reuse winning script structures
9. **AI Headlines & Hooks Generator** - Template-based suggestions for headlines, hooks, offers, CTAs
10. **Version Control** - Duplicate and iterate (V1, V2, V3), view version history
11. **Export Options** - HTML, CSV, plain text formats
12. **Granular Sharing** - View/edit/comment access, password protection, client view mode
13. **A/B Test Tracking** - Track scripts tested, ROAS/CTR/CVR metrics, link to campaign results
14. **Live Script Review Mode** - Present mode for live reviews with session timer

## Quick Start

```bash
# Install dependencies
npm install

# Set up the database
npx prisma migrate deploy

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app will auto-seed sample data on first load.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite via Prisma ORM (file-based, no external DB needed)
- **Styling**: Tailwind CSS
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React

## Project Structure

```
src/
  app/
    api/          # 29 API routes
    page.tsx      # Main app page
    layout.tsx    # Root layout
  components/     # 15 UI components
  lib/
    db.ts         # Prisma client
prisma/
  schema.prisma   # Database schema
  dev.db          # SQLite database (auto-created)
```

## Environment

The only env var needed is `DATABASE_URL` which defaults to `file:./dev.db` in the `.env` file.

To use the AI generator with a real API, set `ANTHROPIC_API_KEY` in `.env`.

# MY AN!ME - Features

## Implemented Features

### Phase 1: Core Architecture & Search
- [x] Core architecture and project setup (React + Vite)
- [x] Tailwind CSS v4 configuration for Dark Premium Theme
- [x] Dexie.js local database initialization (Metadata & Personal Data schemas)
- [x] Jikan/MAL API integration with 400ms rate limiting
- [x] Global search functionality with local caching and 600ms debounce
- [x] Search result merging/deduplication using MAL ID
- [x] Anime details page (MAL info, ratings, synopsis, episodes, etc.)

## Features Currently Planned

### Phase 2: Personal Collection
- [x] Personal collection dashboard (My Anime)
- [x] Tracking statuses: Plan to Watch, Watching, Completed, On Hold, Dropped
- [x] Episode progress tracking (capped at total episodes)
- [x] Catch-up logic (distinguish finished anime vs caught up)
- [x] Personal 1-10 rating scale (isolated from MAL)
- [x] Home page (Currently Watching, Recently Updated, Plan to Watch, Completed)
- [x] Backup / Restore (Export/Import JSON)

### Phase 3: Season Tracking & Next Steps
- [x] Granular season tracking (Season 1, Season 2, etc.)
- [x] Continue Watching section with progress bars
- [x] Non-destructive new-season handling

### Phase 4: Watch History & Stats
- [x] Manual watch history entry (Date + Episodes watched)
- [x] Watch history bar graph (7 days, 30 days, all time)
- [x] Personal statistics calculation

### Phase 5: Advanced Filters & Discovery
- [x] Adjustable maximum episode filter
- [x] Minimum MAL Rating filter
- [x] Minimum My Rating filter
- [x] Progress / Completion percentage filter
- [x] Genre filter
- [x] Surprise Me functionality (Enhanced with multi-filtering)
- [~] IMDb episode-quality X/Y filters (CANCELLED - No feasible official API/Mappings without dedicated backend)

### Phase 6: Polish & V1 Release
- [x] UI Polish & Animations (Mature, minimal aesthetics)
- [x] Strict Accessibility & UX checks
- [x] Responsive design verifications (mobile overflow prevention)
- [x] V1 Smoke testing (Data isolation & backups fully verified)

### Phase 7: Multi-Source Data Architecture & Reliability
- [x] Vercel Serverless API Proxy for Jikan (Solves CORS/IP-blocking failures)
- [x] Native Anime Episodes list in details page
- [x] Anime Filler List Architecture (`Canon`, `Filler`, `Mixed`, `Anime Canon`, `Unknown`)
- [x] IMDb Architecture (Dormant modular interface for when/if official data is accessible)
- [x] Strict prohibition of illicit scraping/fake data generation

## Features Intentionally Postponed
- Rewatch tracking (Keep architecture flexible for this)
- Multiple simultaneous statuses (e.g., Dropped but keeping episode history)
- Advanced Personal Tags
- IMDb episode-level X/Y filtering (NO-GO due to architectural client-side mapping limitations)
- Displaying Anime Filler Data natively (Waiting for a public/legitimate API)
- Daily check-ins / daily streak systems
- Combining MAL, IMDb, and personal ratings into a single score
- Displaying the entire MAL catalog on the Home page

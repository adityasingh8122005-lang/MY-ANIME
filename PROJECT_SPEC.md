# MY AN!ME - Project Specification

## Architecture
MY AN!ME is a single-page application built with React, Vite, and Tailwind CSS v4.
It acts as a private, personal anime tracking dashboard.

**Key Architecture Principles:**
1. **Separation of Concerns:** External MAL metadata and personal tracking data are strictly separated.
2. **Local First:** IndexedDB (via Dexie.js) is the primary data store. The external API is only used to populate the local metadata cache or search for new items. Local search results yield immediately before network requests.
3. **Modular Design:** Components, services (DB, API), and pages are kept in distinct directories.
4. **API Discipline:** All Jikan requests strictly enforce a 400ms rate limit to prevent rate-limit bans (official limit is 3 requests per second). Search input is separately debounced (600ms).
5. **Deduplication:** Fetched results are always merged against local data uniquely using `malId`.

## Data Model

### Metadata (Cached from MAL/Jikan)
`animeMetadata`
- `malId` (Primary Key)
- `title`, `alternativeTitles`, `japaneseTitle`
- `episodes`, `seasons`, `genres`, `themes`
- `status`, `score`, `imdbRating` (if available)
- `synopsis`, `poster`, `malUrl`, `imdbUrl`, `year`, `season`

### Personal Data (User Controlled)
`userAnime`
- `malId` (Primary Key, relates to `animeMetadata`)
- `personalStatus` (Plan to Watch, Watching, Completed, On Hold, Dropped)
- `watched` (boolean)
- `episodesWatched` (integer)
- `currentSeason`, `currentEpisode`
- `seasonsWatched` (array or structured object)
- `personalRating` (1-10)
- `addedAt`, `updatedAt`

`watchHistory`
- `id` (Auto-increment PK)
- `malId`
- `date` (YYYY-MM-DD)
- `episodesWatched`

## APIs
- **Jikan API (Unofficial MyAnimeList API):** Used for retrieving anime catalog data, search, and details. Requests are paced globally at maximum ~2.5 requests per second.
- **IMDb Data:** If integrated later, requires a separate OMDB or similar API lookup. Handled as external metadata. (Not implemented in Phase 1)

## Storage
- **IndexedDB (Dexie.js):**
  - Extremely fast local read/writes.
  - Data survives page refreshes and browser restarts.
  - Enables offline access to the personal dashboard.
  - **Backup/Restore:** Integrated JSON export/import for personal tracking data, avoiding the need to serialize the entire MAL catalog.

## Important Design Decisions
1. **No Backend:** This is a strictly client-side application. The user's device is the database.
2. **Non-destructive Updates:** When MAL updates an anime (e.g., adds a new season), `animeMetadata` is refreshed. `userAnime` retains previous watch counts and progress so the user doesn't lose historical state.
3. **Manual History Entry:** No automated background tracking or daily check-ins. Watch history represents intentional manual logging.
4. **No Rewatch Tracking (Yet):** The schema must remain flexible to support this in the future (e.g. tracking `rewatchCount` or storing watch history intelligently).
5. **No Faked Data:** Missing API data (like IMDb ratings or unknown episodes) is treated as null. Dummy data is never fabricated.

## Phase 4A / Phase 5: External Data & Reliable Native Filters
- **IMDb Integration**: IMDb does not provide a legitimate, free public JSON API. Scraping is prohibited and unmaintainable. IMDb integration is built structurally (`imdbApi.js`) but remains modularly dormant. Overall IMDb scores will display when/if officially supported, but episode-level X/Y filtering remains a **NO-GO**.
- **Anime Filler List**: Similar to IMDb, there is no public JSON API. We have built the data architecture (`fillerApi.js`) to support `Canon`, `Filler`, `Mixed Canon/Filler`, `Anime Canon`, and `Unknown`. Currently, all episodes safely default to `Unknown` to prevent data fabrication. A full episode list is now fetched natively from Jikan and rendered with filter support.
- **Vercel API Proxy**: To prevent CORS issues and IP rate-limiting from Vercel's edge network, client-side Jikan requests in production are proxied through a serverless function (`/api/jikan.js`). This caches Jikan responses at the edge (5 mins) to drastically reduce rate limits, while preserving local storage cache. Local development continues to ping Jikan directly to prevent requiring backend setups.

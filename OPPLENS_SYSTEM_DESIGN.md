# OppLens — Complete System Design Document

> **Project:** OppLens (formerly DevEventSync)
> **Architecture:** Monorepo — Next.js 16 SSR Frontend + Python/FastAPI ML Microservice
> **Database:** MongoDB Atlas (shared between both services)
> **Deployment:** Vercel (Frontend) + Render (Microservice)

---

## 1. High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser["🌐 Browser"]
    end

    subgraph "Frontend — Vercel"
        NextJS["Next.js 16.1.1<br/>App Router + SSR"]
        Auth["NextAuth v5<br/>GitHub / Google / Credentials"]
        SA["Server Actions<br/>event, user, booking, opportunity"]
        API["API Routes<br/>/api/events, /api/auth/*"]
    end

    subgraph "ML Microservice — Render (Docker)"
        FastAPI["FastAPI 0.115<br/>Uvicorn ASGI"]
        TFIDF["TF-IDF Engine<br/>scikit-learn"]
        VecSearch["Vector Search<br/>SentenceTransformers"]
        Scrapers["Scraping Pipeline<br/>5 Scrapers"]
        Scheduler["APScheduler<br/>6-hour cron"]
    end

    subgraph "Data Layer — MongoDB Atlas"
        Users["users"]
        Events["events"]
        Bookings["bookings"]
        Opps["opportunities"]
        DedupLog["dedup_log"]
        ScrapeRuns["scrape_runs"]
    end

    subgraph "External Services"
        Cloudinary["☁️ Cloudinary<br/>Image CDN"]
        GH["GitHub OAuth"]
        GO["Google OAuth"]
        MLH["mlh.io"]
        Devfolio["devfolio.co"]
        Unstop["unstop.com"]
        HE["hackerearth.com"]
        HR["hackerrank.com"]
    end

    Browser -->|"HTTPS"| NextJS
    NextJS --> Auth
    NextJS --> SA
    NextJS --> API
    Auth -->|OAuth| GH
    Auth -->|OAuth| GO
    SA -->|"Mongoose"| Users
    SA -->|"Mongoose"| Events
    SA -->|"Mongoose"| Bookings
    SA -->|"Mongoose"| Opps
    SA -->|"POST /recommend"| FastAPI
    SA -->|"POST /recommend/opportunities"| FastAPI
    SA -->|"Upload"| Cloudinary
    FastAPI --> TFIDF
    FastAPI --> VecSearch
    FastAPI --> Scheduler
    Scheduler --> Scrapers
    Scrapers -->|"HTTP/Playwright"| MLH
    Scrapers -->|"HTTP/Playwright"| Devfolio
    Scrapers -->|"HTTP/Playwright"| Unstop
    Scrapers -->|"HTTP"| HE
    Scrapers -->|"HTTP"| HR
    VecSearch -->|"Motor (async)"| Opps
    Scrapers -->|"Motor"| Opps
    Scrapers -->|"Motor"| DedupLog
    Scrapers -->|"Motor"| ScrapeRuns
```

---

## 2. Tech Stack

### Frontend (Next.js)

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js (App Router) | 16.1.1 | SSR, Server Actions, ISR |
| UI | React | 19.2.3 | Component Library |
| Auth | NextAuth.js v5 | 5.0.0-beta.30 | GitHub, Google, Credentials |
| ORM | Mongoose | 9.0.2 | MongoDB ODM |
| Styling | TailwindCSS | 4.x | Utility-first CSS |
| Animation | Framer Motion | 12.23.26 | Page transitions, micro-interactions |
| Icons | Lucide React | 0.562.0 | Icon library |
| Images | Cloudinary SDK | 2.8.0 | Upload + CDN |
| Analytics | PostHog | 1.310.1 | Product analytics |
| OG Images | @vercel/og | 0.8.6 | Dynamic social preview images |
| WebGL | OGL | 1.0.11 | Background effects |
| Password | bcryptjs | 3.0.3 | Credential hashing (cost 10) |
| Language | TypeScript | 5.x | Type safety |

### ML Microservice (Python)

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | FastAPI | 0.115.0 | Async REST API |
| Server | Uvicorn | 0.30.0 | ASGI production server |
| ML (Content) | scikit-learn | 1.5.2 | TF-IDF + Cosine Similarity |
| ML (Semantic) | sentence-transformers | 3.3.0 | all-MiniLM-L6-v2 (384-dim embeddings) |
| Math | NumPy | 1.26.4 | Vector operations |
| DB Driver | Motor | 3.6.0 | Async MongoDB driver |
| Validation | Pydantic | 2.9.0 | Request/response models |
| HTTP Client | httpx | 0.28.0 | Async scraping requests |
| HTML Parser | BeautifulSoup4 | 4.12.3 | DOM-based scraping |
| Browser | Playwright | 1.42.0 | JS-rendered page scraping |
| Anti-ban | fake-useragent | 2.0.3 | User-Agent rotation |
| Scheduler | APScheduler | 3.10.4 | 6-hour recurring cron |
| Container | Docker | Playwright base image | `mcr.microsoft.com/playwright/python:v1.42.0-jammy` |

---

## 3. MongoDB Collections (6 Total)

All collections live in a single database named **`opphub`**.

### 3.1 `users` — User Profiles & ML Preferences

> **Accessed by:** Next.js (Mongoose) | **Owner:** Frontend

| Field | Type | Required | Unique | Default | Notes |
|-------|------|----------|--------|---------|-------|
| `_id` | ObjectId | auto | ✅ | auto | — |
| `email` | String | ✅ | ✅ | — | Primary identifier |
| `name` | String | ✅ | — | — | — |
| `image` | String | — | — | — | Profile avatar URL |
| `interests` | [String] | — | — | `[]` | e.g. `["AI", "Web Dev"]` |
| `bio` | String | — | — | — | Free-text bio |
| `location` | String | — | — | — | — |
| `portfolio` | String | — | — | — | URL |
| `github` | String | — | — | — | URL |
| `institution` | String | — | — | — | — |
| `preferredCategories` | [String] | — | — | `[]` | ML input |
| `preferredMode` | String | — | — | `'any'` | `online/offline/hybrid/any` |
| `skillLevel` | String | — | — | `'intermediate'` | `beginner/intermediate/advanced` |
| `lastOpportunityVisit` | Date | — | — | `null` | For "New" badge count |
| `createdAt` / `updatedAt` | Date | auto | — | auto | Mongoose timestamps |

---

### 3.2 `events` — User-Created Community Events

> **Accessed by:** Next.js (Mongoose) | **Owner:** Frontend

| Field | Type | Required | Unique | Default | Notes |
|-------|------|----------|--------|---------|-------|
| `_id` | ObjectId | auto | ✅ | auto | — |
| `title` | String | ✅ | — | — | max 100 chars |
| `slug` | String | — | ✅ | — | Auto-generated from title via pre-save hook |
| `description` | String | ✅ | — | — | max 1000 chars |
| `overview` | String | ✅ | — | — | max 500 chars |
| `image` | String | ✅ | — | — | Cloudinary URL |
| `venue` | String | ✅ | — | — | — |
| `location` | String | ✅ | — | — | — |
| `date` | String | ✅ | — | — | Normalized to `YYYY-MM-DD` |
| `time` | String | ✅ | — | — | Normalized to `HH:MM` (24h) |
| `mode` | String | ✅ | — | — | `online/offline/hybrid` |
| `audience` | String | ✅ | — | — | — |
| `agenda` | [String] | ✅ | — | — | min 1 item |
| `organizer` | String | ✅ | — | — | User's email |
| `tags` | [String] | ✅ | — | — | min 1 item |
| `capacity` | Number | — | — | `50` | min: 1 |
| `seatsTaken` | Number | — | — | `0` | Atomically incremented |
| `category` | String | — | — | `'general'` | 11 enum values |
| `difficulty` | String | — | — | `'intermediate'` | `beginner/intermediate/advanced` |
| `viewCount` | Number | — | — | `0` | — |

**Indexes:** `{ date: 1, mode: 1 }` compound, `slug` unique

---

### 3.3 `bookings` — Event Registrations

> **Accessed by:** Next.js (Mongoose) | **Owner:** Frontend

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | — |
| `eventId` | ObjectId (ref: `Event`) | ✅ | Validated on save |
| `email` | String | ✅ | RFC 5322 regex validated, lowercase |
| `createdAt` / `updatedAt` | Date | auto | Mongoose timestamps |

**Indexes:**
- `{ eventId: 1 }` — fast event lookups
- `{ email: 1 }` — fast user lookups
- `{ eventId: 1, email: 1 }` — **unique compound** (prevents double-booking)
- `{ eventId: 1, createdAt: -1 }` — chronological event bookings

---

### 3.4 `opportunities` — Scraped External Hackathons ⭐ (Bridge Collection)

> **Accessed by:** Next.js (Mongoose) **AND** Python (Motor) | **Owner:** Microservice writes, Frontend reads

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `_id` | ObjectId | auto | — |
| `title` | String | ✅ | — |
| `description` | String | ✅ | — |
| `organizer` | String | ✅ | — |
| `source_platform` | String | ✅ | `mlh/hackerearth/unstop/devfolio/hackerrank` |
| `source_url` | String | ✅ | **Unique index** |
| `alternate_sources` | [{platform, url}] | — | Populated by dedup merge |
| `category` | String | — | Default: `'hackathon'` |
| `tags` | [String] | — | Default: `[]` |
| `deadline` / `start_date` / `end_date` | Date | — | — |
| `location` | String | — | — |
| `is_remote` | Boolean | — | Default: `false` |
| `prize_info` / `eligibility` | String | — | — |
| `image_url` | String | — | Scraped or null (gradient fallback) |
| `embedding` | [Number] | — | 384-dim vector (all-MiniLM-L6-v2) |
| `popularity_score` | Number | — | Default: `0` |
| `is_canonical` | Boolean | — | Default: `true` |
| `canonical_id` | ObjectId (self-ref) | — | Points to canonical if merged |
| `viewCount` | Number | — | Default: `0` |
| `scraped_at` | Date | — | Default: `Date.now` |

**Atlas Index:** `vector_index` (HNSW) on `embedding` field

---

### 3.5 `dedup_log` — Deduplication Audit Trail (Python only)

| Field | Type | Notes |
|-------|------|-------|
| `timestamp` | datetime | Auto-set |
| `new_opp_title` | str | — |
| `new_opp_source` | str | — |
| `new_opp_url` | str | — |
| `decision` | str | `"merged"` or `"new_canonical"` |
| `canonical_id` / `canonical_title` | str \| null | If merged |
| `similarity_score` | float \| null | Cosine similarity |
| `merge_details` | str | Human-readable |

### 3.6 `scrape_runs` — Pipeline Telemetry (Python only)

| Field | Type | Notes |
|-------|------|-------|
| `timestamp` | datetime | — |
| `total_scraped` | int | Items scraped |
| `new_inserted` | int | New canonicals |
| `merged` | int | Merged duplicates |
| `duration_seconds` | float | Pipeline runtime |
| `status` | str | `"success"` or `"failed"` |

---

## 4. Collection Ownership Matrix

| Collection | Next.js Reads | Next.js Writes | Python Reads | Python Writes |
|------------|:---:|:---:|:---:|:---:|
| `users` | ✅ | ✅ | ❌ | ❌ |
| `events` | ✅ | ✅ | ❌ | ❌ |
| `bookings` | ✅ | ✅ | ❌ | ❌ |
| `opportunities` | ✅ | ❌ | ✅ | ✅ |
| `dedup_log` | ❌ | ❌ | ❌ | ✅ |
| `scrape_runs` | ❌ | ❌ | ✅ | ✅ |

---

## 5. Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant N as Next.js
    participant A as NextAuth v5
    participant G as GitHub/Google
    participant DB as MongoDB (users)

    U->>B: Click "Sign in with GitHub"
    B->>N: GET /api/auth/signin
    N->>A: Invoke provider
    A->>G: OAuth redirect
    G->>A: Return access_token + profile
    A->>DB: findOne({ email })
    alt User exists
        A->>A: Issue JWT with user.role
    else New user
        A->>DB: Create user doc (name, email, image)
        A->>A: Issue JWT with role="user"
    end
    A->>B: Set session cookie (JWT)
    B->>U: Redirect to "/"
```

**3 Providers:** GitHub OAuth, Google OAuth, Email+Password (bcryptjs)
**Session Strategy:** JWT (stateless, no DB sessions)
**Custom Pages:** `/login` (sign-in), `/register` (credentials only)

---

## 6. Core Data Flows

### 6.1 Event CRUD + Booking Flow

```mermaid
sequenceDiagram
    participant U as User
    participant N as Next.js SSR
    participant C as Cloudinary
    participant DB as MongoDB

    Note over U,DB: CREATE EVENT
    U->>N: Submit event form (FormData + image)
    N->>C: Upload image (base64)
    C-->>N: Return CDN URL
    N->>DB: Event.create({ ...fields, image: cdnUrl })
    DB-->>N: Created event doc
    N-->>U: Redirect to "/"

    Note over U,DB: BOOK EVENT (Atomic)
    U->>N: Click "Book" → createBooking(eventId)
    N->>DB: Event.findOneAndUpdate(<br/>{ _id, $expr: { $lt: ["$seatsTaken", "$capacity"] } },<br/>{ $inc: { seatsTaken: 1 } })
    alt Seats available
        DB-->>N: Updated event
        N->>DB: Booking.create({ eventId, email })
        N-->>U: ✅ "Booked!"
    else Full or duplicate
        DB-->>N: null / DuplicateKeyError
        N-->>U: ❌ "Sold out" / "Already booked"
    end
```

> [!IMPORTANT]
> The booking uses **MongoDB atomic operators** (`$expr` + `$inc`) in a single `findOneAndUpdate` call. This prevents race conditions where two users book the last seat simultaneously — only one will succeed.

---

### 6.2 ML Recommendation Flow (Community Events — TF-IDF)

```mermaid
sequenceDiagram
    participant N as Next.js (SSR)
    participant DB as MongoDB
    participant F as FastAPI

    N->>DB: Fetch user profile
    N->>DB: Fetch all upcoming events
    N->>DB: Fetch all bookings
    N->>F: POST /recommend<br/>{ user_profile, events[], all_bookings[], limit }
    
    Note over F: 1. TF-IDF Vectorize (user text + event texts)
    Note over F: 2. Cosine Similarity → content_scores
    Note over F: 3. Feature Scoring (mode, difficulty, recency boosts)
    Note over F: 4. Collaborative Filtering (what similar users booked)
    Note over F: 5. Weighted combination → final_scores

    F-->>N: { recommendations: [{ event_id, score, reason }] }
    N->>DB: Fetch full event docs by IDs
    N-->>N: Re-order by ML score, render cards
```

> **Fallback:** If FastAPI is down (5s timeout via `AbortController`), Next.js falls back to `getRecommendedEvents()` — a simple regex tag-match query.

---

### 6.3 ML Recommendation Flow (Scraped Opportunities — Vector Search)

```mermaid
sequenceDiagram
    participant N as Next.js (SSR)
    participant DB as MongoDB
    participant F as FastAPI
    participant ST as SentenceTransformer

    N->>DB: Fetch user profile
    N->>F: POST /recommend/opportunities<br/>{ user_profile, limit }
    
    F->>ST: Encode user text → 384-dim vector
    F->>DB: $vectorSearch on "opportunities"<br/>(HNSW index, numCandidates: 100)
    DB-->>F: Top N results + vectorSearchScore
    
    Note over F: Re-rank with:<br/>• recency_boost (0–0.2)<br/>• popularity_boost (0–0.2)<br/>• final = vector_score + boosts

    F-->>N: { recommendations: [{ event_id, score, reason }] }
    N->>DB: Fetch full opportunity docs by IDs
    N-->>N: Re-order by score, render cards
```

> **Key difference from TF-IDF flow:** Next.js does NOT send any events. The user profile is converted to a vector, and MongoDB's HNSW graph finds the nearest neighbors in `O(log N)` time.

---

### 6.4 Scraping Pipeline Flow (Every 6 Hours)

```mermaid
flowchart TD
    A["⏰ APScheduler Trigger<br/>(every 6 hours)"] --> B

    subgraph "Step 1: Scrape"
        B["Run 5 Scrapers"] --> B1["MLH<br/>(BeautifulSoup + HTML)"]
        B --> B2["HackerEarth<br/>(Reverse-engineered JSON API)"]
        B --> B3["Unstop<br/>(Playwright headless browser)"]
        B --> B4["Devfolio<br/>(GraphQL API)"]
        B --> B5["HackerRank<br/>(REST API)"]
    end

    B1 & B2 & B3 & B4 & B5 --> C["Aggregate all OpportunityRaw objects"]

    subgraph "Step 2: Embed"
        C --> D["SentenceTransformer<br/>all-MiniLM-L6-v2<br/>Batch encode → 384-dim vectors"]
    end

    subgraph "Step 3: Deduplicate"
        D --> E{"For each opportunity"}
        E -->|"Exact URL match"| F["Update scraped_at only"]
        E -->|"No URL match"| G["Atlas $vectorSearch<br/>(or in-memory cosine fallback)"]
        G -->|"similarity ≥ 0.85"| H["MERGE:<br/>$addToSet alternate_sources"]
        G -->|"similarity < 0.85"| I["NEW CANONICAL:<br/>Insert with is_canonical=true"]
    end

    F & H & I --> J["Log to dedup_log"]
    J --> K["Log to scrape_runs<br/>(telemetry)"]
```

**Anti-Ban Protections in BaseScraper:**
- `fake_useragent` — randomizes browser fingerprint per request
- Rate limiting — 2-3 seconds between requests per source
- Exponential backoff — 2s → 4s → 8s on failure
- `httpx.AsyncClient` — 30s timeout with redirect following

---

## 7. Server Actions & API Routes Reference

### Server Actions (15 total)

| Action | File | Collections | Key Behavior |
|--------|------|-------------|-------------|
| `createEvent` | event.actions.ts | events | Cloudinary upload, slug auto-gen |
| `updateEvent` | event.actions.ts | events | Validates capacity ≥ seatsTaken |
| `deleteEvent` | event.actions.ts | events | Ownership check (organizer === email) |
| `getAllEvents` | event.actions.ts | events | Regex search + pagination |
| `getUpcomingEvents` | event.actions.ts | events | `date >= today`, sorted ASC |
| `getRecommendedEvents` | event.actions.ts | events | Tag/title regex fallback |
| `getMLRecommendedEvents` | event.actions.ts | users, events, bookings | **→ POST /recommend** |
| `getUserDashboardData` | user.actions.ts | bookings, events | "Attending" + "Hosting" tabs |
| `getUserOnboarding` | user.actions.ts | users | Upsert on login |
| `updateUser` | user.actions.ts | users | Profile + ML preferences |
| `registerUser` | user.actions.ts | users | bcrypt hash, default avatar |
| `createBooking` | booking.actions.ts | events, bookings | **Atomic $expr + $inc** |
| `deleteBooking` | booking.actions.ts | bookings, events, users | Atomic $inc: -1 |
| `getOpportunities` | opportunity.actions.ts | opportunities | Paginated, `is_canonical: true` |
| `getRecommendedOpportunities` | opportunity.actions.ts | users, opportunities | **→ POST /recommend/opportunities** |

### FastAPI Endpoints (6 total)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | Service info |
| `GET` | `/health` | Health check |
| `POST` | `/recommend` | TF-IDF + Feature + Collaborative scoring |
| `POST` | `/recommend/opportunities` | Vector Search + re-ranking |
| `POST` | `/scrape/run` | Manual pipeline trigger |
| `GET` | `/opportunities/stats` | Scraping telemetry |

---

## 8. Environment Variables

### Next.js (Vercel)

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | Atlas connection string |
| `GITHUB_CLIENT_ID` / `SECRET` | GitHub OAuth |
| `GOOGLE_CLIENT_ID` / `SECRET` | Google OAuth |
| `AUTH_SECRET` | JWT signing key |
| `CLOUDINARY_CLOUD_NAME` | Image CDN |
| `CLOUDINARY_API_KEY` / `SECRET` | Cloudinary auth |
| `RECOMMENDATION_SERVICE_URL` | Python microservice URL |

### Python Microservice (Render)

| Variable | Default | Purpose |
|----------|---------|---------|
| `MONGODB_URI` | `mongodb://localhost:27017` | Atlas connection string |
| `MONGODB_DB_NAME` | `opphub` | Database name |
| `PORT` | `8000` | Uvicorn port |

---

## 9. Deployment Architecture

```mermaid
graph LR
    subgraph "Vercel (Edge Network)"
        V["Next.js 16<br/>SSR + ISR + Server Actions"]
    end

    subgraph "Render (Docker)"
        R["FastAPI<br/>Docker Container<br/>Playwright + ML Models"]
    end

    subgraph "MongoDB Atlas"
        M["Shared Cluster<br/>6 Collections<br/>Vector Search Index"]
    end

    subgraph "Cloudinary"
        CL["Image CDN<br/>Event Images"]
    end

    V -->|"HTTPS POST"| R
    V -->|"Mongoose"| M
    R -->|"Motor (async)"| M
    V -->|"SDK Upload"| CL

    style V fill:#000,stroke:#00C4B4,color:#fff
    style R fill:#1a1a2e,stroke:#6366f1,color:#fff
    style M fill:#023430,stroke:#00ED64,color:#fff
    style CL fill:#3448C5,stroke:#F7DF1E,color:#fff
```

| Service | Platform | Plan | URL Pattern |
|---------|----------|------|-------------|
| Frontend | Vercel | Free/Pro | `opp-lens.vercel.app` |
| Microservice | Render | Free (512MB) | `*.onrender.com` |
| Database | MongoDB Atlas | M0 Free | `*.mongodb.net` |
| Images | Cloudinary | Free (25 credits) | `res.cloudinary.com` |

---

## 10. Key Architectural Decisions

| Decision | Why |
|----------|-----|
| **Monorepo with separate deployment** | Frontend deploys independently from ML service. A crash in Python scraping doesn't take down the website. |
| **Two recommendation algorithms** | TF-IDF works great for small, fast-changing datasets (user events). Vector Search scales to 5,000+ scraped opportunities without loading them into Python memory. |
| **Shared MongoDB, different drivers** | Mongoose (Node.js) for schema validation + hooks. Motor (Python) for async I/O during scraping. Both can read/write the `opportunities` collection safely. |
| **APScheduler over cron** | Runs inside the same Python process — no external cron service needed on Render. |
| **Atomic booking with `$expr`** | Single DB roundtrip prevents race conditions. No distributed locks needed. |
| **`is_canonical` flag for dedup** | Instead of deleting duplicates, we merge them via `alternate_sources` and keep one canonical record. This preserves cross-platform attribution. |
| **Gradient fallbacks over Unsplash** | `source.unsplash.com` API died. CSS gradients are zero-dependency and never break. |

---

## 11. Concurrency Benchmark Results

To mathematically prove the `race-condition-free` claim for the event booking pipeline, an automated stress test was conducted directly against the MongoDB Atlas database using the `motor` async driver.

**Test Methodology:**
- **Target:** A single event with `capacity: 50` and `seatsTaken: 0`.
- **Concurrency:** 200 simultaneous `findOneAndUpdate` requests dispatched using Python's `asyncio.gather()`.
- **Atomic Lock:** Each request executed `{ $expr: { $lt: ["$seatsTaken", "$capacity"] } }` and `{ $inc: { seatsTaken: 1 } }`.

**Benchmark Output:**
```text
============================================================
ATOMIC BOOKING CONCURRENCY STRESS TEST (200 USERS)
============================================================
1. Connecting to MongoDB to setup test event...
   Created test event ID: 6a64ad5748f9f44af12db354 with Capacity: 50

2. Firing 200 simultaneous booking requests directly via Motor (MongoDB)...

3. Analyzing Results...

============================================================
STRESS TEST REPORT
============================================================
Test Duration:         2.92 seconds
Total Requests Fired:  200
Successful Bookings:   50
Rejected Bookings:     150
------------------------------------------------------------
DATABASE VERIFICATION:
Expected Seats Taken:  50
Actual Seats Taken:    50
Actual Booking Docs:   50

CONCLUSION:
SUCCESS: PERFECT ACID CONSISTENCY: The atomic lock successfully
prevented 150 race condition attempts.
ZERO overbooking occurred.
```

**Conclusion:** The database-level atomic lock successfully processed 200 concurrent requests in 2.92 seconds, guaranteeing 100% data consistency and completely eliminating overbooking without the need for application-level (Node.js) distributed locks.


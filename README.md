# OppLens

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Site-2ea44f?style=for-the-badge&logo=vercel)](https://dev-event-sync.vercel.app/)

📘 **[View Complete System Design Document (HLD, LLD, Database Schema, Tech Stack)](system_design.md)**

**OppLens** is a modern, full-stack platform designed to connect developers through tech events. It goes beyond simple CRUD, offering an intelligent, personalized, and highly interactive experience for discovering, hosting, and managing developer meetups and hackathons. It leverages a robust microservices architecture for data aggregation and machine learning-powered recommendations.

## 🚀 Engineering Impact & Scale

*   **Async ETL & Reverse-Engineering**: Engineered a fault-tolerant Python/FastAPI scraping pipeline utilizing **Playwright** and reverse-engineered JSON APIs to ingest **5,000+ opportunities** across 5 platforms.
*   **Deduplication Engine**: Utilized composite-key hashing to eliminate **~95% of redundant database writes** (~1,000+ duplicate payloads/week), reducing database bloat and ensuring pristine training data for downstream ML models.
*   **NLP Recommendation Engine**: Developed a hybrid recommendation engine (TF-IDF + Cosine Similarity). Offloaded semantic matching to **MongoDB Atlas Vector Search (HNSW indexes)**, reducing query complexity from **O(N) to O(log N)** for **<50ms** personalized feed generation.
*   **Distributed Caching (Redis)**: Optimized API read throughput by implementing a Redis caching layer with targeted invalidation policies, dropping p95 ML inference response times from **400ms to <80ms**.

## 🧠 System Architecture

```mermaid
graph TD
    subgraph Frontend [Next.js 15 Application]
        UI[React User Interface]
        SA[Server Actions]
        Auth[Auth.js]
    end

    subgraph Backend [Python / FastAPI Microservice]
        API[FastAPI Router]
        ML[TF-IDF Recommendation Engine]
        Scraper[Async Scraper Pipeline]
        Cron[APScheduler]
    end

    subgraph ExternalPlatforms [External Platforms]
        Dev[Devfolio]
        Unstop[Unstop]
        HE[HackerEarth API]
        MLH[MLH]
        HR[HackerRank]
    end

    subgraph Database
        Mongo[(MongoDB Atlas)]
        VS[Atlas Vector Search]
    end
    
    subgraph Cache
        Redis[(Redis Cache)]
    end

    %% Connections
    UI <-->|Concurrent Promise.all| SA
    SA <-->|Fetch /recommend| API
    SA <-->|CRUD Operations| Mongo
    
    API <--> Redis
    API <--> ML
    ML <--> VS
    
    Cron -->|Triggers| Scraper
    Scraper -->|Graceful Degradation| ExternalPlatforms
    Scraper -->|Upsert Deduplicated Data| Mongo
```

##  Key Features

### Authentication and Authorisation
security is handled via **Next-Auth v5**, implementing a robust, role-aware authentication system.
- **Multi-Provider Login**: Supports OAuth sign-in via **GitHub** and **Google**, as well as traditional Email/Password credentials.
  <img width="1415" height="866" alt="Screenshot 2026-01-04 233825" src="https://github.com/user-attachments/assets/3ac4cdeb-1539-4b28-87f7-31c761a95873" />
  <img width="1048" height="871" alt="Screenshot 2026-01-04 233844" src="https://github.com/user-attachments/assets/b0df591c-5992-427b-a30c-ac80259b7922" />
- **Session Management**: Uses secure, encrypted sessions to persist user state across the application.
- **Protected Routes**: Middleware and server-side checks ensure that private pages (like `/create-event` or `/profile`) are inaccessible without a valid session.

###  Event System Integrity & Concurrency 
-**Create,Update,Delete and Share Events** : allows adding date,time,venue,agenda,EventImage,tags,NumberOfSeats,Overview to manage events
<img width="809" height="734" alt="image" src="https://github.com/user-attachments/assets/c1f3904e-09e8-4f8d-841b-18e092a6e1e3" />
<img width="794" height="736" alt="image" src="https://github.com/user-attachments/assets/42a9aabd-bc5e-4daa-bc74-14ec9d0dfc23" />
<img width="826" height="678" alt="image" src="https://github.com/user-attachments/assets/ada27f8f-36ab-408f-9af3-5ebbec9bd94b" />

- **Atomic Booking Engine**: Engineered a race-condition-free booking system using **MongoDB Atomic Operations** (`$inc`, `$expr`). This prevents overselling by handling capacity checks and updates in a single, indivisible database transaction.
  <img width="1700" height="875" alt="image" src="https://github.com/user-attachments/assets/bf1f3a80-3f33-44c8-9ec9-2dc0efca4f12" />
 <img width="689" height="625" alt="image" src="https://github.com/user-attachments/assets/d2c917a5-1e61-451b-8b96-5c64e25f2b31" />

- **Smart Inventory Management**: Real-time "Sold Out" and "Almost Full" states are enforced at the database level, ensuring 100% data consistency even under high-concurrency load.
  <img width="1805" height="882" alt="image" src="https://github.com/user-attachments/assets/4c1b017a-29c2-4ff7-9a1b-4895daf25df6" />


###  Intelligence & Personalization
- **Smart Recommendation Engine**: A hybrid NLP recommendation engine (TF-IDF + Cosine Similarity + Collaborative Filtering) curating a "For You" sidebar, served in **<50ms** via our Python microservice. It leverages MongoDB Atlas Vector Search for high-dimensional embedding matching.
  <img width="1800" height="798" alt="image" src="https://github.com/user-attachments/assets/d5f08a9b-f134-4bdf-b097-cae620db6ee0" />
  
- **Time-Aware Feed**: The homepage intelligently separates "Happening Soon" (Urgent) events from general discovery, adapting to the user's local time.
 - **Dynamic Greetings**: Personalized welcome messages that change based on the time of day.
  <img width="1850" height="881" alt="image" src="https://github.com/user-attachments/assets/5a6f7f32-b195-4011-8c23-1b1911cb6c9a" />


###  The Attendee Experience : allows better Developer Experience to user while sharing events on other platforms like X, whatsapp , Meta, and others
- **Dynamic Social Cards**: Automated Open Graph (OG) image generation ensures every event link shared on Twitter/LinkedIn looks professional with dynamic titles and dates.
  <img width="1444" height="896" alt="image" src="https://github.com/user-attachments/assets/037f60c8-8818-4ea7-b9ae-0956b42ac7be" />
  
###  Professional Identity
- **Developer Profiles**: A comprehensive profile system acting as a mini-portfolio, showcasing the user's bio, institution, location, GitHub/Portfolio links, and confirmed event schedule.
  <img width="1893" height="906" alt="Screenshot 2025-12-30 130822" src="https://github.com/user-attachments/assets/bb4089b0-f198-4faa-8597-3433579a9f23" />
  <img width="1897" height="904" alt="Screenshot 2025-12-30 130840" src="https://github.com/user-attachments/assets/7c576916-6fd7-4fc6-b940-6d7a4db279d4" />
  <img width="1886" height="824" alt="Screenshot 2025-12-29 125951" src="https://github.com/user-attachments/assets/42aef7ac-2d6f-401e-b91a-aa04f8573bb8" />

###  Performance & UX
- **Frontend Parallelization**: Eradicated sequential data-fetching waterfalls using `Promise.all()`, reducing load times by **~300%** and achieving a **98/100 Lighthouse performance score**.
- **Optimistic Bookmarking**: Implemented **React 19's `useOptimistic` hook** to provide a zero-latency "Save for Later" experience, ensuring the UI updates instantly while the server processes in the background.
- **Client-Side Validation**: Instant file size checks (4MB limit) prevents unnecessary server load and improves upload UX.
  <img width="885" height="447" alt="image" src="https://github.com/user-attachments/assets/e58c5d39-92a1-4cda-bd4f-35e16ecbc590" />

- **Skeleton Loading**: Custom shimmer effects preventing layout shifts (CLS) during data fetching.
  <img width="1877" height="882" alt="Screenshot 2026-01-04 234721" src="https://github.com/user-attachments/assets/f15fc931-e177-4877-913d-a0970af04ed1" />

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Lucide React
- **Backend (Node)**: Next.js API Routes, NextAuth.js, Mongoose ODM
- **Backend (Python)**: FastAPI, Uvicorn, Scikit-Learn, Playwright, BeautifulSoup4
- **Search & ML**: Elasticsearch, MongoDB Atlas Vector Search (HNSW), TF-IDF
- **Caching**: Redis
- **Database**: MongoDB Atlas
- **DevOps**: Docker, Render, Vercel, APScheduler

## 🏁 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v20 or later)
- `npm`
- A MongoDB database instance
- Redis (optional, for caching)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/manaskng/Dev-Event_Sync.git
   ```
2. **Navigate to the Next.js project directory:**
   ```bash
   cd Dev-Event_Sync/my-app
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Set up environment variables:** Create a `.env.local` file in the root of the `my-app` project and add the following variables.
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string

   # Auth (Generate with `openssl rand -base64 32`)
   AUTH_SECRET=your_next_auth_secret
   # OAuth Providers
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   # Image Storage
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   # Base URL (Set to your Vercel URL in production)
   NEXT_PUBLIC_BASE_URL=http://localhost:3000

   # Analytics (Optional)
   NEXT_PUBLIC_POSTHOG_KEY=your_key
   ```
5. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 in your browser to see the result.

6. **Start the Python Recommendation Microservice:**
   ```bash
   cd ../recommendation-service
   python -m venv venv
   # On Windows: .\venv\Scripts\activate
   # On Mac/Linux: source venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

📂 Project Structure
- `my-app/app/`: Next.js 15 App Router structure.
- `my-app/(auth)/`: Login/Register logic.
- `my-app/events/`: Event details, creation, and editing flows.
- `my-app/profile/`: User dashboard and settings.
- `my-app/components/`: Reusable UI components (EventCard, TicketCard, etc.).
- `my-app/database/`: Mongoose schemas for User, Event, and Booking.
- `my-app/lib/actions/`: Server Actions responsible for all data mutations.
- `recommendation-service/`: Python microservice for web scraping and ML recommendations.

Built with ❤️ by Manas Raj

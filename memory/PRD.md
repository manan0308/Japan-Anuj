# Tabi (旅) - Japan Trip Companion PRD

## Problem Statement
Mobile-first trip companion web app for a 14-day Japan trip (Feb 27 – Mar 13, 2026) across Osaka, Kyoto, and Tokyo. Premium travel journal meets utility dashboard with Japanese minimalism.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI (port 3000)
- **Backend**: FastAPI + MongoDB (port 8001)
- **Weather**: Open-Meteo API (free, no key)
- **Maps**: Google Maps URL links (no API key)
- **Theme**: Warm Stone (dark) / Washi Paper (light) with Manrope font

## User Persona
Solo traveler to Japan, uses iPhone Safari, needs quick access to itinerary, currency conversion, and travel utilities while on slow roaming connections.

## Core Requirements
- 5-tab bottom nav: Today, Itinerary, Currency, Tools, Settings
- Pre-loaded 60-activity itinerary across 15 days
- No authentication (single-user personal app)

## What's Been Implemented (Feb 2026)
- [x] Today Tab: Dual clock (JST/IST), live weather, next-up countdown, activity cards with time pills
- [x] Itinerary Tab: 15-day date scroller, full CRUD (add/edit/delete), category pills, status badges, search
- [x] Currency Tab: JPY↔INR converter, quick-convert buttons, custom expense categories, spending chart, conversion history
- [x] Tools Tab: Packing checklist (22 items), 15 Japanese phrases with romaji, emergency contacts (police/ambulance/embassy/hotels), transit guide, trip notes
- [x] Settings Tab: Dark/light theme toggle, exchange rate config, reminder preferences, ICS calendar export, JSON backup/restore
- [x] Google Maps links on all location entries
- [x] 60 pre-seeded activities across all 15 days
- [x] Dark mode by default with warm stone palette

## Prioritized Backlog
### P0 (Next iteration)
- PWA setup (service worker, manifest, offline support)
- Drag-and-drop reorder for activities within a day

### P1
- Photo journal: Attach photos to activities
- Restaurant rating tracker (1-5 stars)
- Budget alerts (daily spending limit warnings)
- Browser push notifications for upcoming events

### P2
- Shared trip view (read-only link)
- Daily summary generator
- Translation helper
- Souvenir tracker

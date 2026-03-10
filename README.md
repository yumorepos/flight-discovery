# ✈️ Flight Discovery Platform

A full-stack flight deal discovery platform that finds the best-value flights using intelligent scoring — combining price analysis, OTA safety ratings, and deal detection.

Built with **Next.js** (frontend) + **FastAPI** (backend) as a showcase of full-stack development with real-world data ranking algorithms.

![Python](https://img.shields.io/badge/Python-3.12-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)

## Features

- **Smart Deal Scoring** — Weighted algorithm (60% price, 30% OTA safety, 10% date proximity) ranks flights by real value, not just cheapest price
- **OTA Safety Ratings** — Automated scoring of travel booking sites based on airline partnerships, HTTPS compliance, domain trust, and known reliability
- **Deal Classification** — Flights rated as Incredible (90+), Great (80+), Good (70+), or Fair deals with visual indicators
- **Flight Search** — Search by origin airport (IATA code) and travel month with instant results
- **Email Alerts** — Subscribe for deal notifications on your preferred routes
- **Responsive UI** — Clean, modern interface with gradient cards, hover effects, and mobile support
- **23 Destinations** — Mock data spanning 6 global regions (Americas, Europe, Asia, Middle East, Africa, Oceania)

## Architecture

```
┌─────────────────────────┐     ┌──────────────────────────┐
│   Next.js Frontend      │────▶│   FastAPI Backend         │
│   (TypeScript + React)  │     │   (Python)                │
│                         │     │                           │
│   • Search interface    │     │   • /api/search           │
│   • Deal cards          │     │   • /api/destinations     │
│   • Region filters      │     │   • /api/subscribe        │
│   • Email subscription  │     │   • Deal scoring engine   │
│                         │     │   • OTA safety scorer     │
└─────────────────────────┘     └──────────────────────────┘
```

## Deal Scoring Algorithm

Each flight is scored 0-100 based on three weighted factors:

| Factor | Weight | What it measures |
|--------|--------|------------------|
| Price | 60% | How cheap vs. destination average |
| OTA Safety | 30% | Booking site reliability & trust |
| Date | 10% | Proximity to preferred travel dates |

**OTA Safety Score** evaluates each booking source on:
- Partnership with major airlines ✈️
- HTTPS and secure payment support 🔒
- Domain age and trust signals 🏛️
- Known scam/complaint history ⚠️

## Quick Start

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

## Tech Stack

**Frontend:** Next.js 15, TypeScript, React 19, Tailwind CSS 4, Axios  
**Backend:** FastAPI, Python 3.12, Pydantic, Uvicorn  
**Testing:** Playwright (automated browser tests)  
**Infra:** Docker-ready, PostgreSQL-compatible (SQLite for dev)

## Project Structure

```
flight-discovery/
├── backend/
│   ├── main.py              # FastAPI app + all endpoints
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment template
├── frontend/
│   ├── src/app/             # Next.js app router pages
│   ├── package.json         # Node dependencies
│   └── .env.local.example   # Frontend env template
├── ARCHITECTURE.md          # Detailed system design
├── DEAL-DETECTION.md        # Scoring algorithm deep-dive
└── QUICK-START.md           # Setup guide
```

## Status

✅ MVP complete and verified  
⏳ Real flight API integration (Skyscanner/Amadeus) planned  
⏳ Database persistence for subscriptions  
⏳ Automated deal alert emails  

## Author

**Yumo Xu** — Self-taught developer building production systems in Python & TypeScript.  
[Portfolio](https://yumorepos.github.io) · [LinkedIn](https://linkedin.com/in/yumo-xu-1589b7326) · [GitHub](https://github.com/yumorepos)

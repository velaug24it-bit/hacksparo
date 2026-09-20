# CrisisCare Mesh — Disaster Management Platform

[![HackSpora 2.0](https://img.shields.io/badge/HackSpora-2.0-yellow.svg)](https://github.com/velaug24it-bit/hacksparo)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![Leaflet](https://img.shields.io/badge/Geospatial-Leaflet%20%2B%20OSM-orange.svg)](https://leafletjs.com/)

**CrisisCare Mesh** is a disaster-management web application designed to connect crisis relief shelters, isolated communities, volunteers, and surplus donors during emergency events (floods, cyclones, earthquakes). Built for resilience, it operates seamlessly both online and during complete telecommunication blackouts.

---

## 🌟 Core Modules

### 🟢 1. Green SOS: Resource Assistance & FoodBridge Rescue
- **Target Audience**: Communities and evacuation shelters requiring essential supplies (Food, Drinking Water, Medicine, Baby Supplies, Shelter).
- **FoodBridge Engine**: Matches shortage requests with real-time verified community food donors (college messes, restaurants, wedding halls, NGO kitchens).
- **Dynamic Donor Registration**: Allows community kitchens to register surplus batches on-the-fly, avoiding static mock data and persisting directly to MongoDB.
- **Single & Multi-Donor Partial Matching**: Allocates food from multiple local donors when a single donor cannot fulfill the full meal requirement.

### 🟡 2. Yellow SOS: Offline Crisis Mesh & QR Packet Relay (NSL-02 Standard)
- **Beyond Connectivity**: Solves cellular network and internet blackout scenarios (e.g., cell towers submerged or power grid down).
- **Offline-First Mode**: Form and local carrier bag continue to function 100% offline via browser storage (`localStorage` & cached schemas).
- **High-Density QR Code Packets**: Compresses victim request payloads (GPS coordinates, people count, meals needed) into encrypted, high-contrast QR data packets.
- **Physical Courier Relay**: Passing rescue volunteers or disaster response boats scan QR codes into their offline "Carrier Bag" (incrementing hop counts).
- **Cloud Auto-Sync**: The moment any carrier device touches mobile data, Wi-Fi, or Starlink, all collected packets automatically batch-sync and deduplicate into central MongoDB.

### 🗺️ 3. Geospatial Crisis & Food Surplus Radar Map
- **100% Free OpenStreetMap Integration**: Zero API keys, zero rate limiting, no watermark issues.
- **Tactical Dark Radar Styling**: High-contrast dark tile filter matching disaster relief dashboard aesthetics.
- **Interactive Pins**:
  - 🏠 **Relief Shelters**: Color-coded by urgency (🔴 Critical, 🟠 High, 🟡 Moderate) with real-time capacity and shortages.
  - 🍱 **FoodBridge Donors**: Green surplus pins showing available meals, food item details, prep timing, and direct match dispatch actions.

### 📱 4. Full Mobile Responsive Design
- **Touch-Optimized UI**: Thumb-friendly touch targets (min 44px), mobile hamburger navigation drawer, and fluid grid layouts.
- **Zero iOS Safari Zoom Glitches**: Form inputs standardized to 16px to prevent accidental zooming.
- **Responsive Map & Modals**: Map canvas dynamically adjusts height (380px on phones), and modals scroll cleanly within viewport limits (`92vh`).

---

## 🛠️ Architecture & Tech Stack

```
hacksparo/
├── client/                               # Frontend (React 18 + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx                # Responsive navbar with mobile drawer
│   │   │   ├── NetworkStatusBar.jsx      # Live gateway status & offline simulation toggle
│   │   │   ├── QRPacketModal.jsx         # High-contrast QR packet generator & downloader
│   │   │   ├── QRScannerModal.jsx        # Peer courier packet importer & scanner
│   │   │   ├── ImpactMetrics.jsx         # Verified food rescue metrics
│   │   │   ├── Timeline.jsx              # Status progression timeline
│   │   │   └── Toast.jsx                 # Accessible notification toasts
│   │   ├── pages/
│   │   │   ├── ResourceAssistance.jsx    # Green SOS request creation
│   │   │   ├── OfflineMeshRelay.jsx      # Yellow SOS off-grid mesh hub
│   │   │   ├── CrisisMap.jsx             # Leaflet dark tactical geospatial radar
│   │   │   ├── FoodBridgeMatching.jsx    # Surplus food matching & donor registration
│   │   │   ├── RequestDashboard.jsx      # Requests registry & filter view
│   │   │   └── RequestDetail.jsx         # Individual request status & timeline
│   │   ├── services/
│   │   │   ├── api.js                    # REST API client (dual proxy/direct routing)
│   │   │   └── offlineMesh.service.js    # Local packet storage, Base64 compression & sync
│   │   ├── index.css                     # Emergency design system & media queries
│   │   └── App.jsx                       # Route orchestration
│   ├── package.json
│   └── vite.config.js
└── server/                               # Backend (Node.js + Express)
    ├── config/
    │   └── db.js                         # MongoDB connection with in-memory fallback
    ├── models/
    │   ├── resourceRequest.model.js      # ResourceRequest schema
    │   ├── meshPacket.model.js           # MeshPacket deduplicated log schema
    │   └── foodDonor.model.js            # Dynamic FoodDonor schema
    ├── controllers/
    │   ├── resourceRequest.controller.js # Resource request & food donor handlers
    │   └── mesh.controller.js            # Batch packet ingestion & sync handlers
    ├── services/
    │   ├── resourceRequest.service.js    # Request lifecycle & matching logic
    │   ├── foodBridge.service.js         # Food matching algorithm & persistence
    │   └── meshSync.service.js           # Mesh packet deduplication & map coordinates
    ├── routes/
    │   ├── resourceRequest.routes.js     # /api/resource-requests & /api/foodbridge
    │   └── mesh.routes.js                # /api/mesh & /api/map
    ├── middleware/
    │   ├── validator.js                  # Request body sanitization & validation
    │   └── errorHandler.js               # Centralized API error handler
    ├── .env.example                      # Template environment variables
    └── server.js                         # Express entrypoint
```

---

## ⚡ Quickstart Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas URI; falls back to in-memory store if disconnected)

### 1. Clone & Configure Backend
```bash
cd server
npm install
cp .env.example .env
npm run dev
```
*Server starts on `http://localhost:5000`.*

### 2. Configure & Launch Frontend
```bash
cd ../client
npm install
npm run dev
```
*Client opens on `http://localhost:5173`.*

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/resource-requests` | Submit emergency resource request |
| `GET` | `/api/resource-requests` | List all resource requests (with filters) |
| `GET` | `/api/foodbridge/donors` | Retrieve active food surplus sources |
| `POST` | `/api/foodbridge/donors` | Register a real community food surplus source |
| `DELETE`| `/api/foodbridge/donors/:id` | Remove/retire a food surplus source |
| `POST` | `/api/mesh/sync-packets` | Batch ingest & deduplicate offline mesh QR packets |
| `GET` | `/api/map/locations` | Get coordinates for shelters & food donors |
| `GET` | `/api/health` | Service health status |

---

## 🏆 Hackathon Context
Developed for **HackSpora 2.0** addressing problem statements:
- **NSL-01**: Resource Allocation & Food Waste Mitigation in Disaster Zones.
- **NSL-02**: Communication Beyond Connectivity (Off-Grid Mesh Relay Protocol).

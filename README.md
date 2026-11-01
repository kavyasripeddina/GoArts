# GoArts 🎭
> **Live Performing Arts & Talent Booking Platform**  
> Premium marketplace connecting event hosts with singers, live bands, classical dancers, DJs, and comedians with 50/50 escrow protection.

---

## 🌟 Executive Overview

**GoArts** is a full-stack, enterprise-grade marketplace designed for discovering, contracting, and booking live performing talent across India (weddings, corporate galas, college festivals, concerts, and private celebrations).

### Core Pillars:
1. **50/50 Protected Escrow Milestones:**
   - **Stage 1 (Inquiry & Acceptance):** Clients submit event specs; ₹0 upfront payment required while the artist reviews.
   - **Stage 2 (50% Advance):** Only unlocked after the artist accepts or quotes. Deposited securely into platform escrow.
   - **Stage 3 (50% Balance):** Released to the artist upon verified event completion. Platform retains a 15% commission.
2. **UIDAI Aadhaar Role-Based Identity Guard:**
   - Strict SHA-256 encrypted verification.
   - Ensures no two customer accounts and no two artist accounts can share an Aadhaar.
   - Allows a single citizen to hold one customer account and one artist account with the same Aadhaar.
3. **AI Event Planning & Smart Matching Engine:**
   - Powered by **Google Gemini 3.5** with automatic rule-based fallback.
   - Formulates tailored entertainment blueprints, runsheet timelines, stage technical riders, and budget allocations.
   - Multi-parameter compatibility matching evaluates genre, budget floor, city, language, and audience capacity.
4. **Mutual Agreement Direct Chat:**
   - Direct messaging unlocks only when both parties agree, protecting privacy and preventing unsolicited spam.
5. **Super Admin Executive Command Center:**
   - Real-time Gross Booking Value (GBV) analytics, platform revenue graphs, escrow health metrics, and talent audits.

---

## 🏗️ Architecture & Technology Stack

```
   ┌────────────────────────────────────────────────────────┐
   │             GoArts Client (React 18 + Vite)            │
   │  • Bespoke Theme Engine (Light / Dark)                 │
   │  • Inter & Playfair Typography                         │
   │  • Axios Interceptors & SessionStorage Token Isolation │
   └───────────────────────────┬────────────────────────────┘
                               │ HTTPS / REST
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │            GoArts API (Express.js + Node.js)           │
   │  • Helmet, CORS, Rate-Limiting, BCrypt Hashing         │
   │  • Gemini 3.5 LLM Service & Rule-Based Matcher         │
   │  • Dual-Persistence (Local RAM + MongoDB Native Driver)│
   └───────────────────────────┬────────────────────────────┘
                               │ MongoDB Wire Protocol
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │       MongoDB Atlas / Local MongoDB Compass            │
   │  • Collections: users, artists, bookings, payments,    │
   │                 verifications, reviews, notifications  │
   └────────────────────────────────────────────────────────┘
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js:** v18.0.0 or later
- **npm:** v9.0.0 or later
- **MongoDB:** MongoDB Community Server or MongoDB Atlas cluster

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/goarts.git
cd GoArts

# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration
In `backend/.env`:
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=replace_with_a_secure_random_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/goarts
DB_NAME=goarts
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Running Locally
```bash
# Terminal 1 - Backend API (Port 5000)
cd backend
npm start

# Terminal 2 - Frontend Dev Server (Port 5173)
cd frontend
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🔑 Demo Access Credentials

> **Password Security Standard:** Minimum 8 characters including uppercase, lowercase, numbers, and symbols/underscores.

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@goarts.ai` | `GoArts_Admin#2026$` | Executive Analytics, Talent Vetting, Booking Ledger, Security Audit Trail |
| **Customer** | `priya@example.com` | `GoArts_Customer#2026$` | Event Inquiries, 50/50 Milestone Payments, Mutual Chat, Reviews |
| **Artist** | `arjun@example.com` | `GoArts_Artist#2026$` | 1-Click Request Acceptance, Custom Quotes, Calendar Blocking, Performance Completion |

---

## ☁️ Deployment Guide: MongoDB Atlas & Microsoft Azure

### Part 1: MongoDB Atlas Database Setup
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new cluster (M0 Free Tier or M10 Dedicated).
3. **Database Access:** Create a database user with `readWriteAnyDatabase` privileges.
4. **Network Access:** Under IP Access List, click **Add IP Address** and add:
   - `0.0.0.0/0` (Allow access from anywhere) or specify your Azure outbound IP addresses.
5. **Get Connection String:** Click **Connect** -> **Drivers** -> Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/goarts?retryWrites=true&w=majority
   ```

---

### Part 2: Microsoft Azure Backend Deployment (Azure App Service)
1. **Create Resource:**
   - In Azure Portal, navigate to **Create a resource** -> **Web App**.
   - **Name:** `goarts-api` (e.g. `https://goarts-api.azurewebsites.net`).
   - **Publish:** Code.
   - **Runtime stack:** Node 20 LTS.
   - **Operating System:** Linux.
2. **Configure Environment Variables (Application Settings):**
   In Azure Portal, go to **Settings** -> **Configuration** (or **Environment variables**) and add:
   - `NODE_ENV` = `production`
   - `PORT` = `8080` (Azure App Service Linux listens on port 8080 or port specified in PORT)
   - `JWT_SECRET` = `<your_secure_64_char_random_hex_key>`
   - `JWT_EXPIRES_IN` = `7d`
   - `MONGODB_URI` = `<your_mongodb_atlas_connection_string>`
   - `DB_NAME` = `goarts`
   - `FRONTEND_URL` = `https://goarts.azurewebsites.net`
   - `GEMINI_API_KEY` = `<your_gemini_api_key>`
3. **Startup Command:**
   In **Configuration** -> **General settings** -> **Startup Command**:
   ```bash
   node src/server.js
   ```
4. **Deployment Options:**
   - Connect your GitHub repository to **Deployment Center** for automated CI/CD GitHub Actions deployment.

---

### Part 3: Frontend Deployment (Azure Static Web Apps)
1. **Create Resource:**
   - In Azure Portal, search for **Static Web Apps** -> **Create**.
   - **Deployment details:** GitHub -> Select your repository and branch.
   - **Build Presets:** Custom:
     - **App location:** `/frontend`
     - **Api location:** *(leave blank)*
     - **Output location:** `dist`
2. **Environment Variables in Azure Static Web App:**
   - Under **Configuration**, set:
     - `VITE_API_BASE_URL` = `https://goarts-api.azurewebsites.net/api`
3. Click **Save & Run**. Azure will build and deploy the frontend globally on Azure CDN with automatic SSL!

---

## 🖼️ Media & Photos Persistence Strategy

To ensure talent photos and portfolio assets **never disappear or get broken after deployment**:
1. **Resilient Public CDN Links:**
   - All seeded talent images use permanent, high-availability Unsplash CDN URLs with standardized aspect ratios.
2. **Automatic SVG & UI-Avatars Fallback (`onError`):**
   - Every image in the application is equipped with an inline error listener:
     ```jsx
     onError={(e) => {
       e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.displayName)}&background=4285F4&color=fff&size=400`;
     }}
     ```
   - If an external link ever fails, times out, or is blocked by an ad-blocker, the UI automatically transitions to an avatar generated with the artist's real name.
3. **Custom Cloud Storage (Optional for User Uploads):**
   - To enable user photo uploads directly from their device, configure Azure Blob Storage or Cloudinary in `backend/src/routes/artists.js`.

---

## 🧪 Automated Testing

Run the full end-to-end integration test suite:
```bash
cd backend
npm test
```
**Test Coverage Includes:**
- Strong password enforcement & rejection of weak passwords
- Customer & Artist registration with persistent credentials
- Advance payment blocking when booking is in `requested` state
- 1-click quotation & acceptance workflow
- 50% advance escrow payment -> 50% performance balance payment
- UIDAI Aadhaar role-based uniqueness enforcement (HTTP 409 on duplicate same-role Aadhaar, dual customer+artist allowed)
- Mutual agreement direct chat lock & unlock
- Admin overview milestone escrow & KYC health metrics

---

## 📄 License
© 2026 GoArts. All rights reserved.

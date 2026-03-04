# HANDOFF: Meta Ads Dash (Performance & Truth)

## 🎯 Project Objective
Build a high-performance, aesthetically "wow" dashboard for Meta Ads practitioners to see the truth behind their ad spend, identify fatigues, and get actionable budget signals without the clutter of the standard Meta Ads Manager.

---

## 🚀 Current Status: LIVE (Meta Only)
- **Framework**: Next.js 16 (Turbopack)
- **Database**: Supabase (PostgreSQL) + Prisma ORM (v7)
- **Styling**: Vanilla CSS + CSS Variables (Premium aesthetics)
- **Data Status**: Successfully syncing and displaying live Meta Ads data.

---

## ✅ Work Done

### **1. Core Infrastructure**
- **Prisma v7 Setup**: Migrated to the new adapter pattern (using `@prisma/adapter-pg` and `pg` Pool) to support Supabase connection pooling correctly.
- **Environment Management**: Configured `.env.local` to handle Meta API keys, Supabase URLs (Pooler for runtime, Direct for migrations).

### **2. Dashboard Pages**
- **Command Center**: Real-time KPI cards (Spend, Meta Revenue, ROAS, Purchases) + Fatigue Alerts + Budget Signals.
- **Campaigns**: Detailed list with health statuses (Monitor, Scaling, Intervention Needed).
- **Creative Lab**: Ad-level scoring based on CTR, ROAS, and Hook Rate (calculated from video views).
- **Improve**: Actionable insights engine that detects high frequency, underperforming ROAS, and scaling opportunities.
- **Settings**: Modular configuration for Meta API credentials.

### **3. Data Sync Engine**
- **Meta API Integration**: Robust fetching of Insights at Campaign, AdSet, and Ad levels.
- **Auto-Upsert**: Sync logic prevents duplicate data by using date-based keys.
- **Error Handling**: Wrapped all main page fetches in try/catch blocks with empty-state fallbacks to ensure the app never crashes even if the DB is disconnected.

---

## ⏳ Pending / In-Progress

### **1. Audiences Heatmap**
- **Status**: Backend fetches demographic data, but the frontend "Heatmap" component is currently empty/waiting for dynamic rendering logic.
- **Next Step**: Implement the visual Heatmap grid for Age/Gender distribution.

### **2. Shopify Integration (PAUSED)**
- **Status**: Entirely removed from the codebase to focus on Meta Ads.
- **Note**: The code was previously implemented but had scope permission issues (`read_orders`).
- **Next Step**: When resuming, use space-separated scopes in the OAuth flow and verify Shopify Admin API access levels.

---

## 🔮 Future Ideas
- **Export to PDF/CSV**: Weekly performance report generator.
- **Email/Slack Alerts**: Automated notifications when a campaign's ROAS drops below a set threshold.
- **Multi-Account Support**: Ability to toggle between different Meta Ad Accounts.
- **AI Recommendations**: Integrate an LLM to provide deeper qualitative analysis on ad creative copy.

---

## 🛠️ Dev Notes
- **To Sync**: Click the "Sync Now" button in the sidebar. It triggers `/api/sync`.
- **Database**: Schema is in `prisma/schema.prisma`. Use `npx prisma migrate dev` for changes.
- **Styles**: Defined in `globals.css` using CSS variables for easy theming.

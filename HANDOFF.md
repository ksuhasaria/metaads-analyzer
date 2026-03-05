# HANDOFF: Meta Ads Dash (Performance & Truth)

## 🎯 Project Objective
Build a high-performance, aesthetically "wow" dashboard for Meta Ads practitioners to see the truth behind their ad spend, identify fatigues, and get actionable budget signals without the clutter of the standard Meta Ads Manager.

---

## 🚀 Current Status: LIVE (Meta Only)
- **Deployment**: [https://metaads-analyzer.vercel.app](https://metaads-analyzer.vercel.app)
- **GitHub**: [https://github.com/ksuhasaria/metaads-analyzer](https://github.com/ksuhasaria/metaads-analyzer)
- **Framework**: Next.js 16 (Turbopack)
- **Database**: Supabase (PostgreSQL) + Prisma ORM (v7)
- **Styling**: Vanilla CSS + CSS Variables (Premium aesthetics)
- **Data Status**: Successfully syncing and displaying live Meta Ads data.

---

## ✅ Work Done

### **1. Core Infrastructure & Integrations**
- **Prisma v7 Setup**: App operates on Prisma ORM (v7). Connected to Supabase PostgreSQL using connection pooling adapter.
- **Automated Vercel Migrations**: Adjusted `schema.prisma` and `prisma.config.ts` to strictly follow Prisma 7 constraints, ensuring `prisma migrate deploy` runs successfully upon every push to Vercel without breaking the build.
- **Meta API Integration**: Robust fetching of Insights at Campaign, AdSet, and Ad levels. Sync retrieves active AND paused/archived ads for a full historical picture.

### **2. Dashboard Features**
- **Command Center**: Real-time KPI cards (Spend, Meta Revenue, ROAS, Purchases) + Fatigue Alerts + Budget Signals.
- **Global Date Filtering**: Reusable `DateRangePicker` component integrated across all major pages (Command Center, Campaigns, Creatives, Improve, Audiences). Presets (Today, 7d, 30d, etc.) update `?since=&until=` URL parameters for fully shareable, server-rendered views.
- **Audience Heatmap**: Dynamic 2D grid matrix mapping Age vs. Gender. Color-coded cells intensity represents ROAS, with a tooltip displaying explicit breakdown metrics per cell.
- **Campaigns & Status Filter**: Campaign list augmented with a `StatusFilter` component (Active, Paused, All).
- **Creative Lab**: Ad-level scoring based on CTR, ROAS, and Hook Rate.
- **Improve**: Actionable insights evaluating frequency caps, underperforming ROAS, and scaling opportunities.

---

## ⏳ Pending / Future Roadmap

### **1. Shopify Integration (PAUSED)**
- **Status**: Removed from the immediate codebase to maintain strict focus on Meta Ads API.
- **Next Step**: When resuming, implement OAuth with space-separated scopes (`read_orders`) and verify Admin API access.

### **2. Potential Enhancements**
- **Export to PDF/CSV**: Weekly performance report generator.
- **Email/Slack Alerts**: Notifications for dropped ROAS thresholds or critical ad fatigue.
- **Multi-Account Support**: Ability to toggle between different Meta Ad Accounts locally and on deployed DB.
- **AI Recommendations**: Integrate an LLM to provide creative/copy suggestions based on top-performing ads.

---

## 🛠️ Dev Notes
- **To Sync**: Click "Sync Now" in sidebar -> triggers `/api/sync` -> fetches last 24h Meta insights -> updates DB metrics and new Campaign/Ad active statuses.
- **Database Schema**: Maintained in `prisma/schema.prisma`. *Note: Connection URL mappings are kept cleanly in `prisma.config.ts` to avoid Vercel build errors.*
- **Styles**: Vanilla CSS in `globals.css` with CSS variables for responsive, dynamic dark-mode theming.
- **Vercel Build Command**: `prisma generate && prisma migrate deploy && next build` (Applies schema changes automatically on deployment).

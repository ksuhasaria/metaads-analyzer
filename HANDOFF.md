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
- **90-Day Historical Backfill**: Developed a chunked, browser-driven backfill system (7-day API chunks) with progress tracking and failure-resume logic to safely populate initial historical data without hitting Vercel (60s) or Meta rate limits.

### **2. Dashboard Features**
- **Command Center**: Real-time KPI cards (Spend, Meta Revenue, ROAS, Purchases) + Fatigue Alerts + Budget Signals.
- **Global Date Filtering**: Reusable `DateRangePicker` component integrated across all major pages (Command Center, Campaigns, Creatives, Improve, Audiences). Presets (Today, 7d, 30d, etc.) update `?since=&until=` URL parameters for fully shareable, server-rendered views.
- **Audience Heatmap**: Dynamic 2D grid matrix mapping Age vs. Gender. Color-coded cells intensity represents ROAS, with a tooltip displaying explicit breakdown metrics per cell.
- **Campaigns & Status Filter**: Campaign list augmented with a `StatusFilter` component (Active, Paused, All).
- **Creative Lab**: Ad-level scoring based on CTR, ROAS, and Hook Rate.
- **Improve**: Actionable insights evaluating frequency caps, underperforming ROAS, and scaling opportunities.

---

## ⏳ Pending / Future Roadmap (Recommendations for Next Iteration)

### **1. AI Recommendations (LLM Integration)**
- **Objective**: Pass best and worst-performing ads (and their metrics) to an LLM (e.g., OpenAI/Gemini) to generate plain-English, actionable suggestions on *why* creatives are fatiguing and recommend new copy angles to try next.

### **2. Shopify Integration (Orders & LTV) (RESUME)**
- **Objective**: Integrate real Shopify store revenue to uncover discrepancies between Meta's reported revenue and actual business revenue.
- **Implementation**: Needs OAuth flow with space-separated scopes (`read_orders`) to match data points properly. 

### **3. Additional Export/Monitoring Features**
- **Export to PDF/CSV**: Weekly performance report generator.
- **Email/Slack Alerts**: Notifications for dropped ROAS thresholds or critical ad fatigue.
- **Multi-Account Support**: Ability to toggle between different Meta Ad Accounts locally and on deployed DB.

---

## 🛠️ Dev Notes
- **To Sync**: Click "Sync Now" in sidebar -> triggers `/api/sync` -> fetches the last **3 days** (72 hours) of Meta insights to capture retroactive conversion attributions -> updates DB metrics.
- **Historical Data**: The Sidebar contains a one-time "Fetch 90 Days History" button that handles sequential backlog data ingestion. It auto-hides upon completion.
- **Database Schema**: Maintained in `prisma/schema.prisma`. *Note: Connection URL mappings are kept cleanly in `prisma.config.ts` to avoid Vercel build errors.*
- **Styles**: Vanilla CSS in `globals.css` with CSS variables for responsive, dynamic dark-mode theming.
- **Vercel Build Command**: `prisma generate && prisma migrate deploy && next build` (Applies schema changes automatically on deployment).

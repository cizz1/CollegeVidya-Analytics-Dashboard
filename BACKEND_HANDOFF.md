# College Vidya x Monade AI - Backend Integration & Handoff Guide

This document is designed for the backend developer/integrator who will connect the dynamic backend to the Vercel-deployed Next.js frontend. It outlines the current static system, the data schemas, and the recommended integration paths.

---

## 1. Current System Architecture

Currently, the platform consists of two decoupled components:

1. **Frontend (Next.js 15+ App Router):** 
   - A highly optimized dashboard designed with Tailwind CSS, custom SVG funnel visualizations, and interactive component charts.
   - It fetches raw data from a static CSV file located at `/public/final_dashboard_data.csv` (requested at runtime via `fetch('/final_dashboard_data.csv')` in `src/utils/fetchData.ts`).
   - If the CSV is missing, it falls back to a mock `dummyData` object.

2. **Data Processing Layer (Python + Gemini 2.5):**
   - Located in the root/desktop files (`process_dashboard_data.py`, `classify_and_export.py`, etc.).
   - This script runs periodically (locally or on a separate VM) to transcribe call recordings and evaluate them using Vertex AI (Gemini 2.5 Flash) across specific metrics (agent intelligence, objection handling, saved leads).
   - It outputs the results into the `final_dashboard_data.csv` file.

---

## 2. Core Integration Goals

To make the platform fully dynamic and live on Vercel, the backend developer needs to transition the data-fetching layer from a static `/public/final_dashboard_data.csv` file to a **live API-driven or database-driven architecture**.

Since Vercel uses serverless functions (which have no persistent local file system), **you cannot write to `/public/final_dashboard_data.csv` at runtime on Vercel.**

---

## 3. Recommended Integration Architectures

The developer can implement one of the following two paths:

### Path A: Cloud Storage + API (Easiest & Fastest)
Instead of a database, upload the processed CSV to a secure cloud storage bucket (e.g., AWS S3, Google Cloud Storage, or Supabase Storage).
1. **Python Script:** Update the processing script to upload `final_dashboard_data.csv` to your S3 bucket after every run.
2. **Next.js Frontend:** Update `src/utils/fetchData.ts` to fetch from the public S3 URL (or via a secure Next.js API route that fetches from S3).
3. **Pros:** Extremely simple, requires no database setup, retains the exact CSV-parsing logic already built into the frontend.

### Path B: Database + REST API (Robust & Production-Ready)
Migrate the dashboard to a real-time database (e.g., PostgreSQL, Supabase, or MongoDB).
1. **Database Schema:** Create a table (e.g. `calls` or `leads`) matching the schema in Section 4.
2. **Python Script:** Update the processing script to insert/update analyzed call logs directly into the database instead of appending to a CSV.
3. **Next.js Frontend:**
   - Create a Next.js API route (e.g., `src/app/api/dashboard-data/route.ts`) that queries the database and aggregates the stats.
   - Update `src/utils/fetchData.ts` to fetch from `/api/dashboard-data`.
4. **Pros:** True real-time updates, scalable, enables filters (by date, agent, campaign, etc.), highly secure.

---

## 4. Expected Data Schema (`DashboardData` Interface)

The frontend expects the backend to supply data corresponding to the following TypeScript interface (defined in `src/utils/fetchData.ts`):

```typescript
export interface DashboardData {
  funnel: {
    totalCalls: number;
    connected: number;
    didNotConnect: number;
    notInterested: number;
    uncertain: number;
    qualified: number;
  };
  notInterestedReasons: { name: string; value: number }[];
  uncertainReasons: { name: string; value: number }[];
  avgQualifiedScore: number;
  
  agentIntelligenceComprehensive: { name: string; value: number }[];
  agentIntelligencePerCall: { name: string; value: number }[];
  
  callVolume: {
    name: string; // e.g., "Day 1", "Day 2"
    qualified: number;
    uncertain: number;
    notInterested: number;
    didNotConnect: number;
    totalCalls: number;
    connected: number;
  }[];
  
  objectionRecovery: { name: string; value: number }[];
  savedLeadsImpact: { name: string; value: number }[];
}
```

### Underlying CSV Column Mapping
The Python processing script currently outputs columns that map directly to these metrics. The key columns are:
* **Call Status:** `call_connected` (boolean)
* **Verdicts:** `verdict_not_interested`, `verdict_uncertain`, `verdict_qualified` (booleans)
* **Not Interested Reasons:** `ni_already_enrolled`, `ni_not_looking`, `ni_budget_constraints`, `ni_preferred_other`, `ni_wrong_contact`
* **Uncertain Reasons:** `unc_voicemail`, `unc_disconnected_hearing_reason`, `unc_disconnected_minimal_conv`, `unc_language_barrier`, `unc_disconnected_middle`
* **Agent Intelligence:** `ai_questions_answered_correctly` (int), `ai_objections_handled_gracefully` (int), `ai_recovered_after_interrupt` (bool), `ai_off_topic_recovered` (bool), `ai_empathetic_listening` (int), `ai_ineligible_saved_alternative` (bool), `ai_language_auto_switched` (bool)
* **Objection Recovery:** `or_fence_sitter` (bool), `or_too_expensive` (bool), `or_comparing_options` (bool), `or_trust_legitimacy` (bool), `or_skeptical_online` (bool)
* **Saved Leads:** `sli_smart_program_redirect` (bool), `sli_financial_objection_handled` (bool), `sli_fence_sitter_recovered` (bool)
* **Scores:** `qualified_score` (int)

---

## 5. Key Files and Codebases to Deliver

1. **Frontend Repo (`cv-dashboard`):** Contains the Next.js visual application.
2. **AI Processor (`process_dashboard_data.py`):** Python pipeline that transcribes, parses calls, and executes the Gemini LLM.
3. **Sample CSV (`final_dashboard_data.csv`):** Provide a sample data export so the developer can see the exact row structure, datatypes, and sample transcripts.

---

## 6. Required Environment Variables

When deploying the fully integrated version to Vercel, the developer will need to configure the following environment variables (depending on the integration path):

- `DATABASE_URL` or `SUPABASE_URL` / `SUPABASE_ANON_KEY` (if using Path B)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME` (if using Path A)
- `NEXT_PUBLIC_API_URL` (if pulling from an external API server)
- `GCP_PROJECT_ID` & `GOOGLE_APPLICATION_CREDENTIALS` (or API Keys if the Vertex pipeline runs serverless)

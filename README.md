# ClearFile

AI-powered invoice compliance agent — extracts structured data from invoices, flags low-confidence fields for human review, and digitally signs approved documents into audit-ready e-invoices.

Built for the DevNetwork API+Cloud+AI Hackathon 2026 (Nutrient DWS Challenge).

## Why

France's e-invoicing mandate took effect September 1, 2026, requiring businesses to submit invoices in a structured, machine-readable format. Manual invoice processing is slow and error-prone. ClearFile automates extraction while keeping a human in the loop for anything the AI isn't confident about, with a full audit trail for compliance.

## Live Demo

Frontend: https://clearfile-xi.vercel.app

Backend API: https://clearfile-g3ua.onrender.com

Note: the backend runs on a free-tier instance and may take up to a minute to wake up on the first request after a period of inactivity.

## How It Works

Upload an invoice (PDF, PNG, or JPG). Nutrient DWS Data Extraction API pulls out structured fields with a confidence score per field. Fields below the confidence threshold are flagged for human review, with an AI-generated note explaining what to check. A reviewer approves or rejects each flagged field. Once all fields are approved, the invoice is converted to a clean PDF and digitally signed via Nutrient DWS. Every step (upload, extraction, approval, signing) is recorded in an audit trail.

## Tech Stack

Backend: Python, FastAPI, PostgreSQL (hosted on Neon), SQLAlchemy, Alembic.

Document processing: Nutrient DWS (Data Extraction API, Processor API, Digital Signing, Web Viewer).

AI layer: OpenAI API, generates human-readable review notes for low-confidence fields.

Frontend: Next.js, React, TypeScript, Tailwind.

Deployment: Render (backend), Vercel (frontend), Neon (database).

## Where Nutrient DWS Did the Heavy Lifting

Data Extraction API pulls structured key-value pairs and per-field confidence scores from uploaded invoices, which drives the whole review workflow. Processor API converts the approved, structured data into a clean PDF. Digital Signing cryptographically signs the final PDF, making it tamper-evident. Web Viewer renders both original and signed documents inline in the app.

## Setup

### Backend

Run these commands from the repo root:

```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a .env file in backend/ with DATABASE_URL, OPENAI_API_KEY, NUTRIENT_PROCESSOR_API_KEY, and NUTRIENT_EXTRACTION_API_KEY.

Then run migrations and start the server:

```
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```
cd frontend
npm install
```

Create a .env.local file in frontend/ with NEXT_PUBLIC_API_URL set to your backend URL.

```
npm run dev
```

## Branching Strategy

main is always stable and deployable. Each contributor works on their own feature branch. Open a PR to merge into main, and review before merging.

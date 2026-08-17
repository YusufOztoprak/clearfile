cat > README.md << 'EOF'
# ClearFile

AI-powered invoice compliance agent — extracts, verifies with human review, and digitally signs documents into audit-ready e-invoices using Nutrient DWS.

Built for the DevNetwork API+Cloud+AI Hackathon 2026 (Nutrient DWS Challenge).

## Tech Stack
- Backend: Python, FastAPI, PostgreSQL
- Document processing: Nutrient DWS (Data Extraction API, Processor API, DWS Viewer)
- AI layer: OpenAI API
- Frontend: Next.js, React
- Deployment: Docker, Render, Vercel

## Branching Strategy
- `main`: always stable, deployable
- `feature/*`: each of us works on our own feature branch (e.g. `feature/backend-upload`, `feature/frontend-dashboard`)
- Open a PR to merge into `main`, review each other's PRs before merging

## Setup
_(coming soon)_
EOF
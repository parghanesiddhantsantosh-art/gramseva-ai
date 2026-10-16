# GramSeva AI

GramSeva AI is a multilingual, voice-first welfare scheme discovery portal and Gram Panchayat inquiry dashboard. Citizens can describe their situation in Marathi, Hindi, or English and view suggested schemes, required documents, and next steps. Panchayat officers can review and update inquiry statuses.

[Deploy this project on Render](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fparghanesiddhantsantosh-art%2Fgramseva-ai)

## Features

- Type a citizen query, choose a demo scenario, or dictate it using browser speech recognition.
- Match queries to welfare schemes with the Gemini API when configured, with a built-in demo fallback.
- Read the advisory aloud using the browser's speech synthesis or print a verification slip.
- Search and update inquiries in the Panchayat officer dashboard.
- Access a document-verification API endpoint.

## Requirements

- Python 3.10 or newer
- Node.js and npm
- A Gemini API key for AI-powered scheme matching and document verification (optional; demo fallback responses are used without it)

## Run locally

Open two terminals from the project root.

### 1. Start the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

To enable Gemini, create `backend/.env` and add your key:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
```

Keep this file private; it is excluded from Git.

Start the API:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend runs at <http://localhost:8000>. Interactive API documentation is available at <http://localhost:8000/docs>.

### 2. Start the frontend

In a second terminal, from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (typically <http://localhost:5173>). The frontend expects the backend at `http://localhost:8000`.

## Deploy to Render

The repository includes a `render.yaml` Blueprint that creates a Python API service and a static frontend. To deploy:

1. Sign in to [Render](https://render.com/) and connect your GitHub account if prompted.
2. In the Render dashboard, choose **New** → **Blueprint**, then select `parghanesiddhantsantosh-art/gramseva-ai`.
3. Review the two services and apply the Blueprint. Add `GEMINI_API_KEY` when prompted if you want Gemini-powered responses; without it, the backend uses its demo fallback.
4. Once both services finish deploying, open the `gramseva-frontend` URL shown in Render.

The frontend receives the API hostname from the backend service through the Blueprint and uses HTTPS in production. The API URL defaults to `http://localhost:8000` for local development. On Render's free tier, the API may take a short time to wake after inactivity. Inquiry records are in memory and reset when the backend restarts.

## Frontend checks

From `frontend/`, run:

```bash
npm run lint
npm run build
```

## API overview

- `GET /` — backend status and scheme count
- `POST /api/match-schemes` — find schemes for a citizen query and record an inquiry
- `POST /api/verify-document` — analyze an uploaded document
- `GET /api/admin/inquiries` — list inquiries
- `PATCH /api/admin/inquiries/{inquiry_id}` — update an inquiry's status

Inquiry data is currently held in memory and resets when the backend restarts. This project is a demo; verify scheme eligibility and requirements with the relevant government office before relying on an advisory.

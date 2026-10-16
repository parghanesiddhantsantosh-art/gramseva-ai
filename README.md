# GramSeva AI

GramSeva AI is a multilingual, voice-first welfare scheme discovery portal and Gram Panchayat inquiry dashboard. Citizens can describe their situation in Marathi, Hindi, or English and view suggested schemes, required documents, and next steps. Panchayat officers can review and update inquiry statuses.

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

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

## Deploy on GitHub Pages and Render

The frontend is published to GitHub Pages at <https://parghanesiddhantsantosh-art.github.io/gramseva-ai/> by the workflow in `.github/workflows/deploy-pages.yml`. The FastAPI backend is hosted separately on Render. The repository must be public to use GitHub Pages on GitHub Free.

1. In [Render](https://render.com/), choose **New** → **Blueprint**, connect GitHub if prompted, and select this repository. Apply the Blueprint to create the API service.
2. In the GitHub repository, open **Settings** → **Secrets and variables** → **Actions** → **Variables**, then create the repository variable `VITE_API_BASE_URL` with the API service's Render URL, for example `https://gramseva-api.onrender.com` (use the actual URL shown in Render).
3. In GitHub, open **Settings** → **Pages** and set the build and deployment source to **GitHub Actions**.
4. Run the **Deploy to GitHub Pages** workflow from the **Actions** tab, or push a change to `main`. Once it succeeds, visit <https://parghanesiddhantsantosh-art.github.io/gramseva-ai/>.

The Pages build requires `VITE_API_BASE_URL` to be set, preventing a production site from accidentally calling localhost. For Gemini-powered responses, set `GEMINI_API_KEY` in the Render API service's environment settings; without it, the backend uses its demo fallback. On Render's free tier, the API may take a short time to wake after inactivity. Inquiry records are in memory and reset when the backend restarts.

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

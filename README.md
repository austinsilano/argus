# AI Shadow IT Scanner

Discover, risk-score, and report on AI tools being used across your organisation.

---

## Stack

| Layer | Tech |
|-------|------|
| Backend API | Python FastAPI |
| Database | PostgreSQL 16 |
| Risk Database | YAML flat files (`data/tools/`) |
| Container | Docker + Docker Compose |
| Cloud Deploy | Railway |

---

## Local Setup

### Prerequisites

Install one of the following — both options work:

**Option A — Docker Desktop (recommended, works on Windows and WSL)**
- Download: https://www.docker.com/products/docker-desktop/
- Includes Docker Compose automatically
- On Windows: enable WSL2 integration in Docker Desktop settings

**Option B — WSL/Linux without Docker Desktop**
```bash
sudo apt update && sudo apt install docker.io docker-compose-v2 -y
sudo usermod -aG docker $USER   # then log out and back in
```

---

### Run locally (WSL or Linux)

```bash
# 1. Clone or create the project folder
cd ai-shadow-scanner

# 2. Start everything (Postgres + FastAPI)
bash scripts/run_local.sh

# 3. API is live at:
#    http://localhost:8000
#    http://localhost:8000/docs   <-- interactive Swagger UI
```

---

### Run locally (Windows CMD — no WSL)

> Docker Desktop must be running first.

```bat
# Option 1: Use Docker Compose from CMD
docker compose up --build

# Option 2: Python venv without Docker (needs local Postgres)
scripts\run_windows.bat
```

---

### Test it immediately

Once running, open http://localhost:8000/docs in your browser.
You will see the full Swagger UI. Try these in order:

**1. Health check**
```
GET /health
```
Should return: `{"status": "ok", ...}`

**2. Upload the sample DNS CSV**
```
POST /api/scans/dns-csv
```
Upload: `data/sample_dns_export.csv`

**3. View discovered tools**
```
GET /api/tools/
```
Returns all matched tools with risk scores.

**4. Risk summary**
```
GET /api/tools/summary
```
Returns counts by risk level.

**5. Report preview**
```
GET /api/reports/preview
```
Returns top-risk tools JSON (PDF coming in next phase).

---

## Project Structure

```
ai-shadow-scanner/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + CORS + router registration
│   │   ├── db/
│   │   │   └── database.py      # SQLAlchemy async engine + session
│   │   ├── models/
│   │   │   ├── tool.py          # DiscoveredTool table
│   │   │   └── scan.py          # Scan history table
│   │   ├── schemas/
│   │   │   ├── tool.py          # Pydantic request/response models
│   │   │   └── scan.py
│   │   ├── routers/
│   │   │   ├── health.py        # GET /health
│   │   │   ├── tools.py         # GET /api/tools/
│   │   │   ├── scans.py         # POST /api/scans/dns-csv
│   │   │   └── reports.py       # GET /api/reports/preview
│   │   └── services/
│   │       ├── risk_service.py  # YAML loader + risk scoring logic
│   │       └── dns_service.py   # CSV parser + tool matcher
│   ├── requirements.txt
│   └── Dockerfile
├── data/
│   ├── tools/
│   │   └── ai_tools.yaml        # 20 AI tool risk profiles (add more here)
│   └── sample_dns_export.csv    # Test data for the scan upload endpoint
├── scripts/
│   ├── run_local.sh             # WSL/Linux: docker compose up + health wait
│   └── run_windows.bat          # Windows CMD: venv setup + uvicorn
├── docker-compose.yml           # Local: Postgres + backend together
├── railway.toml                 # Railway deploy config
└── .env.example                 # Copy to .env for local overrides
```

---

## Deploy to Railway

### First deploy (5 minutes)

**1. Push to GitHub**
```bash
git init
git add .
git commit -m "initial scaffold"
git remote add origin https://github.com/YOUR_USERNAME/ai-shadow-scanner.git
git push -u origin main
```

**2. Create Railway project**
- Go to https://railway.app
- New Project → Deploy from GitHub repo
- Select your repo

**3. Add PostgreSQL**
- Inside your Railway project: New → Database → PostgreSQL
- Railway automatically injects `DATABASE_URL` into your service

**4. Add environment variable**
- In your service settings → Variables:
```
DATABASE_URL  (already set by Railway — do not override)
```

**5. Deploy**
- Railway detects `railway.toml` and builds from `backend/Dockerfile`
- First deploy takes ~2 minutes
- You get a public URL like: `https://ai-shadow-scanner-production.up.railway.app`

**6. Test your live deploy**
```
https://YOUR-URL.railway.app/health
https://YOUR-URL.railway.app/docs
```

---

## Adding More AI Tools

Edit `data/tools/ai_tools.yaml` or add new `.yaml` files in `data/tools/`.

Each tool entry:
```yaml
- name: Tool Name
  domain: tool.example.com        # must match DNS query domains
  vendor: Vendor Inc
  category: LLM                   # LLM / Code Assistant / Writing Assistant / etc.
  risk_score: 7.5                 # 0-10, overrides auto-calculation
  risk_level: HIGH                # LOW / MEDIUM / HIGH / CRITICAL
  data_classification: CONFIDENTIAL
  data_leaves_org: true
  trains_on_data: false
  gdpr_relevant: "YES"            # YES / NO / UNKNOWN
  sso_available: true
  notes: "Any notes for the report."
```

Risk score auto-calculates if you omit `risk_score`:
- `data_leaves_org: true` → +2.0
- `trains_on_data: true` → +1.5
- `gdpr_relevant: YES` → +0.5
- `sso_available: true` → -1.0

---

## What's Next (Phase 2)

- [ ] PDF report generation with ReportLab
- [ ] React dashboard frontend
- [ ] Microsoft 365 OAuth integration
- [ ] Google Workspace OAuth integration
- [ ] Scan history trend charts

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SkillStack — AI-Powered Career Skill Intelligence Platform

> A full-stack AI platform that turns your career goals into a structured, data-driven learning engine. Upload your resume, track your skills, calibrate your expertise, and practice with AI-generated mock interviews — all in one place.

---

## 🚀 Features

- **📄 AI Resume Ingestion** — Upload a PDF resume and the AI agent automatically extracts your top 10 technical skills with estimated proficiency levels.
- **📝 AI Resume Review** — After parsing, Gemini generates a personalized 2-sentence critique of your resume highlighting strengths and areas for improvement.
- **🧠 Skill Matrix (Tracker)** — A Kanban-style board to track your skills across `Backlog → Learning → Practicing → Mastered`.
- **⚡ Anti-Ego Calibration** — Before you can upgrade a skill, the AI generates a challenging validation question to prove your knowledge.
- **🎯 AI Lab (Practice Tasks)** — Generates 3 real-world practice projects tailored to your weakest skills.
- **🧪 Mock Interview Simulator** — Paste any Job Description and the AI generates a custom mock interview based on your current skill gaps.
- **🔐 Email & Password Auth** — Secure sign up (with username) and login via Supabase Auth.
- **⏳ Async Background Processing** — Heavy AI tasks (like resume parsing) run in the background via Celery + Redis so the UI stays fast.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, Zustand, Framer Motion |
| **Backend** | Python, FastAPI, Uvicorn |
| **AI Engine** | Google Gemini 1.5 Flash (`google-generativeai`) |
| **Background Jobs** | Celery + Redis (Upstash Cloud) |
| **Database & Auth** | Supabase (PostgreSQL + Auth) |
| **PDF Parsing** | PyPDF2 |

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js** v18+
- **Python** 3.11+
- A free **[Supabase](https://supabase.com)** project
- A free **[Upstash Redis](https://upstash.com)** database
- A **[Gemini API Key](https://aistudio.google.com/apikey)**

---

### 1. Clone & Install Frontend Dependencies
```bash
git clone https://github.com/DharsanRJ/sivasamy.git
cd sivasamy
npm install
```

### 2. Install Backend Dependencies
```bash
pip install -r backend/requirements.txt
```

### 3. Configure Environment Variables

Copy the example file and fill in your credentials:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

GEMINI_API_KEY=your_gemini_api_key

# From Upstash Redis dashboard — use the rediss:// URL
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT:6379?ssl_cert_reqs=CERT_NONE
```

> **⚠️ Important for Redis (Upstash):** Make sure your `REDIS_URL` starts with `rediss://` (double `s`) and includes `?ssl_cert_reqs=CERT_NONE` at the end.

---

### 4. Set Up Supabase Database

Run these SQL statements in your Supabase SQL Editor to create the required tables:

```sql
-- Skills table
CREATE TABLE skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  proficiency INT CHECK (proficiency BETWEEN 1 AND 5),
  status TEXT CHECK (status IN ('Backlog', 'Learning', 'Practicing', 'Mastered')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Practice logs table
CREATE TABLE practice_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_title TEXT,
  score INT,
  feedback TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own skills" ON skills FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own logs" ON practice_logs FOR ALL USING (auth.uid() = user_id);
```

---

### 5. Run the App (3 terminals)

**Terminal 1 — Frontend:**
```bash
npm run dev:frontend
```

**Terminal 2 — Backend API:**
```bash
uvicorn backend.main:app --reload --port 8000
```

**Terminal 3 — Celery Background Worker:**
```bash
celery -A backend.celery_app worker --loglevel=info --pool=solo
```

> **Note for Windows users:** The `--pool=solo` flag is **required** on Windows to prevent process forking errors.

The app will be available at **http://localhost:3000**

---

## 📁 Project Structure

```
sivasamy/
├── backend/
│   ├── main.py          # FastAPI app, all API routes
│   ├── ai_engine.py     # Gemini AI integration & Pydantic schemas
│   ├── tasks.py         # Celery background tasks (resume processing)
│   ├── celery_app.py    # Celery + Redis configuration
│   └── requirements.txt
├── src/
│   ├── components/
│   │   └── screens/
│   │       ├── Onboarding.tsx   # Auth + resume upload flow
│   │       ├── Dashboard.tsx    # Main command center
│   │       ├── Tracker.tsx      # Skill Matrix + Calibration
│   │       ├── Lab.tsx          # AI practice task generator
│   │       ├── Readiness.tsx    # Mock interview simulator
│   │       └── Evaluation.tsx   # Progress evaluation
│   ├── lib/
│   │   ├── api.ts       # All FastAPI HTTP client functions
│   │   └── supabase.ts  # Supabase client
│   └── store/
│       └── useAppStore.ts # Global state management (Zustand)
├── .env.example
└── README.md
```

---

## 🔄 End-to-End Data Flow

1. **User signs up/logs in** → Supabase Email Auth issues a JWT.
2. **JWT is sent** with every API request to FastAPI in the `Authorization` header.
3. **FastAPI creates a scoped Supabase client** using the JWT, enforcing Row Level Security.
4. **Resume uploaded** → FastAPI saves the file and immediately queues a Celery task via Redis.
5. **Celery worker** picks up the task, reads the PDF via PyPDF2, sends the text to Gemini, extracts skills + a resume review, and saves both to Supabase.
6. **Frontend refreshes** the skill matrix and dashboard activity feed with the new AI-generated data.

---

## 📜 License

Apache-2.0

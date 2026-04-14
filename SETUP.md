# AlgoJudge — Online Judge Platform

A full-featured online judge for practicing DSA coding problems. Built with React, Express, MongoDB, and AWS S3.

## Features

### For Users
- **Browse Problems** — View all coding problems, filter by difficulty (Easy/Medium/Hard) and tags (DP, Graph, Binary Search, etc.)
- **Search** — Search problems by title
- **Code Editor** — Write solutions in C++, Java, or Python with full syntax highlighting (Monaco Editor)
- **Submit Code** — Submit your solution (requires login)
- **View Submissions** — See your past submissions and their status

### For Admins
- **Create Problems** — Add new DSA problems with title, description, difficulty, tags, constraints, and sample test cases
- **Upload Test Cases** — Upload `.zip` files containing test cases, stored securely in AWS S3
- **Delete Problems** — Remove problems (also cleans up S3 files)
- **Platform Stats** — View total questions and submissions count

### Authentication & Access Control
- **Google OAuth** via better-auth
- **Public access** — Everyone can browse problems and view descriptions
- **Authenticated access** — Sign in to submit code and view submissions
- **Admin access** — Full CRUD on questions + test case upload

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| MongoDB | Local or Atlas |
| AWS Account | S3 bucket for test cases |

---

## 1. Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add the following:
   - **Authorized JavaScript origins:** `http://localhost:5173`
   - **Authorized redirect URIs:** `http://localhost:5000/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret** — you'll need them for the backend `.env`

---

## 2. AWS S3 Setup

1. Create an S3 bucket in your AWS account (e.g., `algojudge-testcases`)
2. Create an IAM user with `AmazonS3FullAccess` (or a scoped policy for your bucket)
3. Copy the **Access Key ID** and **Secret Access Key** — you'll need them for the backend `.env`

---

## 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `backend/.env`:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Express server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/algojudge` |
| `BETTER_AUTH_SECRET` | Random secret ≥ 32 characters | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Backend base URL | `http://localhost:5000` |
| `FRONTEND_URL` | Frontend base URL (for CORS) | `http://localhost:5173` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | `GOCSPX-...` |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | `wJalr...` |
| `AWS_REGION` | AWS region for S3 | `ap-south-1` |
| `AWS_S3_BUCKET` | S3 bucket name | `algojudge-testcases` |

Start the dev server:

```bash
npm run dev
# Server running on http://localhost:5000
```

---

## 4. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Fill in `frontend/.env`:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend base URL | `http://localhost:5000` |

Start the dev server:

```bash
npm run dev
# App running on http://localhost:5173
```

---

## 5. Backend API Routes

### Auth Routes (managed by better-auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/callback/google` | Google OAuth callback |
| POST | `/api/auth/sign-out` | Sign out current session |
| GET | `/api/auth/get-session` | Get current session |
| GET | `/api/auth/session` | Session check |

### Public Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/questions` | List questions (supports `?difficulty=`, `?tags=`, `?search=`) |
| GET | `/api/questions/:id` | Get single question detail |

### Authenticated Routes

| Method | Path | Auth | Description |
|--------|------|:---:|-------------|
| GET | `/api/user/profile` | Yes | User profile |
| POST | `/api/submissions` | Yes | Submit code (`{ questionId, language, code }`) |
| GET | `/api/submissions/me` | Yes | Get user's submissions (supports `?questionId=`) |

### Admin Routes

| Method | Path | Auth | Role | Description |
|--------|------|:---:|------|-------------|
| GET | `/api/admin/stats` | Yes | admin | Platform statistics |
| GET | `/api/admin/me` | Yes | admin | Admin user info |
| POST | `/api/admin/questions` | Yes | admin | Create a new question |
| PUT | `/api/admin/questions/:id` | Yes | admin | Update a question |
| DELETE | `/api/admin/questions/:id` | Yes | admin | Delete a question (+ S3 cleanup) |
| POST | `/api/admin/questions/:id/testcases` | Yes | admin | Upload test cases `.zip` to S3 |

---

## 6. Frontend Routes

| Path | Auth Required | Role | Page |
|------|:---:|------|------|
| `/signin` | No | — | Google sign-in page |
| `/problems` | No | — | Browse all problems (public) |
| `/problems/:id` | No (view) / Yes (submit) | — | Problem detail + code editor |
| `/dashboard` | Yes | `user` or `admin` | User dashboard |
| `/admin` | Yes | `admin` only | Admin dashboard + question management |
| `/` | — | — | Redirects based on role |

---

## 7. Tech Stack

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** better-auth (Google OAuth + admin plugin)
- **File Upload:** Multer (in-memory storage)
- **Cloud Storage:** AWS S3 (`@aws-sdk/client-s3`)

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Routing:** React Router DOM v6
- **Code Editor:** Monaco Editor (`@monaco-editor/react`)
- **Auth Client:** better-auth React client

---

## 8. Middleware

| Middleware | File | Purpose |
|------------|------|---------|
| `requireAuth` | `backend/src/middleware/requireAuth.ts` | Validates session, populates `req.user` |
| `requireRole` | `backend/src/middleware/requireRole.ts` | Checks `req.user.role`, returns 403 if mismatch |

---

## 9. Promoting a User to Admin

Use the better-auth admin client from any admin session:

```ts
// In frontend code (must be called from an existing admin session)
await authClient.admin.setRole({
  userId: "target-user-id",
  role: "admin",
});
```

Or directly via MongoDB — update the `role` field in the `user` collection to `"admin"`.

---

## 10. Project Structure

```
.
├── SETUP.md
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts              MongoDB + Mongoose connection
│   │   │   └── s3.ts              AWS S3 client configuration
│   │   ├── lib/
│   │   │   └── auth.ts            better-auth config (Google + admin plugin)
│   │   ├── middleware/
│   │   │   ├── requireAuth.ts     Session validation
│   │   │   └── requireRole.ts     Role guard
│   │   ├── models/
│   │   │   ├── Question.ts        Question schema (title, description, tags, S3 key)
│   │   │   └── Submission.ts      Submission schema (code, language, status)
│   │   ├── routes/
│   │   │   ├── admin.routes.ts          /api/admin/* (stats, profile, mounts questions)
│   │   │   ├── admin.question.routes.ts /api/admin/questions/* (CRUD + S3 upload)
│   │   │   ├── question.routes.ts       /api/questions/* (public listing + detail)
│   │   │   ├── submission.routes.ts     /api/submissions/* (submit + history)
│   │   │   └── user.routes.ts           /api/user/* (profile)
│   │   ├── types/
│   │   │   └── express.d.ts       req.user type extension
│   │   ├── env.ts                 dotenv + DNS config
│   │   └── index.ts               Entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.tsx          Shared navigation bar
    │   │   └── ui/                shadcn components
    │   ├── lib/
    │   │   ├── api.ts             API client (fetch helpers, typed functions)
    │   │   ├── auth-client.ts     better-auth React client
    │   │   └── utils.ts           cn() helper
    │   ├── pages/
    │   │   ├── SignIn.tsx          Google sign-in page
    │   │   ├── Problems.tsx        Problems list with filtering
    │   │   ├── ProblemDetail.tsx   Problem view + Monaco code editor
    │   │   ├── admin/
    │   │   │   ├── Dashboard.tsx   Admin dashboard with stats + tabs
    │   │   │   └── Questions.tsx   Question CRUD + test case upload
    │   │   └── user/
    │   │       └── Dashboard.tsx   User dashboard
    │   ├── App.tsx                Routes + ProtectedRoute + Navbar
    │   ├── main.tsx               React entry point
    │   └── index.css              Tailwind + design tokens
    ├── index.html
    ├── .env.example
    └── package.json
```

---

## 11. Production Build

### Backend

```bash
cd backend
npm run build   # compiles TypeScript to dist/
npm start       # runs node dist/index.js
```

### Frontend

```bash
cd frontend
npm run build   # outputs to frontend/dist/
npm run preview # local preview of the production build
```

Update your `.env` files with production URLs before building.

---

## 12. Verification / Smoke Tests

After both servers are running:

```bash
# 1. Health check
curl http://localhost:5000/api/health
# Expected: {"status":"ok"}

# 2. List questions (public)
curl http://localhost:5000/api/questions
# Expected: {"questions":[...]}

# 3. Unauthenticated submission (should return 401)
curl -X POST http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{"questionId":"test","language":"cpp","code":"int main(){}"}'
# Expected: {"error":"Unauthorized"}
```

Manual flow:
1. Open `http://localhost:5173` — should show problems list
2. Click a problem — should show description + code editor
3. Try submitting — should show "Sign In to Submit"
4. Sign in with Google → should redirect to dashboard
5. Go to a problem, write code, submit — should show submission status
6. As admin, go to `/admin` → manage questions and upload test cases

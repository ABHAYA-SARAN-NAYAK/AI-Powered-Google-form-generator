<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=AI%20Form%20Generator&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=50" width="100%"/>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini%20AI-Multi--Model-8E75B2?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Google%20Forms%20API-v1-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Google-OAuth%202.0-DB4437?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Made%20with-%E2%9D%A4%EF%B8%8F%20in%20India-FF4081?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Hackathon-2026-6366F1?style=for-the-badge" />
</p>

<br/>

<img width="1774" height="887" alt="AI Form Generator Dashboard" src="https://github.com/user-attachments/assets/dfd09fe9-ba87-4564-8e93-bb723dd2f7e2" />

<br/><br/>

</div>

---

## 👨‍💻 Team Details

<div align="center">

| Field | Details |
|-------|---------|
| 🏷️ **Team Name** | TrioBits |
| 👑 **Team Leader** | Abhaya Saran Nayak |
| 👤 **Team Member** | Mandaleeka Sri Chakradhar |
| 👤 **Team Member** | Pallavi Anand Talawar |
| 🎓 **College** | A.M. Jain College, Chennai |

</div>

---

## 🎯 Problem Statement

Creating structured Google Forms is **slow, repetitive, and drains productivity**. Whether you're a teacher building a quiz, an HR professional running a feedback cycle, or a student organizing an event survey — you spend 20–45 minutes per form doing this manually:

```
❌  Open Google Forms
❌  Add title and description manually
❌  Type every question one by one
❌  Choose question types for each
❌  Add answer options for MCQs
❌  Repeat for every section
❌  Forget to set required fields
❌  Realize you missed a question
❌  Start over
```

**Lost time. Inconsistent quality. Zero intelligence in the process.**

---

## 💡 Solution

**AI Form Generator** eliminates all manual form creation and editing work using AI.

```
✅  Type what you need in plain English (or Tamil or Hindi)
✅  OR upload a photo of your question paper
✅  AI generates every question, type, section, image, and option
✅  Auto-detects form language and translates additions automatically
✅  Edit forms via AI Assistant or manual builder toolbar
✅  One click publishes directly as a real Google Form in your Drive
```

The platform plugs directly into **Google Forms API** using your Google account, creates fully structured forms with correct question types, and gives you a shareable link — all without you touching Google Forms once.

---

## ✨ Features

### 🤖 AI Form Generation
Describe your form in natural language. The AI understands context, selects appropriate question types (MCQ, short answer, rating scale, dropdown), structures sections logically, and creates a complete Google Form in your Google Drive.

### 🔄 Production-Grade AI Key Rotation and Model Fallback
The backend features a robust Gemini API key rotation system with automatic multi-model fallback:
- **Multi-Key Support**: Configure up to 3 Gemini API keys. Empty keys are automatically filtered out.
- **Multi-Model Fallback**: Automatically tries `gemini-2.0-flash` → `gemini-1.5-flash` → `gemini-1.5-pro` for each key.
- **Smart Retry Logic**: On 429 (rate limit), 404 (model not found), or 403 (forbidden) errors, the system silently moves to the next key/model combination.
- **Zero Downtime**: All key and model combinations are exhausted before returning a user-friendly error.

### 📸 MCQ Image OCR Extraction
Photograph any printed question paper or screenshot an existing document. The AI extracts every question, reads answer choices, and converts them into editable form inputs — ready to be pushed to Google Forms.

### 💳 Payment QR Code and Banner Uploads
Automatically detects payment/canteen/fee prompts and provides a required QR code upload section. Uploaded QR images are saved to your Google Drive and embedded directly as the first item in the Google Form.

### 🛠️ Manual Form Builder Toolbar
A powerful sticky toolbar on the Edit Form page allowing you to add 5 distinct element types:
- **+ Question**: Short Answer, Paragraph, MCQ, Checkboxes, Dropdown, Linear Scale, Date, Time
- **+ Section**: Page break headers with title and description
- **+ QR Code**: Embedded payment QR code image
- **+ Banner Image**: Form banner image with custom titles
- **+ Description**: Text blocks

Supports full reordering (move up/down) and delete actions.

### ✨ AI Edit Assistant
Modify existing forms naturally using plain English instructions. Features a real-time diff preview showing:
- `✅ Added` — New questions/sections
- `✏️ Modified` — Title, type, required status, or option updates
- `❌ Removed` — Items removed from the form

Review changes with **Confirm and Save** or **Discard** options.

### 🌐 Auto Language Detection and Translation
- **On-Load Detection**: Automatically scans existing form items to detect the primary language.
- **Form Language Badge**: Interactive badge with a target language override dropdown.
- **AI Language Alignment**: Ensures AI edits match the target language.
- **Translation Preview Modal**: When saving a non-English form, new/edited items are translated on-the-fly.

### 🔮 AI-Powered Adaptive Form Optimization Engine
Automated AI UX expert that analyzes forms after generation or on-demand:
- **Comprehensive UX Analysis**: Evaluates Question Clarity, Cognitive Load, Logical Flow, Audience Suitability, and Completion Likelihood.
- **Form Quality Score**: Circular animated progress meter (0–100) color-coded for instant feedback.
- **Severity-Badged Issues Report**: Categorized list of detected UX flaws with severity badges (🔴 High / 🟡 Medium / 🟢 Low).
- **Interactive Diff Preview**: Structural diff comparing original vs optimized version.
- **Single-Click Application**: Review optimizations and apply them with a single click.

### 🛡️ Smart File Upload Handling and Sanitization
Google Forms API does not support native FILE_UPLOAD questions for most accounts. Backend helpers automatically detect and convert any file/image/document upload question into a clean short text question.

### 📊 Interactive Dashboard and Library
Real-time stats overview with glassmorphic cards. Full form management with Table/Grid views, advanced filters (Type, Audience, Language, Date Range), bulk archiving, CSV exports, and direct Google Form links.

### 🔐 Google OAuth Login
Secure Google sign-in with OAuth 2.0 and JWT session cookies. No passwords stored — your Google account is your identity.

---

## 🛠️ Tech Stack

<div align="center">

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.x | UI Framework |
| Vite | 5.x | Build Tool and Dev Server |
| TailwindCSS | 3.x | Utility-First CSS |
| React Router | v6 | Client-Side Routing |
| Lucide Icons | latest | Icon Library |
| Axios | 1.x | HTTP Client |
| Recharts | 2.x | Charts and Graphs |
| Framer Motion | 10.x | Animations |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20.x | Server Runtime |
| Express | 4.x | REST API Framework |
| Supabase | 2.x | PostgreSQL Database |
| Gemini AI | 2.0-flash / 1.5-flash / 1.5-pro | AI Generation and Translation (auto-fallback) |
| Google APIs | 144.x | Forms and Drive API |
| Multer | 1.x | Multipart Uploads |
| JWT | 9.x | Session Tokens |
| Zod | 3.x | Schema Validation |

</div>

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│                                                                  │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│   │   Login   │  │ Dashboard │  │   Create  │  │   Edit    │  │
│   │   Page    │  │   Page    │  │   Form    │  │   Form    │  │
│   └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  │
│         └──────────────┼──────────────┼───────────────┘        │
│                        │              │                         │
│              ┌─────────▼──────────────▼──────────┐             │
│              │      React Router v6 + AuthContext  │             │
│              └──────────────────┬─────────────────┘             │
│                                 │                               │
│                      ┌──────────▼──────────┐                   │
│                      │  Axios + Vite Proxy  │                   │
│                      └──────────┬──────────┘                   │
└─────────────────────────────────┼───────────────────────────────┘
                                  │ HTTP (port 4028 to 3000)
┌─────────────────────────────────┼───────────────────────────────┐
│              EXPRESS BACKEND (port 3000)                         │
│                                 │                               │
│         ┌───────────────────────▼─────────────────────┐        │
│         │              Route Handlers                  │        │
│         │  /auth/google    /generate-form              │        │
│         │  /forms/:id      /forms/:id/ai-edit          │        │
│         │  /translate      /detect-language            │        │
│         └──────────┬──────────────────┬───────────────┘        │
│                    │                  │                         │
│         ┌──────────▼──────┐  ┌────────▼────────────┐           │
│         │  Gemini AI      │  │  Google Forms/Drive  │           │
│         │  Key Rotation   │  │  API (batchUpdate)   │           │
│         │  Model Fallback │  │                      │           │
│         └─────────────────┘  └──────────┬───────────┘           │
│                                         │                       │
│                              ┌──────────▼──────────┐            │
│                              │      Supabase        │            │
│                              │   (PostgreSQL DB)    │            │
│                              └─────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
ai-powered-google-form-generator/
│
├── FRONTEND/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── ui/
│       │   │   ├── Button.jsx
│       │   │   ├── Header.jsx
│       │   │   ├── Input.jsx
│       │   │   ├── Select.jsx
│       │   │   └── Checkbox.jsx
│       │   ├── AppIcon.jsx
│       │   └── RequireAuth.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/
│       │   ├── login/
│       │   ├── dashboard/
│       │   ├── create-form/
│       │   ├── my-forms/
│       │   ├── edit-form/
│       │   └── profile/
│       ├── services/
│       │   ├── authApi.js
│       │   ├── formGeneratorApi.js
│       │   └── formsApi.js
│       └── App.jsx
│
├── backend/
│   └── src/
│       ├── config/
│       │   └── env.js
│       ├── controllers/
│       │   ├── generateFormController.js
│       │   ├── formsController.js
│       │   └── analyticsController.js
│       ├── middlewares/
│       │   ├── requireUser.js
│       │   ├── rateLimit.js
│       │   └── validate.js
│       ├── routes/
│       │   ├── authRoute.js
│       │   ├── generateFormRoute.js
│       │   └── formsRoute.js
│       ├── services/
│       │   ├── geminiService.js
│       │   ├── googleOAuthService.js
│       │   ├── googleFormsService.js
│       │   ├── userFormsService.js
│       │   └── supabaseClient.js
│       ├── app.js
│       └── server.js
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.x
- npm >= 9.x
- A Google Cloud project with OAuth 2.0 credentials
- A Supabase project
- A Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/ABHAYA-SARAN-NAYAK/ai-powered-google-form-generator.git
cd ai-powered-google-form-generator
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example src/.env
```

Edit `src/.env` with your credentials:

```env
PORT=3000
NODE_ENV=development
FRONTEND_APP_URL=http://localhost:4028

GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/google/callback

GEMINI_API_KEY=your-primary-gemini-api-key
GEMINI_API_KEY_2=your-second-gemini-api-key
GEMINI_API_KEY_3=your-third-gemini-api-key

SESSION_JWT_SECRET=your-random-string-min-32-characters-long
TOKENS_ENCRYPTION_KEY_BASE64=base64-encoded-32-byte-key

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

```bash
npm run dev
```

Backend starts on **http://localhost:3000**

### 3. Setup Frontend

```bash
cd FRONTEND
npm install
npm run dev
```

Frontend starts on **http://localhost:4028**

### 4. Configure Google Cloud Console

1. Go to **APIs and Services → Credentials**
2. Add **Authorized JavaScript origins**: `http://localhost:3000`
3. Add **Authorized redirect URIs**: `http://localhost:3000/auth/google/callback`
4. Enable: Google Forms API, Google Drive API, Google People API

### 5. Open the App

Visit **http://localhost:4028** → Click **Continue with Google** → Start generating forms!

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/google` | Start Google OAuth login flow |
| `GET` | `/auth/google/callback` | OAuth callback handler |
| `GET` | `/me` | Get current authenticated user |
| `POST` | `/logout` | Clear session cookie |

### Form Generation and OCR

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/generate-form` | Generate form from AI prompt |
| `POST` | `/extract-from-images` | Extract questions from OCR images |

### Forms Management and AI Editing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/forms` | List user's forms |
| `GET` | `/forms/:id` | Get specific form details |
| `PUT` | `/forms/:id` | Update form |
| `DELETE` | `/forms/:id` | Delete a form |
| `POST` | `/forms/:id/ai-edit` | AI Edit Assistant |
| `POST` | `/forms/:id/optimize` | AI Optimization Engine |
| `POST` | `/translate` | Translate form texts |
| `POST` | `/detect-language` | Detect form language |

---

## 🔐 Security Measures

| Measure | Implementation |
|---------|---------------|
| Authentication | Google OAuth 2.0 — no passwords stored |
| Authorization | JWT tokens in HttpOnly cookies |
| API Keys | Server-side only — never exposed to frontend |
| Input Validation | Zod schema validation on all inputs |
| CORS | Restricted to whitelisted frontend origin |
| Rate Limiting | Express rate-limiter on all AI endpoints |

---

## 🚢 Deployment

### Production Build

```bash
cd backend
npm run build
npm start
```

### Docker

```bash
cd backend
docker build -t ai-form-generator .
docker run -p 3000:3000 --env-file src/.env ai-form-generator
```

---

## 🔭 Future Scope

- Response Analytics Dashboard — charts per form
- Fake Response Detection — AI trust score per respondent
- Form Autopsy — diagnose why a form has low completion rate
- Team Collaboration — shared form workspaces
- Webhook triggers on form response events

---

## 📜 License

This project is licensed under the **MIT License**.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer" width="100%"/>

**Built with ❤️ by Team TrioBits — A.M. Jain College, Chennai**

</div>
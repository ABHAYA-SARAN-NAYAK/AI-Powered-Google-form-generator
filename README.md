<div align="center">

<!-- ANIMATED BANNER -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=AI%20Form%20Generator&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=50" width="100%"/>


<!-- BADGES ROW 1 -->
<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini%20AI-Multi--Model-8E75B2?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
</p>

<!-- BADGES ROW 2 -->
<p align="center">
  <img src="https://img.shields.io/badge/Google%20Forms%20API-v1-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Google-OAuth%202.0-DB4437?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Made%20with-❤️%20in%20India-FF4081?style=for-the-badge" />
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

**AI Form Generator** eliminates all manual form creation & editing work using AI.

```
✅  Type what you need in plain English (or Tamil or Hindi)
✅  OR upload a photo of your question paper
✅  AI generates every question, type, section, image, and option
✅  Auto-detects form language & translates additions automatically
✅  Edit forms via AI Assistant or manual builder toolbar
✅  One click publishes directly as a real Google Form in your Drive
```

The platform plugs directly into **Google Forms API** using your Google account, creates fully structured forms with correct question types, and gives you a shareable link — all without you touching Google Forms once.

---

## ✨ Features

### 🤖 AI Form Generation
Describe your form in natural language. The AI understands context, selects appropriate question types (MCQ, short answer, rating scale, dropdown), structures sections logically, and creates a complete Google Form in your Google Drive.

### 🔄 Production-Grade AI Key Rotation & Model Fallback
The backend features a robust Gemini API key rotation system with automatic multi-model fallback:
- **Multi-Key Support**: Configure up to 3 Gemini API keys (`GEMINI_API_KEY`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`). Empty keys are automatically filtered out.
- **Multi-Model Fallback**: Automatically tries `gemini-2.0-flash` → `gemini-1.5-flash` → `gemini-1.5-pro` for each key.
- **Smart Retry Logic**: On 429 (rate limit), 404 (model not found), or 403 (forbidden) errors, the system silently moves to the next key/model combination.
- **Timeout & Network Resilience**: Handles request timeouts and network failures gracefully, continuing to the next combination.
- **Zero Downtime**: All key×model combinations are exhausted before returning a user-friendly 503 error.

### 📸 MCQ Image OCR Extraction
Photograph any printed question paper or screenshot an existing document. The AI extracts every question, reads answer choices, and converts them into editable form inputs — ready to be pushed to Google Forms.

### 💳 Payment QR Code & Banner Uploads
Automatically detects payment/canteen/fee prompts and provides a required QR code upload section. Uploaded QR images are saved to your Google Drive and embedded directly as the first item (`index: 0`) in the Google Form.

### 🛠️ Manual Form Builder Toolbar
A powerful sticky toolbar on the Edit Form page allowing you to add 5 distinct element types:
- **+ Question**: Short Answer, Paragraph, MCQ, Checkboxes, Dropdown, Linear Scale, Date, Time
- **+ Section**: Page break headers with title & description
- **+ QR Code**: Embedded payment QR code image
- **+ Banner Image**: Form banner image with custom titles
- **+ Description**: Text blocks (`textItem`)
Supports full reordering (move up/down) and delete actions.

### ✨ AI Edit Assistant
Modify existing forms naturally using plain English instructions. Features a real-time diff preview showing:
- `✅ Added`: New questions/sections
- `✏️ Modified`: Title, type, required status, or option updates
- `❌ Removed`: Items removed from the form
Review changes with **Confirm & Save** or **Discard** options.

### 🌐 Auto Language Detection & Translation
- **On-Load Detection**: Automatically scans existing form items to detect the primary language (Hindi, Tamil, French, Spanish, Arabic, German, etc.).
- **Form Language Badge**: Interactive badge with a target language override dropdown.
- **AI Language Alignment**: Ensures AI edits match the target language.
- **Translation Preview Modal**: When saving a non-English form, new/edited items are translated on-the-fly with an interactive preview modal where you can edit translations or confirm save.

### 🔮 AI-Powered Adaptive Form Optimization Engine
Automated AI UX expert that analyzes forms after generation or on-demand from the Edit Form page:
- **Comprehensive UX Analysis**: Evaluates Question Clarity, Cognitive Load & length, Logical Flow, Audience Suitability, and Completion Likelihood.
- **Form Quality Score**: Circular animated progress meter (0–100) color-coded for instant feedback (Emerald >80, Amber 60–80, Rose <60).
- **Severity-Badged Issues Report**: Categorized list of detected UX flaws with severity badges (🔴 High / 🟡 Medium / 🟢 Low) and actionable AI fix suggestions.
- **Interactive Diff Preview**: Structural diff (Added, Modified, Removed items) comparing original vs optimized version.
- **Single-Click Application**: Review optimizations and apply them to your Google Form with a single click.

### 🛡️ Smart File Upload Handling & Sanitization
Google Forms API does not support native `FILE_UPLOAD` questions for most accounts. Shared backend helpers (`formHelpers.js`) automatically detect and convert any file/image/document upload question request into a clean `short_text` question requesting Google Drive / Photos shareable links with clear instructions.

### 📊 Interactive Dashboard & Library
Real-time stats overview with glassmorphic cards. Full form management with Table/Grid views, advanced filters (Type, Audience, Language, Date Range), bulk archiving, CSV exports, and direct Google Form links.

### 🔐 Google OAuth Login
Secure Google sign-in with OAuth 2.0 and JWT session cookies. No passwords stored — your Google account is your identity.

---

## 🛠️ Tech Stack

<div align="center">

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| ![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black&style=flat-square) | 18.x | UI Framework |
| ![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white&style=flat-square) | 5.x | Build Tool & Dev Server |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square) | 3.x | Utility-First CSS |
| ![React Router](https://img.shields.io/badge/React%20Router-v6-CA4245?logo=reactrouter&logoColor=white&style=flat-square) | v6 | Client-Side Routing |
| ![Lucide](https://img.shields.io/badge/Lucide%20Icons-latest-F97316?style=flat-square) | latest | Icon Library |
| ![Axios](https://img.shields.io/badge/Axios-1.x-5A29E4?style=flat-square) | 1.x | HTTP Client |
| ![Recharts](https://img.shields.io/badge/Recharts-2.x-22C55E?style=flat-square) | 2.x | Charts & Graphs |
| ![Framer Motion](https://img.shields.io/badge/Framer%20Motion-10.x-E91E63?style=flat-square) | 10.x | Animations |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| ![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=nodedotjs&logoColor=white&style=flat-square) | 20.x | Server Runtime |
| ![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white&style=flat-square) | 4.x | REST API Framework |
| ![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?logo=supabase&logoColor=white&style=flat-square) | 2.x | PostgreSQL Database |
| ![Gemini AI](https://img.shields.io/badge/Gemini-Multi--Model-8E75B2?logo=google&logoColor=white&style=flat-square) | 2.0-flash / 1.5-flash / 1.5-pro | AI Generation & Translation (auto-fallback) |
| ![Google APIs](https://img.shields.io/badge/Google%20APIs-144.x-4285F4?logo=google&logoColor=white&style=flat-square) | 144.x | Forms & Drive API |
| ![Multer](https://img.shields.io/badge/Multer-1.x-EE5A24?style=flat-square) | 1.x | Multipart Uploads |
| ![JWT](https://img.shields.io/badge/JWT-9.x-000000?logo=jsonwebtokens&logoColor=white&style=flat-square) | 9.x | Session Tokens |
| ![Zod](https://img.shields.io/badge/Zod-3.x-3E67B1?style=flat-square) | 3.x | Schema Validation |

</div>

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                               USER BROWSER                                    │
│                                                                                │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   ┌───────────┐ │
│   │   Login      │    │  Dashboard   │    │ Create Form  │   │ Edit Form │ │
│   │   Page       │    │    Page      │    │  (QR Upload) │   │ (AI Assistant│
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘   └─────┬─────┘ │
│          │                   │                   │                 │         │
│          └───────────────────┼───────────────────┼─────────────────┘         │
│                              │                   │                            │
│                    ┌─────────▼───────────────────▼──────────┐                │
│                    │         React Router v6                │                │
│                    │       + AuthContext (JWT)               │                │
│                    └─────────────────┬──────────────────────┘                │
│                                      │                                        │
│                            ┌─────────▼──────────┐                            │
│                            │   Axios + Vite      │                            │
│                            │   Proxy (/api →)    │                            │
│                            └─────────┬──────────┘                            │
└──────────────────────────────────────┼───────────────────────────────────────┘
                                       │ HTTP Multipart/JSON (port 4028 → 3000)
┌──────────────────────────────────────┼───────────────────────────────────────┐
│                          EXPRESS BACKEND (port 3000)                           │
│                                      │                                        │
│    ┌─────────────┐    ┌──────────────▼──────────────┐    ┌────────────────┐ │
│    │  Helmet      │    │       Route Handlers        │    │  Cookie Parser │ │
│    │  CORS        │───▶│                             │◀──│  Rate Limiter  │ │
│    │  Security    │    │  /auth/google               │    │  Session JWT   │ │
│    └─────────────┘    │  /generate-form (Multipart)  │    └────────────────┘ │
│                        │  /forms/:id     (PUT/GET)   │                       │
│                        │  /forms/:id/ai-edit (AI)    │                       │
│                        │  /translate     (Gemini)    │                       │
│                        │  /detect-language (Gemini)  │                       │
│                        └───────┬─────────┬───────────┘                       │
│                                │         │                                   │
│               ┌────────────────▼──┐  ┌───▼────────────────┐                  │
│               │ Gemini AI Service │  │ Google Forms/Drive │                  │
│               │ Key Rotation +    │  │ API (batchUpdate)  │                  │
│               │ Model Fallback    │  │                    │                  │
│               │ (2.0/1.5-flash/   │  │                    │                  │
│               │  1.5-pro)         │  │                    │                  │
│               └───────────────────┘  └───────┬────────────┘                  │
│                                              │                                │
│                                    ┌─────────▼──────────┐                    │
│                                    │     Supabase       │                    │
│                                    │  (PostgreSQL DB)   │                    │
│                                    └────────────────────┘                    │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
stathama/
├── FRONTEND/                      # React Frontend (Vite)
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.jsx     # Reusable button component
│   │   │   │   ├── Header.jsx     # Global navigation header
│   │   │   │   ├── Input.jsx      # Styled input component
│   │   │   │   ├── Select.jsx     # Custom select dropdown
│   │   │   │   └── Checkbox.jsx   # Styled checkbox
│   │   │   ├── AppIcon.jsx        # Lucide icon wrapper
│   │   │   └── RequireAuth.jsx    # Auth route guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Authentication context
│   │   ├── pages/
│   │   │   ├── login/             # Google OAuth login page
│   │   │   ├── dashboard/         # Main dashboard & metrics
│   │   │   ├── create-form/       # Form creation & QR upload wizard
│   │   │   ├── my-forms/          # Forms library & management
│   │   │   ├── edit-form/         # Form editor, AI Assistant, Language Toolbar
│   │   │   └── profile/           # User profile & settings
│   │   ├── services/
│   │   │   ├── authApi.js         # OAuth login, logout, getMe
│   │   │   ├── formGeneratorApi.js # Axios instance & multipart API calls
│   │   │   └── formsApi.js        # Form CRUD, AI Edit, Translation API
│   │   └── App.jsx
│   ├── vite.config.mjs            # Vite config with /api proxy
│   └── package.json
│
├── backend/                       # Node.js Backend (Express)
│   ├── src/
│   │   ├── config/
│   │   │   └── env.js             # Zod-validated environment variables
│   │   ├── controllers/
│   │   │   ├── generateFormController.js   # AI form & Drive QR generation
│   │   │   ├── formsController.js          # Forms CRUD
│   │   │   └── analyticsController.js      # Form metrics & response stats
│   │   ├── middlewares/
│   │   │   ├── requireUser.js     # JWT session authentication
│   │   │   ├── rateLimit.js       # Rate limiting middleware
│   │   │   └── validate.js        # Zod schema validator
│   │   ├── routes/
│   │   │   ├── authRoute.js       # OAuth + session endpoints
│   │   │   ├── generateFormRoute.js # Multipart POST /generate-form
│   │   │   └── formsRoute.js      # Forms CRUD, AI Edit, Translate routes
│   │   ├── services/
│   │   │   ├── geminiService.js         # Gemini AI with key rotation & model fallback
│   │   │   ├── googleOAuthService.js    # Google OAuth2 client & token refresh
│   │   │   ├── googleFormsService.js    # Google Forms API batchUpdate
│   │   │   ├── userFormsService.js      # Form sync, Drive upload & item builder
│   │   │   └── supabaseClient.js        # Supabase client init
│   │   ├── app.js                 # Express app setup
│   │   └── server.js              # Server entry point
│   ├── Dockerfile
│   └── package.json
│
└── README.md                      # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.x ([Download](https://nodejs.org/))
- **npm** ≥ 9.x (comes with Node.js)
- A **Google Cloud** project with OAuth 2.0 credentials
- A **Supabase** project
- A **Google Gemini** API key

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-form-generator.git
cd ai-form-generator
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example src/.env
```

Edit `src/.env` with your credentials:

```env
# ── Server ──
PORT=3000
NODE_ENV=development

# ── Frontend ──
FRONTEND_APP_URL=http://localhost:4028

# ── Google OAuth 2.0 ──
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/google/callback

# ── Google Gemini AI (Key Rotation — up to 3 keys) ──
GEMINI_API_KEY=your-primary-gemini-api-key
GEMINI_API_KEY_2=                              # Optional: second key for rotation
GEMINI_API_KEY_3=                              # Optional: third key for rotation

# ── Session & Encryption ──
SESSION_JWT_SECRET=your-random-string-min-32-characters-long
TOKENS_ENCRYPTION_KEY_BASE64=base64-encoded-32-byte-key

# ── Supabase ──
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Start the backend:

```bash
npm run dev
```

The backend will start on **http://localhost:3000**.

### 3. Setup Frontend

Open a **new terminal**:

```bash
cd FRONTEND

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will start on **http://localhost:4028**.

### 4. Configure Google Cloud Console

In your [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Go to **APIs & Services → Credentials**
2. Click your **OAuth 2.0 Client ID**
3. Add **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   ```
4. Add **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/google/callback
   ```
5. Enable these APIs:
   - Google Forms API
   - Google Drive API
   - Google People API

### 5. Open the App

Visit **http://localhost:4028** → Click **"Continue with Google"** → Start generating forms! 🎉

---

## 📡 API Endpoints Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/google` | Start Google OAuth login flow |
| `GET` | `/auth/google/callback` | OAuth callback (sets session cookie) |
| `GET` | `/me` | Get current authenticated user |
| `POST` | `/logout` | Clear session cookie |

### Form Generation & OCR

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/generate-form` | Multipart endpoint: Generate form + upload payment QR |
| `POST` | `/extract-from-images` | Extract questions from uploaded OCR images |

### Forms Management & AI Editing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/forms` | List user's forms |
| `GET` | `/forms/:id` | Get specific form details |
| `PUT` | `/forms/:id` | Update form (multipart support for images) |
| `DELETE` | `/forms/:id` | Delete a form |
| `POST` | `/forms/:id/ai-edit` | AI Edit Assistant — modify form using natural language |
| `POST` | `/forms/:id/optimize` | AI Optimization Engine — analyze form UX score, issues & optimize structure |
| `POST` | `/translate` | Translate array of form texts into target language |
| `POST` | `/detect-language` | Detect form's primary language from text samples |

---

## 🚢 Deployment

### Production Build

```bash
cd backend
npm run build
npm start
```

Builds the React frontend into `FRONTEND/build/` and serves it directly from Express on port 3000.

### Docker Build

```bash
cd backend
docker build -t ai-form-generator .
docker run -p 3000:3000 --env-file src/.env ai-form-generator
```

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](backend/LICENSE) file for details.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&amp;color=gradient&amp;customColorList=6,11,20&amp;height=100&amp;section=footer" width="100%"/>


**Built with ❤️ by Team TrioBits**

</div>

#   a i - p o w e r e d - g o o g l e - f o r m - g e n e r a t o r  
 
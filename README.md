<div align="center">

# 🌿 Viatris Health

### *Healthcare that grows with you*

A full-stack healthcare platform enabling no-signup OTP appointment booking, role-based dashboards for Doctors and NGOs, AI-powered health assistance with a 4-provider fallback chain, digital prescriptions, medical report management, and NGO financial aid integration.

![Node.js](https://img.shields.io/badge/Node.js-v24-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-4.18-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Project Structure](#-project-structure) · [Security](#-security)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏥 **No-Signup Booking** | Patients book appointments without creating an account — just name, phone and address |
| 🔐 **Dual-Channel OTP** | 6-digit OTP delivered via Resend (email) and Fast2SMS (SMS) simultaneously — 10-minute expiry |
| 🔁 **Resend OTP** | 30-second countdown timer with resend option on the OTP screen |
| 👨‍⚕️ **Doctor Dashboard** | Manage appointments, write prescriptions, set Google Meet links, view patient reports |
| 🤝 **NGO Dashboard** | View and manage patient financial aid requests with status tracking |
| 🏥 **Patient Portal** | Look up appointments by phone number, join video consultations, upload and manage medical reports |
| 📹 **Video Consultation** | Google Meet integration — doctor sets link, patient joins with one click |
| 💊 **Digital Prescriptions** | Doctors write structured prescriptions with diagnosis, medications, dosage and follow-up |
| 📁 **Report Management** | Patients upload, rename and delete their own medical reports (X-rays, lab results) |
| 🤖 **AI Health Chatbot** | Floating AI assistant with 4-provider fallback — Groq → OpenRouter → Gemini → Cohere |
| 🌐 **Bilingual UI** | Full English / Hindi language toggle throughout the platform |
| ⏰ **Appointment Reminders** | Browser push notifications 1 hour before appointments |
| 🔒 **Session Security** | Auto-logout after 30 minutes of inactivity on all dashboards |
| 🛡️ **JWT Authentication** | Stateless auth with 7-day token expiry for Doctors and NGOs |

---

## 🛠 Tech Stack

### Backend
- **Node.js v24** + **Express.js 4.18** — REST API server
- **MongoDB 8.x** + **Mongoose 8.0.3** — NoSQL database with schema validation
- **JWT (jsonwebtoken 9.0.3)** — Stateless authentication, 7-day expiry
- **bcryptjs 2.4.3** — Password hashing with 10 salt rounds
- **Multer 1.4.5** — File upload handling (profile photos, reports)
- **Helmet.js 7.1.0** — HTTP security headers (CSP, X-Frame-Options, HSTS)
- **express-rate-limit 8.4.1** — OTP brute-force prevention (5 attempts / 15 min)
- **express-validator 7.0.1** — Input sanitization and validation
- **Socket.IO 4.8.3** — Real-time notifications (ready for production)
- **Nodemon 3.1.14** — Development auto-restart

### Frontend
- **Next.js 14.0.4** — React framework with App Router and SSR
- **React 18.2.0** — UI with hooks (`useState`, `useEffect`, `useRef`)
- **Tailwind CSS 3.3.6** — Utility-first responsive styling
- **Axios 1.6.2** — HTTP client for API communication
- **Google Fonts** — DM Serif Display + DM Sans

### AI Providers (4-provider fallback chain)
| Priority | Provider | Model |
|---|---|---|
| 1st (Primary) | **Groq** | llama-3.3-70b-versatile |
| 2nd (Fallback) | **OpenRouter** | google/gemma-4-26b-a4b-it |
| 3rd (Fallback) | **Google Gemini** | gemini-2.0-flash |
| 4th (Fallback) | **Cohere** | command-r-08-2024 |

If all 4 providers fail, a local rule-based symptom matcher is used as the final fallback.

### OTP Delivery
- **Resend** — Branded HTML email OTP
- **Fast2SMS** — SMS OTP for Indian phone numbers

Both channels are non-fatal — booking continues even if one channel fails.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on port `27017`
- API keys for Groq, Resend, Fast2SMS (see Environment Variables below)
- Two terminal windows

### Installation & Setup

**1. Clone the repository**
```bash
git clone https://github.com/dhriti16sharma/VIATRIS.git
cd VIATRIS
```

**2. Set up the backend**
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory using `.env.example` as reference:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/healthcare
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3001
SESSION_TIMEOUT=1800000
UPLOAD_DIR=uploads

# AI Providers (4-provider fallback chain)
GROQ_API_KEY=your_groq_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
COHERE_API_KEY=your_cohere_api_key_here

# OTP Delivery
RESEND_API_KEY=your_resend_api_key_here
FAST2SMS_API_KEY=your_fast2sms_api_key_here
```

**3. Set up the frontend**
```bash
cd ../frontend
npm install
```

### Running the Application

You need **two terminals running simultaneously**:

**Terminal 1 — Backend**
```bash
cd backend
npm run dev
```
Expected output:
```
[AIService] Loaded providers: groq → openrouter → gemini → cohere
Server running on port 5000
MongoDB Connected: localhost
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```
Expected output:
```
▲ Next.js 14.0.4
- Local: http://localhost:3001
✓ Ready in 2.4s
```

Open **http://localhost:3001** in your browser.

---

## 📁 Project Structure

```
VIATRIS/
│
├── backend/
│   ├── Data/                        # JSON medical datasets
│   │   ├── DiseaseAndSymptoms.json
│   │   ├── Disease_Description.json
│   │   ├── Doctor_Specialist.json
│   │   └── Symptom_Weights.json
│   ├── src/
│   │   ├── ai/
│   │   │   └── medicalAI.js         # Local disease prediction engine
│   │   ├── config/
│   │   │   └── database.js          # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── publicController.js  # Booking, OTP, public APIs
│   │   │   ├── tokenController.js   # Appointment CRUD
│   │   │   ├── authController.js    # Login, register
│   │   │   ├── chatbotController.js # AI chatbot handler
│   │   │   ├── aiController.js      # AI analysis endpoints
│   │   │   ├── doctorController.js  # Doctor management
│   │   │   ├── prescriptionController.js
│   │   │   └── helpRequestController.js
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT protect + authorize
│   │   │   ├── upload.js            # Multer config
│   │   │   └── errorHandler.js
│   │   ├── models/
│   │   │   ├── User.js              # Doctor / NGO schema
│   │   │   ├── Token.js             # Appointment + OTP schema
│   │   │   ├── Prescription.js
│   │   │   ├── HelpRequest.js
│   │   │   ├── Availability.js      # Doctor time slots
│   │   │   └── Appointment.js
│   │   ├── routes/
│   │   │   ├── auth.js              # /api/auth/*
│   │   │   ├── public.js            # /api/public/*
│   │   │   ├── tokens.js            # /api/tokens/*
│   │   │   ├── prescriptions.js     # /api/prescriptions/*
│   │   │   ├── helpRequests.js      # /api/help-requests/*
│   │   │   ├── doctors.js           # /api/doctors/*
│   │   │   ├── appointments.js      # /api/appointments/*
│   │   │   ├── ai.js                # /api/ai/*
│   │   │   └── chatbot.js           # /api/chatbot/*
│   │   ├── services/
│   │   │   ├── otpService.js        # OTP generation, Resend + Fast2SMS
│   │   │   ├── aiService.js         # 4-provider AI fallback chain
│   │   │   └── chatbotService.js    # Chatbot logic
│   │   └── server.js                # Entry point
│   ├── .env.example                 # Environment variable template
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── page.jsx                 # Landing page + booking form
│   │   ├── doctor/
│   │   │   └── dashboard/
│   │   │       └── page.jsx         # Doctor dashboard
│   │   ├── patient/
│   │   │   └── dashboard/
│   │   │       └── page.jsx         # Patient portal
│   │   ├── ngo/
│   │   │   └── dashboard/
│   │   │       └── page.jsx         # NGO dashboard
│   │   ├── globals.css
│   │   └── layout.jsx
│   ├── components/
│   │   └── AIChatbot.jsx            # Floating AI chat widget
│   ├── lib/
│   │   ├── api.js                   # Axios instance + interceptors
│   │   └── sessionManager.js        # 30-min inactivity timeout
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🗄 Database Schema

### `users` collection
```js
{
  name: String,
  email: String,              // Unique, lowercase
  password: String,           // bcrypt hashed (select: false)
  phone: String,
  role: 'doctor' | 'ngo' | 'admin',
  specialization: String,     // Doctor only
  experience: Number,         // Doctor only, years
  profileImage: String,
  createdAt: Date
}
```

### `tokens` collection (appointments)
```js
{
  tokenNumber: Number,        // Sequential, unique
  patient: {
    name: String,
    phone: String,
    address: String,
    email: String
  },
  doctor: ObjectId,           // ref: User
  specialization: String,
  appointmentDate: String,
  otp: String,                // select: false — never returned in queries
  otpExpiry: Date,
  otpVerified: Boolean,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  notes: String,
  meetLink: String,           // Google Meet URL set by doctor
  createdAt: Date
}
```

### `helprequests` collection
```js
{
  name: String,
  phone: String,
  email: String,
  helpType: 'financial' | 'medicine' | 'transport' | 'mental_health' | 'general',
  message: String,
  status: 'pending' | 'in_review' | 'resolved',
  createdAt: Date
}
```

---

## 📡 API Reference

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register doctor or NGO |
| `POST` | `/api/auth/login` | Login → returns JWT |
| `GET` | `/api/auth/me` | Get current user profile |
| `POST` | `/api/public/book-appointment` | Book appointment (no account needed) |
| `POST` | `/api/public/verify-otp` | Confirm appointment with OTP |
| `POST` | `/api/public/resend-otp` | Resend OTP with fresh 10-min expiry |
| `GET` | `/api/public/doctors` | List doctors (filter by specialization) |
| `GET` | `/api/public/appointments` | Get patient appointments by phone |
| `POST` | `/api/help-requests` | Submit NGO help request (public) |
| `GET` | `/api/health` | Server health check |

### Protected Endpoints (JWT Required)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/tokens` | Doctor | Get all appointments |
| `PUT` | `/api/tokens/:id` | Doctor | Update appointment (status, notes, meetLink) |
| `DELETE` | `/api/tokens/:id` | Doctor | Delete appointment |
| `GET` | `/api/prescriptions` | Doctor | Get prescriptions |
| `POST` | `/api/prescriptions` | Doctor | Create prescription |
| `DELETE` | `/api/prescriptions/:id` | Doctor | Delete prescription |
| `GET` | `/api/help-requests` | NGO | Get all help requests |
| `PUT` | `/api/help-requests/:id` | NGO | Update help request status |
| `GET` | `/api/help-requests/my` | Patient | Get own help requests |
| `GET` | `/api/availabilities` | Any | Get doctor availability |
| `POST` | `/api/availabilities` | Doctor | Set availability slots |
| `POST` | `/api/chatbot/message` | Any | Send message to AI chatbot |
| `POST` | `/api/ai/analyze-symptoms` | Any | Analyze symptoms via AI |

### Example: Book Appointment
```bash
POST /api/public/book-appointment
Content-Type: application/json

{
  "patientName": "Dhriti Sharma",
  "phone": "+91 9560214848",
  "address": "D 52 RPS City, Sector 88",
  "email": "dhriti@email.com",
  "specialization": "Dermatologist",
  "doctorId": "676b4f825945f756981f6d99",
  "appointmentDate": "2026-05-15"
}

Response:
{
  "success": true,
  "data": { "tokenNumber": 3 }
}
```

### Example: AI Chatbot
```bash
POST /api/chatbot/message
Content-Type: application/json

{
  "message": "I have a fever and headache",
  "history": []
}

Response:
{
  "message": "Based on your symptoms...",
  "role": "assistant"
}
```

---

## 🔒 Security

| Feature | Implementation |
|---|---|
| **Password Hashing** | bcryptjs with 10 salt rounds via Mongoose `pre('save')` hook |
| **JWT Auth** | HS256 signed tokens, 7-day expiry, stored in `localStorage` |
| **OTP Security** | `select: false` in schema — never returned in normal queries |
| **OTP Rate Limiting** | Max 5 attempts per 15 minutes per IP via express-rate-limit |
| **CORS** | Whitelist: localhost:3000, 3001, 3002 only |
| **HTTP Headers** | Helmet.js sets CSP, X-XSS-Protection, X-Frame-Options, HSTS |
| **Input Validation** | express-validator sanitizes all inputs before database queries |
| **Session Timeout** | 30-minute inactivity auto-logout with event listener cleanup |
| **Role-Based Access** | `authorize()` middleware checks `req.user.role` before route access |
| **Env Variables** | All secrets in `.env` (git-ignored) — never hardcoded |

---

## 🧭 User Flows

### Patient Booking Flow
```
Homepage → Select Specialization → Choose Doctor → Fill Details
    → POST /api/public/book-appointment
    → OTP sent via Resend (email) + Fast2SMS (SMS)
    → Enter OTP → POST /api/public/verify-otp
    → Appointment CONFIRMED ✅
    → Session stored in sessionStorage (2-hour expiry)
```

### Doctor Login Flow
```
Click "Doctor/NGO Login" → Enter email + password
    → POST /api/auth/login
    → JWT stored in localStorage
    → Redirect to /doctor/dashboard
    → Tabs: Appointments | Write Prescription | Patient Reports
```

### Patient Portal Flow
```
Click "Patient Portal" → Enter phone number → OTP verify
    → View appointments, prescriptions, medical reports
    → Upload / delete medical reports
    → Submit NGO help request
    → Join video consultation via Google Meet link
```

### NGO Help Flow
```
Patient submits help request (home page or patient portal)
    → Saved to helprequests collection
    → NGO logs in → sees all pending requests
    → Updates status: Pending → In Review → Resolved
    → Patient sees updated status in portal
```

---

## 🖥 Pages & Routes

| URL | Page | Access |
|-----|------|--------|
| `/` | Landing page + booking form | Public |
| `/patient/dashboard` | Patient portal | OTP verified |
| `/doctor/dashboard` | Doctor dashboard | JWT protected |
| `/ngo/dashboard` | NGO dashboard | JWT protected |

---

## 🌱 Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your values:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/healthcare

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# CORS
CLIENT_URL=http://localhost:3001

# Session (ms) — 30 minutes
SESSION_TIMEOUT=1800000

# Uploads
UPLOAD_DIR=uploads

# AI Providers (4-provider fallback chain)
GROQ_API_KEY=your_groq_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
COHERE_API_KEY=your_cohere_api_key_here

# OTP Delivery
RESEND_API_KEY=your_resend_api_key_here
FAST2SMS_API_KEY=your_fast2sms_api_key_here
```

> ⚠️ Never commit your `.env` file. It is listed in `.gitignore`.

---

## 👥 Team

**Group No. 70 — Major Project II (18B19CI791) | AY 2025–26**

**Jaypee University of Information Technology, Waknaghat**
Department of Computer Science & Engineering and Information Technology

| Member | Roll No. |
|--------|----------|
| Dhriti Sharma | 221030092 |
| Raghav Singh Thakur | 221030280 |
| Ujjwal Chauhan | 221030417 |

**Supervisor:** Mr. Gaurav Negi — Assistant Professor (Grade-I)

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

Built with 💚 using Node.js • Express • MongoDB • Next.js • React

*Viatris Health — Healthcare that grows with you*

**GitHub:** https://github.com/dhriti16sharma/VIATRIS.git

</div>

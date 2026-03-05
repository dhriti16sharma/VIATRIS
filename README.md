<div align="center">

# 🌿 Viatris Health

### *Healthcare that grows with you*

A full-stack healthcare platform enabling no-signup appointment booking, OTP verification, role-based dashboards for doctors and NGOs, AI-powered health assistance, and video consultations via Google Meet.

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-4.18-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Project Structure](#-project-structure) · [Screenshots](#-screenshots)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏥 **No-Signup Booking** | Patients book appointments without creating an account — just name, phone & address |
| 🔐 **OTP Verification** | 6-digit OTP confirms appointments with 10-minute expiry |
| 👨‍⚕️ **Doctor Dashboard** | Manage appointments, write prescriptions, set Google Meet links, view patient reports |
| 🤝 **NGO Dashboard** | View and manage patient financial aid requests |
| 🏥 **Patient Portal** | Look up appointments by phone number, join video consultations, upload medical reports |
| 📹 **Video Consultation** | Google Meet integration — doctor sets link, patient joins with one click |
| 💊 **Digital Prescriptions** | Doctors write structured prescriptions (diagnosis, medications, dosage, follow-up) |
| 📁 **Report Upload** | Patients and doctors upload X-rays, lab reports, and medical images |
| 🤖 **AI Health Chatbot** | Floating AI assistant for symptom analysis and health Q&A |
| 🌐 **Bilingual UI** | Full English / Hindi language toggle throughout the platform |
| ⏰ **Appointment Reminders** | Browser push notifications 1 hour before appointments |
| 🔒 **Session Security** | Auto-logout after 30 minutes of inactivity on all dashboards |
| 🛡️ **JWT Authentication** | Stateless auth with 7-day token expiry for doctors and NGOs |

---

## 🛠 Tech Stack

### Backend
- **Node.js** + **Express.js** — REST API server
- **MongoDB** + **Mongoose** — NoSQL database with schema validation
- **JWT (jsonwebtoken)** — Stateless authentication
- **bcryptjs** — Password hashing with salt rounds
- **Multer** — File upload handling (profile photos, reports)
- **CORS** + **Helmet** — Security middleware
- **Nodemon** — Development auto-restart

### Frontend
- **Next.js 14** — React framework with App Router and SSR
- **React 18** — UI with hooks (`useState`, `useEffect`, `useRef`)
- **Axios** — HTTP client for API communication
- **Google Fonts** — DM Serif Display + DM Sans 
### Database
- **MongoDB** (local) — Collections: `users`, `tokens`, `helprequests`, `prescriptions`, `availabilities`

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on port `27017`
- Two terminal windows

### Installation & Setup

**1. Clone the repository**
```bash
git clone https://github.com/your-username/VIATRIS.git
cd VIATRIS
```

**2. Set up the backend**
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/healthcare
JWT_SECRET=healthcare-secret-key-2024-production-ready
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3001
SESSION_TIMEOUT=1800000
UPLOAD_DIR=uploads
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
✓ Server running on port 5000
✓ All 9 features + AI Chatbot enabled
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
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── publicController.js  # Booking, OTP, public APIs
│   │   │   ├── tokenController.js   # Appointment CRUD
│   │   │   ├── prescriptionController.js
│   │   │   └── helpRequestController.js
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT protect + authorize
│   │   │   ├── upload.js            # Multer config
│   │   │   └── errorHandler.js
│   │   ├── models/
│   │   │   ├── User.js              # Doctor / NGO / Patient schema
│   │   │   ├── Token.js             # Appointment + OTP schema
│   │   │   ├── Prescription.js
│   │   │   └── HelpRequest.js
│   │   ├── routes/
│   │   │   ├── auth.js              # /api/auth/*
│   │   │   ├── public.js            # /api/public/*
│   │   │   ├── tokens.js            # /api/tokens/*
│   │   │   ├── prescriptions.js     # /api/prescriptions/*
│   │   │   └── helpRequests.js      # /api/help-requests/*
│   │   ├── services/
│   │   │   ├── otpService.js        # OTP generation & expiry
│   │   │   └── aiService.js         # AI chatbot integration
│   │   └── server.js                # Entry point
│   ├── uploads/                     # Profile photo storage
│   ├── .env                         # Environment variables (git-ignored)
│   └── package.json
│
└── frontend/
    ├── app/
    │   ├── page.jsx                 # Landing page + booking form
    │   ├── doctor/
    │   │   └── dashboard/
    │   │       └── page.jsx         # Doctor dashboard (3 tabs)
    │   ├── patient/
    │   │   └── dashboard/
    │   │       └── page.jsx         # Patient portal
    │   ├── ngo/
    │   │   └── dashboard/
    │   │       └── page.jsx         # NGO dashboard
    │   ├── globals.css              # Global design styles
    │   └── layout.jsx               # Root layout
    ├── components/
    │   └── AIChatbot.jsx            # Floating AI chat widget
    ├── lib/
    │   ├── api.js                   # Axios instance + interceptors
    │   └── sessionManager.js        # 30-min inactivity timeout
    └── package.json
```

---

## 🗄 Database Schema

### `users` collection
```js
{
  name: String,               // Full name
  email: String,              // Unique, lowercase
  password: String,           // bcrypt hashed (select: false)
  phone: String,
  role: 'doctor' | 'ngo',
  specialization: String,     // Doctor only (required)
  experience: Number,         // Doctor only, years
  ngoName: String,            // NGO only (required)
  profileImage: String,       // Upload path
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
  otp: String,                // select: false — hidden by default
  otpExpiry: Date,
  otpVerified: Boolean,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  notes: String,
  meetLink: String,           // Google Meet URL
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
| `GET` | `/api/public/doctors?specialization=X` | List doctors by specialization |
| `GET` | `/api/public/appointments?phone=X` | Get patient appointments by phone |
| `GET` | `/api/health` | Server health check |

### Protected Endpoints (JWT Required)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/tokens` | Doctor / NGO | Get all appointments |
| `PUT` | `/api/tokens/:id` | Doctor | Update appointment (status, notes, meetLink) |
| `DELETE` | `/api/tokens/:id` | Doctor | Delete appointment |
| `GET` | `/api/prescriptions` | Doctor | Get prescriptions |
| `POST` | `/api/prescriptions` | Doctor | Create prescription |
| `GET` | `/api/help-requests` | NGO | Get all help requests |
| `POST` | `/api/chatbot/message` | Any | AI chatbot message |

### Example: Book Appointment
```bash
POST /api/public/book-appointment
Content-Type: application/json

{
  "patientName": "Dhriti Sharma",
  "phone": "+91 9560214848",
  "address": "New Delhi",
  "email": "dhriti@email.com",
  "specialization": "cardiologist",
  "doctorId": "676b4f825945f756981f6d99",
  "appointmentDate": "2026-03-15"
}

Response:
{
  "success": true,
  "data": { "tokenNumber": 1 }
}
```

### Example: Verify OTP
```bash
POST /api/public/verify-otp
Content-Type: application/json

{
  "tokenNumber": 1,
  "otp": "532551",
  "phone": "+91 9560214848"
}
```

---

## 🔒 Security

| Feature | Implementation |
|---|---|
| **Password Hashing** | bcryptjs with 10 salt rounds via Mongoose `pre('save')` hook |
| **JWT Auth** | HS256 signed tokens, 7-day expiry, stored in `localStorage` |
| **OTP Security** | `select: false` in schema — never returned in normal queries |
| **CORS** | Whitelist of allowed origins (localhost:3000, 3001, 3002) |
| **HTTP Headers** | Helmet.js sets CSP, X-XSS-Protection, X-Frame-Options |
| **Session Timeout** | 30-minute inactivity auto-logout with event listener cleanup |
| **Role-Based Access** | `authorize()` middleware checks `req.user.role` before route access |
| **Env Variables** | All secrets in `.env` (git-ignored) — never hardcoded |

---

## 🧭 User Flows

### Patient Booking Flow
```
Homepage → Select Specialization → Choose Doctor → Fill Details
    → POST /api/public/book-appointment
    → OTP received (console log in dev)
    → Enter OTP → POST /api/public/verify-otp
    → Appointment CONFIRMED ✅
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
Click "Patient Portal" → Enter phone number
    → GET /api/public/appointments?phone=...
    → View all appointments with status
    → Click "Join Meet" → opens Google Meet
    → Set reminder → browser notification 1hr before
```

---

## 🖥️ Pages & Routes

| URL | Page | Access |
|-----|------|--------|
| `/` | Landing page + booking form | Public |
| `/patient/dashboard` | Patient portal | Public (phone lookup) |
| `/doctor/dashboard` | Doctor dashboard | JWT protected |
| `/ngo/dashboard` | NGO dashboard | JWT protected |

---

## 🌱 Environment Variables

```env
# backend/.env

PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/healthcare

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# CORS
CLIENT_URL=http://localhost:3001

# Session (ms)
SESSION_TIMEOUT=1800000

# Uploads
UPLOAD_DIR=uploads
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

Built with 💚 using Node.js • Express • MongoDB • Next.js • React

*VIATRIS Health — Healthcare that grows with you*

</div>

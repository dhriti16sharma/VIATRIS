import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token automatically
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

//////////////////////////////////////////////////////
// AUTH API
//////////////////////////////////////////////////////

export const auth = {
  register: (data) => api.post("/auth/register", data),

  login: (data) => api.post("/auth/login", data),

  getProfile: () => api.get("/auth/me"),

  updateProfile: (data) => api.put("/auth/profile", data),
};

//////////////////////////////////////////////////////
// DOCTOR API
//////////////////////////////////////////////////////

export const doctors = {
  getAll: (params) => api.get("/doctors", { params }),

  getById: (id) => api.get(`/doctors/${id}`),

  searchBySymptoms: (symptoms) =>
    api.post("/doctors/search-by-symptoms", { symptoms }),

  setAvailability: (data) => api.post("/doctors/availability", data),

  getAvailability: () => api.get("/doctors/availability/me"),

  deleteAvailability: (id) =>
    api.delete(`/doctors/availability/${id}`),
};

//////////////////////////////////////////////////////
// APPOINTMENTS API
//////////////////////////////////////////////////////

export const appointments = {

  // PATIENT BOOKING (no login required)
  bookAppointment: (data) => api.post("/appointments", data),

  // DOCTOR DASHBOARD
  getAll: () => api.get("/appointments"),

  getById: (id) => api.get(`/appointments/${id}`),

  update: (id, data) =>
    api.put(`/appointments/${id}`, data),

  cancel: (id, reason) =>
    api.delete(`/appointments/${id}`, {
      data: { reason },
    }),
};

//////////////////////////////////////////////////////
// PRESCRIPTION API
//////////////////////////////////////////////////////

export const prescriptions = {
  create: (data) => api.post("/prescriptions", data),

  getAll: () => api.get("/prescriptions"),

  getById: (id) => api.get(`/prescriptions/${id}`),

  update: (id, data) =>
    api.put(`/prescriptions/${id}`, data),
};

//////////////////////////////////////////////////////
// HELP REQUEST API
//////////////////////////////////////////////////////

export const helpRequests = {
  create: (data) => api.post("/help-requests", data),

  getAll: (params) =>
    api.get("/help-requests", { params }),

  getById: (id) =>
    api.get(`/help-requests/${id}`),

  update: (id, data) =>
    api.put(`/help-requests/${id}`, data),

  getNearby: (distance, longitude, latitude) =>
    api.get(`/help-requests/nearby/${distance}`, {
      params: { longitude, latitude },
    }),
};

//////////////////////////////////////////////////////
// AI CHATBOT API
//////////////////////////////////////////////////////

export const ai = {

  analyzeSymptoms: (symptoms, patientHistory) =>
    api.post("/ai/analyze-symptoms", {
      symptoms,
      patientHistory,
    }),

  chat: (message, conversationHistory) =>
    api.post("/ai/chat", {
      message,
      conversationHistory,
    }),

  getPrescriptionSuggestions: (
    diagnosis,
    patientAge,
    allergies
  ) =>
    api.post("/ai/prescription-suggestions", {
      diagnosis,
      patientAge,
      allergies,
    }),

  analyzeReport: (reportText) =>
    api.post("/ai/analyze-report", {
      reportText,
    }),

  getHealthTips: (category) =>
    api.get(
      `/ai/health-tips${
        category ? `?category=${category}` : ""
      }`
    ),
};

export default api;
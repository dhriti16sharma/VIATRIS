# Healthcare Platform API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "patient",
  
  // For doctors only:
  "specialization": "Cardiologist",
  
  // For NGOs only:
  "ngoName": "Health Aid Foundation"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "64abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User
```http
GET /api/auth/me
```
*Requires authentication*

### Update Profile
```http
PUT /api/auth/profile
```
*Requires authentication*

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

---

## Doctor Endpoints

### Get All Doctors
```http
GET /api/doctors
```

**Query Parameters:**
- `specialization` - Filter by specialization
- `search` - Search by name or specialization

**Example:**
```
GET /api/doctors?specialization=Cardiologist
GET /api/doctors?search=Smith
```

### Get Single Doctor
```http
GET /api/doctors/:id
```

**Response includes availability:**
```json
{
  "success": true,
  "data": {
    "id": "64abc...",
    "name": "Dr. Sarah Johnson",
    "email": "sarah@example.com",
    "specialization": "Cardiologist",
    "experience": 15,
    "rating": 4.8,
    "availability": [
      {
        "day": "Monday",
        "startTime": "09:00",
        "endTime": "17:00"
      }
    ]
  }
}
```

### Search Doctors by Symptoms
```http
POST /api/doctors/search-by-symptoms
```

**Request Body:**
```json
{
  "symptoms": ["fever", "headache", "fatigue"]
}
```

**Response:**
```json
{
  "success": true,
  "matchedSpecializations": ["General Physician", "Internal Medicine"],
  "count": 5,
  "data": [...]
}
```

### Set Doctor Availability
```http
POST /api/doctors/availability
```
*Requires authentication (Doctor only)*

**Request Body:**
```json
{
  "day": "Monday",
  "startTime": "09:00",
  "endTime": "17:00"
}
```

### Get Doctor's Availability
```http
GET /api/doctors/availability/me
```
*Requires authentication (Doctor only)*

### Delete Availability Slot
```http
DELETE /api/doctors/availability/:id
```
*Requires authentication (Doctor only)*

---

## Appointment Endpoints

### Create Appointment
```http
POST /api/appointments
```
*Requires authentication (Patient only)*

**Request Body:**
```json
{
  "doctor": "64abc123...",
  "date": "2024-02-15",
  "time": "10:00",
  "symptoms": ["fever", "cough"],
  "notes": "Persistent cough for 3 days"
}
```

### Get All Appointments
```http
GET /api/appointments
```
*Requires authentication*

Returns appointments based on user role:
- **Patient**: Their own appointments
- **Doctor**: Appointments with them

### Get Single Appointment
```http
GET /api/appointments/:id
```
*Requires authentication*

### Update Appointment Status
```http
PUT /api/appointments/:id
```
*Requires authentication (Doctor only)*

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Status values:** `pending`, `confirmed`, `completed`, `cancelled`

### Cancel Appointment
```http
DELETE /api/appointments/:id
```
*Requires authentication*

**Request Body:**
```json
{
  "reason": "Schedule conflict"
}
```

---

## Prescription Endpoints

### Create Prescription
```http
POST /api/prescriptions
```
*Requires authentication (Doctor only)*

**Request Body:**
```json
{
  "patient": "64abc123...",
  "appointment": "64def456...",
  "diagnosis": "Common Cold",
  "medications": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "frequency": "Every 6 hours",
      "duration": "5 days",
      "instructions": "Take after meals"
    }
  ],
  "additionalInstructions": "Rest and drink plenty of fluids",
  "followUpDate": "2024-02-20"
}
```

### Get All Prescriptions
```http
GET /api/prescriptions
```
*Requires authentication*

Returns prescriptions based on user role:
- **Patient**: Their own prescriptions
- **Doctor**: Prescriptions they created

### Get Single Prescription
```http
GET /api/prescriptions/:id
```
*Requires authentication*

### Update Prescription
```http
PUT /api/prescriptions/:id
```
*Requires authentication (Doctor only)*

---

## Help Request Endpoints

### Create Help Request
```http
POST /api/help-requests
```
*Requires authentication (Patient only)*

**Request Body:**
```json
{
  "problem": "Need financial assistance for heart surgery",
  "financialDetails": "Unable to afford $5000 surgery cost. Monthly income is $500.",
  "urgency": "high",
  "location": {
    "type": "Point",
    "coordinates": [-73.935242, 40.730610],
    "address": "123 Main St, New York, NY"
  },
  "prescriptions": ["64abc123...", "64def456..."]
}
```

**Urgency values:** `low`, `medium`, `high`

### Get Help Requests
```http
GET /api/help-requests
```
*Requires authentication*

**Query Parameters (NGO only):**
- `status` - Filter by status
- `urgency` - Filter by urgency
- `assigned=true` - Only show requests assigned to current NGO

**Example:**
```
GET /api/help-requests?status=pending&urgency=high
GET /api/help-requests?assigned=true
```

Returns requests based on user role:
- **Patient**: Their own requests
- **NGO**: All requests or filtered requests

### Get Single Help Request
```http
GET /api/help-requests/:id
```
*Requires authentication*

### Update Help Request
```http
PUT /api/help-requests/:id
```
*Requires authentication (NGO only)*

**Request Body:**
```json
{
  "status": "in-progress",
  "ngoNotes": "Contacted patient. Arranging financial support.",
  "resolution": "Provided $2000 assistance"
}
```

**Status values:** `pending`, `in-progress`, `resolved`, `rejected`

### Get Nearby Help Requests
```http
GET /api/help-requests/nearby/:distance
```
*Requires authentication (NGO only)*

**Query Parameters:**
- `longitude` - Longitude coordinate (required)
- `latitude` - Latitude coordinate (required)

**Example:**
```
GET /api/help-requests/nearby/10?longitude=-73.935242&latitude=40.730610
```

Distance is in kilometers (default: 10km)

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Rate Limiting

Currently no rate limiting is implemented. In production, implement rate limiting to prevent abuse.

---

## Data Validation

All endpoints validate input data:
- Email must be valid format
- Phone numbers required
- Passwords minimum 6 characters
- Required fields cannot be empty
- Invalid IDs return 404

---

## Best Practices

1. **Always include JWT token** in Authorization header for protected routes
2. **Store tokens securely** (HttpOnly cookies or secure storage)
3. **Handle errors gracefully** on the client side
4. **Validate data** before sending to API
5. **Use HTTPS** in production
6. **Never commit** `.env` file with secrets

---

## Testing

Use tools like:
- Postman
- Insomnia
- Thunder Client (VS Code)
- cURL

Example cURL request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

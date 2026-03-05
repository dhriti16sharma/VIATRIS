# Healthcare Platform Backend

Express.js + MongoDB backend API for the Healthcare Platform.

## Features

- ✅ **User Authentication** - JWT-based auth for patients, doctors, and NGOs
- ✅ **Role-Based Access Control** - Different permissions for different user types
- ✅ **Doctor Management** - Search, availability, ratings
- ✅ **Appointment System** - Book, manage, and track appointments
- ✅ **Prescription Management** - Digital prescriptions with medications
- ✅ **Help Requests** - NGO assistance for patients in need
- ✅ **Geolocation** - Find nearby help requests
- ✅ **Secure** - Password hashing, JWT tokens, Helmet security

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken)
- **Security:** bcrypt, helmet, cors
- **Validation:** express-validator

## Quick Start

### Prerequisites

- Node.js 16+ installed
- MongoDB installed locally OR MongoDB Atlas account
- npm or yarn package manager

### Installation

1. **Clone and install dependencies:**
```bash
cd healthcare-backend
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/healthcare
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

3. **Start MongoDB** (if running locally):
```bash
# macOS/Linux
mongod

# Windows
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
```

4. **Run the server:**
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

Server will run on `http://localhost:5000`

### Verify Installation

```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{
  "success": true,
  "message": "Healthcare API is running",
  "timestamp": "2024-02-07T..."
}
```

## MongoDB Setup

### Option 1: Local MongoDB

1. Install MongoDB Community Edition
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/healthcare`

### Option 2: MongoDB Atlas (Cloud)

1. Create free account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string
4. Update `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthcare?retryWrites=true&w=majority
```

## API Endpoints

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed endpoint documentation.

### Quick Reference

#### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

#### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor details
- `POST /api/doctors/search-by-symptoms` - Search by symptoms
- `POST /api/doctors/availability` - Set availability (Doctor)
- `GET /api/doctors/availability/me` - Get my availability (Doctor)

#### Appointments
- `POST /api/appointments` - Create appointment (Patient)
- `GET /api/appointments` - Get appointments
- `GET /api/appointments/:id` - Get single appointment
- `PUT /api/appointments/:id` - Update status (Doctor)
- `DELETE /api/appointments/:id` - Cancel appointment

#### Prescriptions
- `POST /api/prescriptions` - Create prescription (Doctor)
- `GET /api/prescriptions` - Get prescriptions
- `GET /api/prescriptions/:id` - Get single prescription
- `PUT /api/prescriptions/:id` - Update prescription (Doctor)

#### Help Requests
- `POST /api/help-requests` - Create request (Patient)
- `GET /api/help-requests` - Get requests
- `GET /api/help-requests/:id` - Get single request
- `PUT /api/help-requests/:id` - Update request (NGO)
- `GET /api/help-requests/nearby/:distance` - Find nearby (NGO)

## Project Structure

```
healthcare-backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── appointmentController.js
│   │   ├── doctorController.js
│   │   ├── prescriptionController.js
│   │   └── helpRequestController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   └── errorHandler.js      # Error handling
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Appointment.js
│   │   ├── Availability.js
│   │   ├── Prescription.js
│   │   └── HelpRequest.js
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── doctors.js
│   │   ├── appointments.js
│   │   ├── prescriptions.js
│   │   └── helpRequests.js
│   └── server.js                # Main server file
├── .env.example                 # Environment variables template
├── package.json
├── API_DOCUMENTATION.md         # Detailed API docs
└── README.md
```

## Testing the API

### Using cURL

**Register a patient:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "role": "patient"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Get doctors (with auth token):**
```bash
curl http://localhost:5000/api/doctors \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Import the endpoints from API_DOCUMENTATION.md
2. Set up environment variables for base URL and token
3. Test each endpoint

## Security Features

- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **JWT Tokens** - Secure authentication
- ✅ **Helmet.js** - Security HTTP headers
- ✅ **CORS** - Controlled cross-origin requests
- ✅ **Input Validation** - Mongoose schema validation
- ✅ **Role-Based Access** - Authorization middleware

## Error Handling

All errors return consistent format:
```json
{
  "success": false,
  "error": "Error message"
}
```

Status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `MONGODB_URI` | MongoDB connection | `mongodb://localhost:27017/healthcare` |
| `JWT_SECRET` | JWT secret key | `your-secret-key` |
| `JWT_EXPIRE` | Token expiry | `7d` |
| `CLIENT_URL` | Frontend URL | `http://localhost:3000` |

## Database Models

### User
- name, email, password, phone, role
- Doctor: specialization, experience, rating
- NGO: ngoName
- Patient: dateOfBirth, gender, address

### Appointment
- patient, doctor, date, time
- symptoms, notes, status

### Availability
- doctor, day, startTime, endTime

### Prescription
- patient, doctor, diagnosis
- medications (array), instructions
- followUpDate

### HelpRequest
- patient, problem, financialDetails
- urgency, location (geospatial)
- status, assignedNGO, prescriptions

## Development

### Run in development mode:
```bash
npm run dev
```

Uses nodemon for auto-reload on file changes.

### Run tests:
```bash
npm test
```

## Production Deployment

1. **Set environment to production:**
```env
NODE_ENV=production
```

2. **Use strong JWT secret:**
```env
JWT_SECRET=very-long-random-secure-string
```

3. **Deploy to:**
- Heroku
- AWS EC2
- DigitalOcean
- Railway
- Render

4. **Use MongoDB Atlas** for production database

5. **Set up HTTPS** with SSL certificate

6. **Implement rate limiting** (add to middleware)

7. **Add logging** (Winston, Morgan)

8. **Monitor** with tools like PM2, New Relic

## Troubleshooting

### MongoDB Connection Failed
- Check if MongoDB is running
- Verify connection string in `.env`
- Check network/firewall settings

### JWT Token Invalid
- Token might be expired
- Check JWT_SECRET matches
- Ensure token is passed correctly in header

### CORS Error
- Check CLIENT_URL in `.env`
- Verify CORS configuration in server.js

### Port Already in Use
- Change PORT in `.env`
- Kill process using the port: `lsof -ti:5000 | xargs kill`

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/NewFeature`)
3. Commit changes (`git commit -m 'Add NewFeature'`)
4. Push to branch (`git push origin feature/NewFeature`)
5. Open Pull Request

## License

MIT License

## Support

For issues or questions:
- Email: support@healthcare.com
- GitHub Issues: [Link to repo]

---

**Built with ❤️ for better healthcare access**

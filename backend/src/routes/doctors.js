const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctor,
  setAvailability,
  getAvailability,
  deleteAvailability,
  searchBySymptoms
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getDoctors);
router.get('/:id', getDoctor);
router.post('/search-by-symptoms', searchBySymptoms);

// Protected routes for doctors only
router.post('/availability', protect, authorize('doctor'), setAvailability);
router.get('/availability/me', protect, authorize('doctor'), getAvailability);
router.delete('/availability/:id', protect, authorize('doctor'), deleteAvailability);

module.exports = router;

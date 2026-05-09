const express = require('express');
const router = express.Router();
const {
  createPrescription,
  getPrescriptions,
  getPrescription,
  updatePrescription,
  getPrescriptionsByTokenIds
} = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/auth');

// Public route — no auth — MUST be before router.use(protect)
router.get('/public', getPrescriptionsByTokenIds);

// All routes below require a valid JWT
router.use(protect);

router.route('/')
  .get(getPrescriptions)
  .post(authorize('doctor'), createPrescription);

router.route('/:id')
  .get(getPrescription)
  .put(authorize('doctor'), updatePrescription);

module.exports = router;

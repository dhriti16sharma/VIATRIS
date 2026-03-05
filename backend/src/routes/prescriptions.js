const express = require('express');
const router = express.Router();
const {
  createPrescription,
  getPrescriptions,
  getPrescription,
  updatePrescription
} = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getPrescriptions)
  .post(authorize('doctor'), createPrescription);

router.route('/:id')
  .get(getPrescription)
  .put(authorize('doctor'), updatePrescription);

module.exports = router;

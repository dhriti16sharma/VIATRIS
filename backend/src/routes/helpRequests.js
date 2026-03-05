const express = require('express');
const router = express.Router();
const {
  createHelpRequest,
  getHelpRequests,
  getHelpRequest,
  updateHelpRequest,
  getNearbyRequests
} = require('../controllers/helpRequestController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getHelpRequests)
  .post(authorize('patient'), createHelpRequest);

router.get('/nearby/:distance', authorize('ngo'), getNearbyRequests);

router.route('/:id')
  .get(getHelpRequest)
  .put(authorize('ngo'), updateHelpRequest);

module.exports = router;

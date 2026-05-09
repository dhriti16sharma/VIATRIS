const express = require('express');
const router = express.Router();
const {
  createHelpRequest,
  getHelpRequests,
  getHelpRequest,
  updateHelpRequest,
  getNearbyRequests,
  getPublicHelpRequestsForNGO,
  updatePublicHelpRequest
} = require('../controllers/helpRequestController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getHelpRequests)
  .post(authorize('patient'), createHelpRequest);

router.get('/nearby/:distance', authorize('ngo'), getNearbyRequests);

router.route('/public-requests')
  .get(authorize('ngo'), getPublicHelpRequestsForNGO);

router.route('/public-requests/:id')
  .put(authorize('ngo'), updatePublicHelpRequest);

router.route('/:id')
  .get(getHelpRequest)
  .put(authorize('ngo'), updateHelpRequest);

module.exports = router;

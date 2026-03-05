const express = require('express');
const router = express.Router();
const {
  getTokens,
  getToken,
  updateToken,
  deleteToken
} = require('../controllers/tokenController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Doctor routes
router.get('/', authorize('doctor', 'ngo'), getTokens);
router.get('/:id', authorize('doctor', 'ngo'), getToken);
router.put('/:id', authorize('doctor'), updateToken);
router.delete('/:id', authorize('doctor'), deleteToken);

module.exports = router;

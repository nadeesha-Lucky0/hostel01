const express = require('express');
const router = express.Router();
const clearanceController = require('../controllers/clearanceController');
const { protect, studentOnly, wardenOnly, financialManagerOnly } = require('../middleware/authMiddleware');

router.post('/', protect, studentOnly, clearanceController.submitClearance);
router.get('/', protect, wardenOnly, clearanceController.getAllClearances);
router.get('/financial', protect, financialManagerOnly, clearanceController.getAllClearances);
router.get('/me', protect, studentOnly, clearanceController.getMyClearance);
router.delete('/me', protect, studentOnly, clearanceController.deleteClearance);
router.patch('/:id/warden', protect, (req, res, next) => {
    // Allow warden, financial manager, and security officer
    const role = (req.user?.role || '').toLowerCase().trim();
    if (role === 'warden' || role === 'financial' || role === 'security') {
        return next();
    }
    res.status(403).json({ success: false, message: 'Access denied' });
}, clearanceController.updateClearanceWarden);

module.exports = router;

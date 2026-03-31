const express = require('express');
const router = express.Router();
const { getRefundablePayments, updateRefundStatus, getAllPaymentRecords } = require('../controllers/financialController');
const { protect, financialManagerOnly: financialManager } = require('../middleware/authMiddleware');

router.use(protect);
router.use(financialManager);

router.get('/refundable', getRefundablePayments);
router.put('/refundable/:id/status', updateRefundStatus);
router.get('/records', getAllPaymentRecords);

module.exports = router;

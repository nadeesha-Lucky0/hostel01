const StudentPayment = require('../models/StudentPayment');

// @desc    Get all refundable payments for financial manager
// @route   GET /api/financial/refundable
exports.getRefundablePayments = async (req, res) => {
    try {
        // Find all student payment records where refundPayment exists
        const payments = await StudentPayment.find({
            'refundPayment.documentUrl': { $exists: true, $ne: null }
        }).sort({ updatedAt: -1 });

        res.status(200).json({ success: true, data: payments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};

// @desc    Update refundable payment status
// @route   PUT /api/financial/refundable/:id/status
exports.updateRefundStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Pending', 'Accepted', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, msg: 'Invalid status' });
        }

        const payment = await StudentPayment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, msg: 'Payment record not found' });
        }

        payment.refund_status = status;
        payment.refundPayment.paymentStatus = status === 'Accepted' ? 'Approved' : status; // Syncing both for legacy/compatibility
        payment.updatedAt = Date.now();

        await payment.save();

        res.status(200).json({ success: true, data: payment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};

// @desc    Get all payment records (Refundable + Monthly)
// @route   GET /api/financial/records
exports.getAllPaymentRecords = async (req, res) => {
    try {
        const payments = await StudentPayment.find().sort({ updatedAt: -1 });
        res.status(200).json({ success: true, data: payments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};

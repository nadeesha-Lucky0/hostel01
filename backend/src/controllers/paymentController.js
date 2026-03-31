const StudentPayment = require('../models/StudentPayment');
const Application = require('../models/Application');
const Allocation = require('../models/Allocation');

// GET all payments (now from student_payments collection)
exports.getAllPayments = async (req, res) => {
    try {
        // Fetch all student payments
        const payments = await StudentPayment.find().sort({ rollNumber: 1 });

        // Fetch allocations to check allocation status
        const allocations = await Allocation.find({}, 'studentRollNumber');
        const allocatedRolls = new Set(allocations.map(a => a.studentRollNumber));

        // Fetch applications to get degree and year (not in StudentPayment)
        const applications = await Application.find({}, 'studentRollNumber studentDegree studentYear');
        const appMap = new Map(applications.map(app => [app.studentRollNumber, app]));

        const students = payments.map(p => {
            const app = appMap.get(p.rollNumber);

            // Map StudentPayment status to frontend expected status
            let paymentStatus = 'pending';
            const status = p.refund_status || (p.refundPayment && p.refundPayment.paymentStatus);

            if (status === 'Accepted' || status === 'Approved') {
                paymentStatus = 'success';
            } else if (status === 'Rejected') {
                paymentStatus = 'rejected';
            }

            return {
                _id: p._id,
                name: p.studentName,
                email: p.email,
                rollNumber: p.rollNumber,
                degree: app ? app.studentDegree : 'N/A',
                year: app ? app.studentYear : 'N/A',
                wing: p.wing,
                paymentStatus: paymentStatus,
                applicationDate: p.createdAt || p._id.getTimestamp(),
                isAllocated: allocatedRolls.has(p.rollNumber)
            };
        });

        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET single payment record by roll number
exports.getPaymentByRoll = async (req, res) => {
    try {
        const payment = await StudentPayment.findOne({ rollNumber: req.params.rollNumber });
        if (!payment) return res.status(404).json({ error: 'Payment record not found' });
        res.json(payment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// GET all monthly submissions for Warden
exports.getMonthlySubmissions = async (req, res) => {
    try {
        const payments = await StudentPayment.find({
            'submittedMonths.0': { $exists: true }
        }).sort({ updatedAt: -1 });

        const submissions = [];
        payments.forEach(p => {
            p.submittedMonths.forEach(sub => {
                submissions.push({
                    studentId: p._id,
                    studentName: p.studentName,
                    email: p.email,
                    rollNumber: p.rollNumber,
                    wing: p.wing,
                    submissionId: sub._id,
                    months: sub.months,
                    monthCount: sub.monthCount,
                    year: sub.year,
                    amount: sub.amount,
                    documentUrl: sub.documentUrl,
                    status: sub.status,
                    submittedDate: sub.submittedDate
                });
            });
        });

        // Sort by date descending
        submissions.sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));

        res.json(submissions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PATCH update monthly submission status
exports.updateMonthlyStatus = async (req, res) => {
    try {
        const { studentId, submissionId } = req.params;
        const { status } = req.body;

        if (!['Accepted', 'Rejected', 'Pending'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const payment = await StudentPayment.findById(studentId);
        if (!payment) return res.status(404).json({ error: 'Student record not found' });

        const submission = payment.submittedMonths.id(submissionId);
        if (!submission) return res.status(404).json({ error: 'Submission not found' });

        submission.status = status;
        payment.updatedAt = Date.now();
        await payment.save();

        res.json({ success: true, msg: `Submission marked as ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const StudentPayment = require('../models/StudentPayment');
const Application = require('../models/Application');

// GET initial data for student (pre-fill form)
exports.getStudentInitialData = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const application = await Application.findOne({ student: userId });

        if (!application) {
            return res.status(404).json({ success: false, msg: 'No approved application found for this student.' });
        }

        const initialData = {
            studentName: application.studentName,
            email: application.studentEmail,
            rollNumber: application.studentRollNumber,
            wing: application.studentWing,
            roomType: application.roomType
        };

        res.json({ success: true, data: initialData });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

// GET current student's payment status
exports.getStudentPaymentStatus = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const paymentRecord = await StudentPayment.findOne({ student: userId });

        if (!paymentRecord) {
            return res.json({ success: true, data: null });
        }

        res.json({ success: true, data: paymentRecord });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

// POST submit refundable payment
exports.submitRefundablePayment = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { amount, paymentType, studentName, email, rollNumber, wing, roomType } = req.body;

        // Check if record already exists
        let paymentRecord = await StudentPayment.findOne({ student: userId });
        if (paymentRecord && paymentRecord.refundPayment && paymentRecord.refundPayment.documentUrl) {
            return res.status(400).json({ success: false, msg: 'Refundable payment has already been submitted.' });
        }

        const documentUrl = req.file ? req.file.path : null;
        if (!documentUrl) {
            return res.status(400).json({ success: false, msg: 'Payment proof document is required.' });
        }

        const refundData = {
            amount,
            documentUrl: req.file.path,
            documentPublicId: req.file.filename,
            submittedDate: new Date(),
            paymentType,
            refundable: true,
            paymentStatus: 'Pending'
        };

        if (!paymentRecord) {
            paymentRecord = new StudentPayment({
                student: userId,
                studentName,
                email,
                rollNumber,
                wing,
                roomType,
                refundPayment: refundData,
                submissionStatus: 'Refundable Completed'
            });
        } else {
            paymentRecord.refundPayment = refundData;
            paymentRecord.submissionStatus = 'Refundable Completed';
        }

        await paymentRecord.save();
        res.status(201).json({ success: true, data: paymentRecord });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

// POST submit monthly payment
exports.submitMonthlyPayment = async (req, res) => {
    try {
        const { year, amount, months, monthCount } = req.body;

        let payment = await StudentPayment.findOne({ student: req.user.id || req.user._id }); // Changed 'user' to 'student' to match schema

        if (!payment) {
            return res.status(404).json({ success: false, msg: 'Payment record not found' });
        }

        // Ensure req.file exists for documentUrl
        if (!req.file || !req.file.path) {
            return res.status(400).json({ success: false, msg: 'Payment proof document is required.' });
        }

        const newSubmission = {
            months: JSON.parse(months), // Received as JSON string from multipart/form-data
            monthCount: parseInt(monthCount),
            year,
            amount,
            documentUrl: req.file.path,
            documentPublicId: req.file.filename,
            status: 'Pending',
            submittedDate: new Date() // Added submittedDate for consistency
        };

        // For legacy compatibility or single month display
        if (newSubmission.months && newSubmission.months.length > 0) {
            newSubmission.month = newSubmission.months.join(', ');
        }

        payment.submittedMonths.push(newSubmission);
        payment.updatedAt = Date.now();
        await payment.save();

        res.status(200).json({ success: true, data: payment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};

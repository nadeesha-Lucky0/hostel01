const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'hostel_secret_key_2026', { expiresIn: '7d' });
};

// @desc   Register user
// @route  POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, role, studentId, phoneNumber } = req.body;
        const userRole = role || 'student';

        // Validation for Student ID and Email format matching for students
        if (userRole === 'student') {
            // Check email format: (IT|BM)XXXXXXXX@my.sliit.lk
            const studentEmailRegex = /^(IT|BM)\d{8}@my\.sliit\.lk$/i;
            if (!studentEmailRegex.test(email)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Registration failed: Student email must be in the format ITXXXXXXXX@my.sliit.lk or BMXXXXXXXX@my.sliit.lk' 
                });
            }

            const emailPrefix = (email || '').split('@')[0].toUpperCase();
            if ((studentId || '').toUpperCase() !== emailPrefix) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Registration failed: Student ID must match email prefix (${emailPrefix})` 
                });
            }
        } 
        // Validation for Staff email pattern (Warden, Security)
        else if (userRole === 'warden' || userRole === 'security') {
            const staffEmailRegex = /^[A-Za-z0-9._%+-]+@sliit\.lk$/i;
            if (!staffEmailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: `Registration failed: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} email must be an official @sliit.lk address`
                });
            }
        }

        // Validation for 10-digit phone number (Required for students, optional for others but must be 10 digits if provided)
        if (userRole === 'student') {
            if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Registration failed: Phone Number must be exactly 10 digits' 
                });
            }
        } else if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Registration failed: Phone Number must be exactly 10 digits' 
            });
        }

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

        const user = await User.create({ 
            name, 
            email, 
            password, 
            role: userRole, 
            studentId: userRole === 'student' ? studentId : undefined,
            phoneNumber
        });

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                phoneNumber: user.phoneNumber,
                profilePicture: user.profilePicture,
                accountStatus: user.accountStatus,
                token: generateToken(user._id)
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc   Login user
// @route  POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                profilePicture: user.profilePicture,
                accountStatus: user.accountStatus,
                token: generateToken(user._id)
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc   Get current user profile
// @route  GET /api/auth/me
const getMe = (req, res) => {
    res.json({ success: true, data: req.user });
};

module.exports = { register, login, getMe };

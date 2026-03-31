const express = require('express');
const { register, login, getMe } = require('../controllers/authController.js');
const { protect } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/check-role', protect, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user._id,
            role: req.user.role,
            email: req.user.email
        }
    });
});

module.exports = router;

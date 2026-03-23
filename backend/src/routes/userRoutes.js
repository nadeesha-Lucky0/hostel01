const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.js');
const { upload } = require('../config/cloudinary.js');
const { updateProfilePicture, deleteProfilePicture } = require('../controllers/userController.js');

router.put('/profile-picture', authenticate, upload.single('file'), updateProfilePicture);
router.delete('/profile-picture', authenticate, deleteProfilePicture);

module.exports = router;

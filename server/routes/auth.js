import express from 'express';
import auth from '../middleware/auth.js';
import {
  forgotPassword,
  getCurrentUser,
  login,
  register,
  resetPassword,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', auth, getCurrentUser);

export default router;

import express from 'express';
import auth from '../middleware/auth.js';
import { getCurrentUser, login, register } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getCurrentUser);

export default router;

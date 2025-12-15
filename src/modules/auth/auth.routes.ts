import { Router } from 'express';
import { authenticate } from '../../middleware/authGuard';
import { validateCreateUser } from '../user/user.schema';
import {
  login,
  register,
  changePassword,
  refreshToken,
  logout,
  logoutAll,
  verifyToken,
} from './auth.controller';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/register', validateCreateUser, register);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Protected routes
router.use(authenticate);
router.post('/change-password', changePassword);
router.post('/logout-all', logoutAll);
router.get('/verify', verifyToken);

export default router;
import { Router } from 'express';
import { authenticate } from '../../middleware/authGuard';
import { validateRequest } from '../../middleware/validateRequest';
import {
    loginSchema,
    registerSchema,
    changePasswordSchema,
    refreshTokenSchema,
    logoutSchema
} from './auth.schema';
import {
  login,
  register,
  changePassword,
  refreshToken,
  logout,
  logoutAll,
  verifyToken,
} from './auth.controller';

const router: Router = Router();

// Public routes
router.post('/login', validateRequest({ body: loginSchema }), login);
router.post('/register', validateRequest({ body: registerSchema }), register);
router.post('/refresh', validateRequest({ body: refreshTokenSchema }), refreshToken);
router.post('/logout', validateRequest({ body: logoutSchema }), logout);

// Protected routes
router.use(authenticate);
router.post('/change-password', validateRequest({ body: changePasswordSchema }), changePassword);
router.post('/logout-all', logoutAll);
router.get('/verify', verifyToken);

export default router;

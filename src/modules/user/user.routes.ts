import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/authGuard';
import { validateRequest } from '../../middleware/validateRequest';
import { createUserSchema, updateUserSchema, userQuerySchema } from './user.schema';
import { idParamSchema } from '../../lib/validation';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
} from './user.controller';

const router: Router = Router();

// Protected routes
router.use(authenticate);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', validateRequest({ body: updateUserSchema }), updateProfile);

// Admin only routes
router.get('/', authorize('ADMIN'), validateRequest({ query: userQuerySchema }), getUsers);
router.get('/:id', authorize('ADMIN'), validateRequest({ params: idParamSchema }), getUserById);
router.post('/', authorize('ADMIN'), validateRequest({ body: createUserSchema }), createUser);
router.put('/:id', authorize('ADMIN'), validateRequest({ params: idParamSchema, body: updateUserSchema }), updateUser);
router.delete('/:id', authorize('ADMIN'), validateRequest({ params: idParamSchema }), deleteUser);

export default router;

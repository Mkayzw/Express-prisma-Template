import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/authGuard';
import { validateCreateUser, validateUpdateUser } from './user.schema';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
} from './user.controller';

const router = Router();

// Public routes (none for now)

// Protected routes
router.use(authenticate);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', validateUpdateUser, updateProfile);

// Admin only routes
router.get('/', authorize('ADMIN'), getUsers);
router.get('/:id', authorize('ADMIN'), getUserById);
router.post('/', authorize('ADMIN'), validateCreateUser, createUser);
router.put('/:id', authorize('ADMIN'), validateUpdateUser, updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);

export default router;
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authGuard';
import * as userService from './user.service';
import { CreateUserInput, UpdateUserInput, UserQueryParams } from './user.types';

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, sortBy, sortOrder, search } = req.query;
    
    const params: UserQueryParams = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      search: search as string,
    };

    const result = await userService.findAll(params);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await userService.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userData: CreateUserInput = req.body;
    const user = await userService.create(userData);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userData: UpdateUserInput = req.body;

    // Users can only update their own profile unless they're admin
    if (req.user?.id !== id && req.user?.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this user',
      });
      return;
    }

    // Non-admin users cannot change their role
    if (req.user?.role !== 'ADMIN' && userData.role) {
      delete userData.role;
    }

    const user = await userService.update(id, userData);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Users can only delete their own account unless they're admin
    if (req.user?.id !== id && req.user?.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to delete this user',
      });
      return;
    }

    await userService.remove(id);
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized',
      });
      return;
    }

    const user = await userService.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized',
      });
      return;
    }

    const userData: UpdateUserInput = req.body;
    
    // Users cannot change their role through profile update
    delete userData.role;

    const user = await userService.update(req.user.id, userData);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
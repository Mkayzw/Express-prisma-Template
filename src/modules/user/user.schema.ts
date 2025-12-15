import { Request, Response, NextFunction } from 'express';
import { CreateUserInput, UpdateUserInput } from './user.types';

export const validateCreateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email, password, firstName, lastName }: CreateUserInput = req.body;

  // Email validation
  if (!email) {
    res.status(400).json({
      success: false,
      error: 'Email is required',
    });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      error: 'Please provide a valid email',
    });
    return;
  }

  // Password validation
  if (!password) {
    res.status(400).json({
      success: false,
      error: 'Password is required',
    });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long',
    });
    return;
  }

  next();
};

export const validateUpdateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email, firstName, lastName }: UpdateUserInput = req.body;

  // Email validation (if provided)
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'Please provide a valid email',
      });
      return;
    }
  }

  next();
};
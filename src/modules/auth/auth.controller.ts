import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authGuard';
import * as authService from './auth.service';
import { LoginInput, RegisterInput, ChangePasswordInput } from './auth.types';

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const loginData: LoginInput = req.body;
    const result = await authService.login(loginData);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const registerData: RegisterInput = req.body;
    const result = await authService.register(registerData);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
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

    const passwordData: ChangePasswordInput = req.body;
    await authService.changePassword(req.user.id, passwordData);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
      return;
    }

    const tokens = await authService.refreshAccessToken(token);

    res.status(200).json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      await authService.logout(token);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const logoutAll = async (
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

    await authService.logoutAll(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Logged out from all sessions',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyToken = async (
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

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
        valid: true,
      },
    });
  } catch (error) {
    next(error);
  }
};
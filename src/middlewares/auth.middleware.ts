import { NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';
import { STATUS_CODES } from '../constants';
import { User } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export const verifyToken = asyncHandler(
  async (req: Request, _, next: NextFunction) => {
    try {
      const token: string =
        req.signedCookies.accessToken ||
        req.header('Authorization')?.replace('Bearer ', '');

      if (!token) {
        throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Unauthorized request');
      }

      const decodedPayload = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      );

      const user = await User.findById(
        typeof decodedPayload !== 'string' && decodedPayload.id
      );

      if (!user) {
        throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Unauthorized request');
      }

      req.user = user;
      next();
    } catch (error) {
      throw new ApiError(
        STATUS_CODES.UNAUTHORIZED,
        error instanceof Error ? error.message : 'Invalid token'
      );
    }
  }
);

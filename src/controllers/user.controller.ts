import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/user.model';
import { uploadFileToCloudinary } from '../utils/cloudinary';
import { ApiResponse } from '../utils/ApiRespone';
import { STATUS_CODES } from '../constants';
import { IUserFiles } from '../types';

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password, fullname } = req.body;

  const userDetails = [username, email, password, fullname];

  if (!userDetails.every(Boolean)) {
    throw new ApiError(400, 'All fields are required');
  }

  const userExist = await User.findOne({ $or: [{ username }, { email }] });
  if (userExist) {
    throw new ApiError(400, 'username or email already exists');
  }

  const avatarLocalPath = (<IUserFiles>req.files)?.avatar?.[0]?.path;
  const coverImageLocalPath = (<IUserFiles>req.files)?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar is required');
  }

  const avatar = await uploadFileToCloudinary(avatarLocalPath, {
    folder: 'avatar',
    retries: 1,
  });
  const coverImage = await uploadFileToCloudinary(coverImageLocalPath, {
    folder: 'cover',
  });

  if (!avatar) {
    throw new ApiError(500, 'Failed to upload Avatar, Try again');
  }

  const user = await User.create({
    username,
    email,
    password,
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
  });
  const createdUser = await User.findById(user._id);

  if (!createdUser) {
    throw new ApiError(
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      'Failed to register user, Try again'
    );
  }

  res
    .status(STATUS_CODES.CREATED)
    .json(
      new ApiResponse(
        STATUS_CODES.CREATED,
        createdUser,
        'User registered successfully'
      )
    );
});

export { registerUser };

import { Request, Response } from 'express';
import { STATUS_CODES, cookieOptions } from '../constants';
import { User } from '../models/user.model';
import { IUserDocument, TUserFiles } from '../types';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiRespone';
import { asyncHandler } from '../utils/asyncHandler';
import { uploadFileToCloudinary } from '../utils/cloudinary';

type RefreshAndAccessToken = (
  user: IUserDocument
) => Promise<{ refreshToken: string; accessToken: string }>;

const generateRefreshAndAccessToken: RefreshAndAccessToken = async user => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;

  await user.save({ validateBeforeSave: false });

  return { refreshToken, accessToken };
};

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

  const avatarLocalPath = (<TUserFiles>req.files)?.avatar?.[0]?.path;
  const coverImageLocalPath = (<TUserFiles>req.files)?.coverImage?.[0]?.path;

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
    throw new ApiError(
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      'Failed to upload Avatar, Try again'
    );
  }

  const user = await User.create({
    username,
    email,
    password,
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
  });

  res
    .status(STATUS_CODES.CREATED)
    .json(
      new ApiResponse(
        STATUS_CODES.CREATED,
        user,
        'User registered successfully'
      )
    );
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!(username || email) || !password) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      'User Credentials are required'
    );
  }

  const user = await User.findOne({ $or: [{ username }, { email }] }).select(
    '+password'
  );
  if (!user) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "User doesn't exist");
  }

  const validatePassword = await user.isPasswordCorrect(password);
  if (!validatePassword) {
    throw new ApiError(STATUS_CODES.UNAUTHORIZED, 'Invalid user credentials');
  }

  const { refreshToken, accessToken } =
    await generateRefreshAndAccessToken(user);

  res
    .status(STATUS_CODES.OK)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        STATUS_CODES.OK,
        {
          user: {
            ...user.toObject(),
            password: undefined,
            refreshToken: undefined,
          },
          accessToken,
          refreshToken,
        },
        'Login successfully'
      )
    );
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $unset: { refreshToken: 1 },
    },
    { new: true }
  );

  res
    .status(STATUS_CODES.OK)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(STATUS_CODES.OK, {}, 'Logout successfully'));
});

export { loginUser, registerUser, logoutUser };

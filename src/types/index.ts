import { UploadApiOptions, UploadApiResponse } from 'cloudinary';

export type Folder = 'thumbnail' | 'avatar' | 'cover' | 'videos' | 'post';

export interface CustomUploadApiOptions extends UploadApiOptions {
  folder?: Folder;
  retries?: number;
}

export type UploadFileType = (
  localFilePath: string | undefined,
  options?: CustomUploadApiOptions
) => Promise<UploadApiResponse | null>;

export type IUserFiles =
  | {
      avatar?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
    }
  | undefined;

import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type UploadFileType = (
  localFilePath: string
) => Promise<UploadApiResponse | null>;

const uploadFileToCloudinary: UploadFileType = async localFilePath => {
  try {
    if (!localFilePath) return null;

    const uploadRespone = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
    });
    console.log(uploadRespone);
    console.log(`\n CLOUDINARY File Uploaded:: ${uploadRespone.url}`);
    return uploadRespone;
  } catch (error) {
    console.log('CLOUDINARY Upload Error ::', error);
    return null;
  } finally {
    fs.unlinkSync(localFilePath);
  }
};

export { uploadFileToCloudinary };

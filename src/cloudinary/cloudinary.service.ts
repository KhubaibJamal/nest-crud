import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import {
  PresignedUrlData,
  PresignedUrlResponse,
} from './entities/presigned-url.entity.js';
import { UploadImageResponse } from './entities/upload-image.entity.js';

const UPLOAD_FOLDER = 'nest_api_practice';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private cloudName!: string;
  private apiKey!: string;
  private apiSecret!: string;

  constructor(private readonly config: ConfigService) { }

  onModuleInit() {
    this.cloudName = this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME');
    this.apiKey = this.config.getOrThrow<string>('CLOUDINARY_API_KEY');
    this.apiSecret = this.config.getOrThrow<string>('CLOUDINARY_API_SECRET');

    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
      secure: true,
    });
  }

  getPresignedUrl(fileNames: string[]): PresignedUrlResponse {
    if (!fileNames.length) {
      throw new BadRequestException('At least one file name is required');
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

    if (fileNames.length === 1) {
      return {
        success: true,
        message: 'Presigned URL generated successfully',
        data: this.buildSignedUpload(fileNames[0], uploadUrl),
      };
    }

    return {
      success: true,
      message: 'Presigned URL generated successfully',
      data: fileNames.map((fileName) => ({
        ...this.buildSignedUpload(fileName, uploadUrl),
        fileName,
      })),
    };
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadImageResponse> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Image file is required');
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    try {
      const result = await this.uploadBuffer(file);

      return {
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown upload error';
      throw new InternalServerErrorException(
        `Failed to upload image: ${message}`,
      );
    }
  }

  private uploadBuffer(file: Express.Multer.File): Promise<UploadApiResponse> {
    const baseName = (file.originalname || 'photo').split('.')[0] || 'photo';
    const timestamp = Math.floor(Date.now() / 1000);
    // public_id without folder prefix — `folder` controls Media Library location
    const publicId = `${baseName}_${timestamp}`;

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: UPLOAD_FOLDER,
          asset_folder: UPLOAD_FOLDER,
          public_id: publicId,
          resource_type: 'image',
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Empty Cloudinary response'));
            return;
          }
          resolve(result);
        },
      );

      stream.end(file.buffer);
    });
  }

  private buildSignedUpload(
    fileName: string,
    uploadUrl: string,
  ): PresignedUrlData {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const baseName = fileName.split('.')[0] || 'file';
    const publicId = `${baseName}_${timestamp}`;

    // `folder` must be included in the signature and sent by the client
    const signature = cloudinary.utils.api_sign_request(
      {
        folder: UPLOAD_FOLDER,
        public_id: publicId,
        timestamp,
      },
      this.apiSecret,
    );

    return {
      uploadUrl,
      timestamp,
      folder: UPLOAD_FOLDER,
      public_id: publicId,
      signature,
      api_key: this.apiKey,
    };
  }
}

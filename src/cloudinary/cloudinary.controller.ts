import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CloudinaryService } from './cloudinary.service.js';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto.js';
import { PresignedUrlResponse } from './entities/presigned-url.entity.js';
import { UploadImageResponse } from './entities/upload-image.entity.js';

@ApiTags('cloudinary')
@Controller()
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('presignedUrl')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate Cloudinary signed upload params',
    description:
      'Pass fileName (string or string[]). Client then uploads the file to Cloudinary using the returned signature.',
  })
  @ApiOkResponse({ type: PresignedUrlResponse })
  getPresignedUrl(@Body() dto: GetPresignedUrlDto): PresignedUrlResponse {
    return this.cloudinaryService.getPresignedUrl(dto.fileName);
  }

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload image to Cloudinary',
    description:
      'Send the image as multipart form field "file". Returns the uploaded secure URL under nest_api_practice/.',
  })
  @ApiOkResponse({ type: UploadImageResponse })
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadImageResponse> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return this.cloudinaryService.uploadImage(file);
  }
}

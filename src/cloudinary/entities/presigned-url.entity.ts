import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PresignedUrlData {
  @ApiProperty({
    example: 'https://api.cloudinary.com/v1_1/your_cloud_name/image/upload',
  })
  uploadUrl: string;

  @ApiProperty({ example: '1726924800' })
  timestamp: string;

  @ApiProperty({
    example: 'nest_api_practice',
    description: 'Must be sent with the Cloudinary upload form',
  })
  folder: string;

  @ApiProperty({
    example: 'photo_1726924800',
    description: 'File id without folder prefix (folder is sent separately)',
  })
  public_id: string;

  @ApiProperty({ example: 'a1b2c3d4e5f6...' })
  signature: string;

  @ApiProperty({ example: 'your_api_key' })
  api_key: string;

  @ApiPropertyOptional({
    example: 'photo.jpg',
    description: 'Present when multiple file names are requested',
  })
  fileName?: string;
}

export class PresignedUrlResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Presigned URL generated successfully' })
  message: string;

  @ApiProperty({
    description: 'Single object for one file, array for multiple files',
  })
  data: PresignedUrlData | PresignedUrlData[];
}

import { ApiProperty } from '@nestjs/swagger';

export class UploadImageResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Image uploaded successfully' })
  message: string;

  @ApiProperty({
    example: {
      url: 'https://res.cloudinary.com/demo/image/upload/v1/nest_api_practice/photo.jpg',
      public_id: 'nest_api_practice/photo_1726924800',
      width: 800,
      height: 600,
      format: 'jpg',
    },
  })
  data: {
    url: string;
    public_id: string;
    width?: number;
    height?: number;
    format?: string;
  };
}

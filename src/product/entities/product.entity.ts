import { ApiProperty } from '@nestjs/swagger';

export class Product {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Product 1' })
  name: string;

  @ApiProperty({ example: 'Product 1 description' })
  description: string;

  @ApiProperty({ example: 100 })
  price: number;

  @ApiProperty({
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    type: [String],
  })
  images: string[];

  @ApiProperty({ example: true, default: true })
  status: boolean;

  @ApiProperty({ example: '2026-09-17T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-17T12:00:00.000Z' })
  updatedAt: Date;
}

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class GetPresignedUrlDto {
  @ApiProperty({
    oneOf: [
      { type: 'string', example: 'photo.jpg' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['photo1.jpg', 'photo2.png'],
      },
    ],
    description: 'Single file name or list of file names',
  })
  @Transform(({ value }: { value: string | string[] }) =>
    Array.isArray(value) ? value : [value],
  )
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  fileName: string[];
}

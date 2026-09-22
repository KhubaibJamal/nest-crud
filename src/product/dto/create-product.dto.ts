import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreateProductDto {
    @ApiProperty({ example: 'Product 1' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Product 1 description' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ example: 100 })
    @IsNumber()
    @IsNotEmpty()
    price: number;

    @ApiProperty({
        example: [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg',
        ],
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    images: string[];

    @ApiProperty({ example: true, default: true, required: false })
    @IsBoolean()
    @IsOptional()
    status?: boolean = true;
}

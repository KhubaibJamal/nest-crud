import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class FindUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Search by name, email, or phone (case-insensitive)',
    example: 'jane',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}

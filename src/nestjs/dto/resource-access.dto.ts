import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceOverrideEffect } from '../entity/user-resource-override.entity';

export class BatchResourceAccessItemDto {
  @ApiProperty({ example: 'manufacturer.batches' })
  @IsString()
  @MaxLength(128)
  resource_id: string;

  @ApiPropertyOptional({
    enum: ResourceOverrideEffect,
    nullable: true,
    description: 'null removes the override (revert to role default)',
  })
  @IsOptional()
  @IsEnum(ResourceOverrideEffect)
  effect: ResourceOverrideEffect | null;
}

export class BatchResourceAccessDto {
  @ApiProperty({ type: [BatchResourceAccessItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchResourceAccessItemDto)
  items: BatchResourceAccessItemDto[];
}

export class ToggleResourceAccessDto {
  @ApiProperty({ example: 'manufacturer.batches' })
  @IsString()
  @MaxLength(128)
  resource_id: string;

  @ApiProperty({ description: 'true = allow, false = deny override' })
  @IsBoolean()
  allowed: boolean;
}

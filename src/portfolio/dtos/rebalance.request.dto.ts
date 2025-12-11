import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class TargetAllocationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fixed_income?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  equities_br?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  intl?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fiis?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  crypto?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cash?: number;
}

export class ConstraintsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  min_ticket?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  max_monthly_new_cash?: number;
}

export class PreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  avoid_tax_events?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  prefer_new_contributions?: boolean;
}

export class RebalanceRequestDto {
  @ApiPropertyOptional({ type: TargetAllocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TargetAllocationDto)
  target_allocation?: TargetAllocationDto;

  @ApiPropertyOptional({ type: ConstraintsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConstraintsDto)
  constraints?: ConstraintsDto;

  @ApiPropertyOptional({ type: PreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PreferencesDto)
  preferences?: PreferencesDto;
}

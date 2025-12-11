import { ApiProperty } from '@nestjs/swagger';
import { AssetClass } from '../../positions/asset-class.enum';

export class AllocationDto {
  @ApiProperty()
  fixed_income: number;

  @ApiProperty()
  equities_br: number;

  @ApiProperty()
  intl: number;

  @ApiProperty()
  fiis: number;

  @ApiProperty()
  crypto: number;

  @ApiProperty()
  cash: number;
}

export class RebalanceBandsDto {
  @ApiProperty()
  min_band_pct: number;

  @ApiProperty({ type: [String] })
  actionable: string[];
}

export class AnalysisResponseDto {
  @ApiProperty()
  asOf: string;

  @ApiProperty({ type: AllocationDto })
  current_allocation: AllocationDto;

  @ApiProperty({ type: AllocationDto })
  target_allocation: AllocationDto;

  @ApiProperty({ type: AllocationDto })
  gaps: AllocationDto;

  @ApiProperty({ type: RebalanceBandsDto })
  rebalance_bands: RebalanceBandsDto;

  @ApiProperty({ type: [String] })
  notes: string[];
}

import { ApiProperty } from '@nestjs/swagger';

export class RebalanceActionDto {
  @ApiProperty()
  assetId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  reason: string;
}

export class RebalancePlanDto {
  @ApiProperty({ type: [RebalanceActionDto] })
  sell: RebalanceActionDto[];

  @ApiProperty({ type: [RebalanceActionDto] })
  buy: RebalanceActionDto[];
}

export class RebalanceResponseDto {
  @ApiProperty({ type: RebalancePlanDto })
  plan: RebalancePlanDto;

  @ApiProperty({ type: [String] })
  timeline: string[];

  @ApiProperty({ type: [String] })
  notes: string[];
}

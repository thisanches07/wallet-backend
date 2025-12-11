import { ApiProperty } from '@nestjs/swagger';
import { AssetClass } from '../../positions/asset-class.enum';

export class RecommendationItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: AssetClass })
  class: AssetClass;

  @ApiProperty()
  score: number;

  @ApiProperty({ type: [String] })
  rationale: string[];

  @ApiProperty()
  metrics: Record<string, number | string | null>;

  @ApiProperty()
  source: string;

  @ApiProperty()
  updatedAt: string;
}

export class RecommendationsResponseDto {
  @ApiProperty({ type: [RecommendationItemDto] })
  items: RecommendationItemDto[];
}

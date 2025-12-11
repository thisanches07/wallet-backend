import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor } from '../common/cache.interceptor';
import {
  InvestmentHorizon,
  RecommendationClass,
  RecommendationsQueryDto,
  RiskProfile,
} from './dtos/recommendations.query.dto';
import { RecommendationsResponseDto } from './dtos/recommendations.response.dto';
import { RecommendationsService } from './recommendations.service';

@ApiTags('recommendations')
@Controller('recommendations')
@UseInterceptors(CacheInterceptor)
export class RecommendationsController {
  constructor(private recommendationsService: RecommendationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get investment recommendations' })
  @ApiQuery({ name: 'class', enum: RecommendationClass, required: false })
  @ApiQuery({ name: 'horizon', enum: InvestmentHorizon, required: false })
  @ApiQuery({ name: 'risk', enum: RiskProfile, required: false })
  @ApiQuery({ name: 'limit', type: 'string', required: false })
  @ApiResponse({ status: 200, type: RecommendationsResponseDto })
  async getRecommendations(
    @Query() query: RecommendationsQueryDto,
  ): Promise<RecommendationsResponseDto> {
    const limit = query.limit ? parseInt(query.limit, 10) : 10;

    const items = await this.recommendationsService.getRecommendations(
      query.class,
      query.horizon,
      query.risk,
      limit,
    );

    return { items };
  }
}

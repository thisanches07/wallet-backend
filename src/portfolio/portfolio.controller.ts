import { AuthenticatedUser } from '@auth/auth-user.decorator';
import { FirebaseAuthGuard } from '@auth/firebase-auth.guard';
import { User } from '@entities/user.entity';
import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AllocationsService } from '../allocations/allocations.service';
import { CacheInterceptor } from '../common/cache.interceptor';
import { AnalysisResponseDto } from './dtos/analysis.response.dto';
import { RebalanceRequestDto } from './dtos/rebalance.request.dto';
import { RebalanceResponseDto } from './dtos/rebalance.response.dto';
import { RebalanceService } from './rebalance.service';

@ApiTags('portfolio')
@ApiBearerAuth('firebase-auth')
@UseGuards(FirebaseAuthGuard)
@Controller('portfolio')
export class PortfolioController {
  constructor(
    private allocationsService: AllocationsService,
    private rebalanceService: RebalanceService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Test portfolio endpoint availability' })
  @ApiResponse({ status: 200, description: 'Portfolio endpoint is working' })
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'Portfolio service is healthy',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('analysis')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get portfolio allocation analysis' })
  @ApiResponse({ status: 200, type: AnalysisResponseDto })
  async getAnalysis(
    @AuthenticatedUser() user: User,
  ): Promise<AnalysisResponseDto> {
    const userId = user.id.toString();

    const [currentAllocation, targetAllocation, gaps, rebalanceBands, notes] =
      await Promise.all([
        this.allocationsService.getCurrentAllocation(userId),
        this.allocationsService.getTargetAllocation(),
        this.allocationsService.getAllocationGaps(userId),
        this.allocationsService.getRebalanceBands(userId),
        this.allocationsService.getAnalysisNotes(userId),
      ]);

    return {
      asOf: new Date().toISOString().split('T')[0],
      current_allocation: {
        fixed_income: Math.round(currentAllocation.fixed_income * 100) / 100,
        equities_br: Math.round(currentAllocation.equities_br * 100) / 100,
        intl: Math.round(currentAllocation.intl * 100) / 100,
        fiis: Math.round(currentAllocation.fiis * 100) / 100,
        crypto: Math.round(currentAllocation.crypto * 100) / 100,
        cash: Math.round(currentAllocation.cash * 100) / 100,
      },
      target_allocation: {
        fixed_income: targetAllocation.fixed_income,
        equities_br: targetAllocation.equities_br,
        intl: targetAllocation.intl,
        fiis: targetAllocation.fiis,
        crypto: targetAllocation.crypto,
        cash: targetAllocation.cash,
      },
      gaps: {
        fixed_income: Math.round(gaps.fixed_income * 100) / 100,
        equities_br: Math.round(gaps.equities_br * 100) / 100,
        intl: Math.round(gaps.intl * 100) / 100,
        fiis: Math.round(gaps.fiis * 100) / 100,
        crypto: Math.round(gaps.crypto * 100) / 100,
        cash: Math.round(gaps.cash * 100) / 100,
      },
      rebalance_bands: {
        min_band_pct: rebalanceBands.min_band_pct,
        actionable: rebalanceBands.actionable.map((cls) => cls.toString()),
      },
      notes,
    };
  }

  @Post('rebalance/preview')
  @ApiOperation({ summary: 'Generate rebalance plan preview' })
  @ApiResponse({ status: 200, type: RebalanceResponseDto })
  async getRebalancePreview(
    @AuthenticatedUser() user: User,
    @Body() request: RebalanceRequestDto,
  ): Promise<RebalanceResponseDto> {
    const userId = user.id.toString();

    return await this.rebalanceService.generateRebalancePlan(userId, request);
  }
}

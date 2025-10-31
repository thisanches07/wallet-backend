import { AuthenticatedUser } from '@auth/auth-user.decorator';
import { FirebaseAuthGuard } from '@auth/firebase-auth.guard';
import { User } from '@entities/user.entity';
import {
  Controller,
  Get,
  Header,
  Query,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ExportQueryDto } from './dtos/export-query.dto';
import {
  MonthlySummaryDto,
  YearlySummaryDto,
} from './dtos/monthly-summary.dto';
import { YearlyExportQueryDto } from './dtos/yearly-export-query.dto';
import { SummaryService } from './summary.service';

@ApiTags('Summary')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('summary')
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  @Get('monthly')
  @ApiOperation({
    summary: 'Obter resumo de todos os meses',
    description:
      'Retorna o resumo financeiro de todos os meses de um ano específico agrupados por mês.',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    description: 'Ano (ex: 2025)',
    example: 2025,
  })
  @ApiResponse({
    status: 200,
    description: 'Resumo mensal obtido com sucesso',
    type: [MonthlySummaryDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor',
  })
  async getMonthlySummary(
    @AuthenticatedUser() user: User,
    @Query('year') year: number,
  ): Promise<MonthlySummaryDto[]> {
    return this.summaryService.getMonthlySummary(user, year);
  }

  @Get('yearly')
  @ApiOperation({
    summary: 'Obter resumo anual completo',
    description:
      'Retorna o resumo financeiro de um ano completo com dados mensais e totais anuais.',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    description: 'Ano (ex: 2025)',
    example: 2025,
  })
  @ApiResponse({
    status: 200,
    description: 'Resumo anual obtido com sucesso',
    type: YearlySummaryDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor',
  })
  async getYearlySummary(
    @AuthenticatedUser() user: User,
    @Query('year') year: number,
  ): Promise<YearlySummaryDto> {
    return this.summaryService.getYearlySummary(user, year);
  }

  @Get('export-monthly')
  @ApiOperation({
    summary: 'Exportar dados mensais para Excel',
    description:
      'Exporta receitas e despesas de um mês específico para um arquivo Excel (.xlsx). O arquivo contém três abas: Receitas, Despesas e Resumo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Arquivo Excel gerado com sucesso',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor',
  })
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportMonthlyData(
    @AuthenticatedUser() user: User,
    @Query(new ValidationPipe({ transform: true })) query: ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.summaryService.exportMonthlyDataToExcel(
      user,
      query.year,
      query.month,
    );

    const monthNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    const fileName = `relatorio-${monthNames[query.month - 1]}-${query.year}.xlsx`;

    res.set({
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length.toString(),
    });

    res.end(buffer);
  }

  @Get('export-monthly-by-category')
  @ApiOperation({
    summary: 'Exportar dados mensais agrupados por categoria para Excel',
    description:
      'Exporta receitas e despesas de um mês específico agrupadas por categoria para um arquivo Excel (.xlsx). O arquivo contém três abas: Receitas por Categoria, Despesas por Categoria e Comparativo por Categoria.',
  })
  @ApiResponse({
    status: 200,
    description: 'Arquivo Excel por categoria gerado com sucesso',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor',
  })
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportMonthlyCategoryData(
    @AuthenticatedUser() user: User,
    @Query(new ValidationPipe({ transform: true })) query: ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.summaryService.exportMonthlyCategoryDataToExcel(
      user,
      query.year,
      query.month,
    );

    const monthNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    const fileName = `relatorio-categorias-${monthNames[query.month - 1]}-${query.year}.xlsx`;

    res.set({
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length.toString(),
    });

    res.end(buffer);
  }

  @Get('export-yearly-evolution')
  @ApiOperation({
    summary: 'Exportar evolução anual de receitas e despesas para Excel',
    description:
      'Exporta a evolução das receitas e despesas ao longo de um ano específico para um arquivo Excel (.xlsx). O arquivo contém três abas: Evolução Anual, Estatísticas Mensais e Resumo Anual.',
  })
  @ApiResponse({
    status: 200,
    description: 'Arquivo Excel de evolução anual gerado com sucesso',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor',
  })
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportYearlyEvolution(
    @AuthenticatedUser() user: User,
    @Query(new ValidationPipe({ transform: true })) query: YearlyExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.summaryService.exportYearlyEvolutionToExcel(
      user,
      query.year,
    );

    const fileName = `evolucao-anual-${query.year}.xlsx`;

    res.set({
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length.toString(),
    });

    res.end(buffer);
  }
}

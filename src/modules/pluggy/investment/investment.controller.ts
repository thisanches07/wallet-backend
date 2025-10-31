import { AuthenticatedUser } from '@auth/auth-user.decorator';
import { FirebaseAuthGuard } from '@auth/firebase-auth.guard';
import { User } from '@entities/user.entity';
import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { InvestmentResponseDto } from './dtos/investment-response.dto';
import { InvestmentService } from './investment.service';

@ApiTags('Investimentos')
@ApiBearerAuth('firebase-auth')
@UseGuards(FirebaseAuthGuard)
@Controller('investments')
export class InvestmentController {
  constructor(private readonly investmentService: InvestmentService) {}

  @Get()
  @ApiOperation({
    summary: 'Buscar todos os investimentos do usuário',
    description:
      'Retorna todos os investimentos associados ao usuário autenticado, ordenados por data decrescente.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de investimentos retornada com sucesso',
    type: [InvestmentResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou não fornecido',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor ao buscar investimentos',
  })
  async findAllByUser(
    @AuthenticatedUser() user: User,
  ): Promise<InvestmentResponseDto[]> {
    return this.investmentService.findAllByUser(user);
  }

  @Get('/sync')
  @ApiOperation({
    summary: 'Sincronizar investimentos do Pluggy',
    description:
      'Sincroniza os investimentos do usuário a partir da API do Pluggy, criando apenas novos registros que não existem no banco de dados.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Investimentos sincronizados com sucesso',
    type: [InvestmentResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticação inválido ou não fornecido',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor durante a sincronização',
  })
  async syncInvestments(
    @AuthenticatedUser() user: User,
  ): Promise<InvestmentResponseDto[]> {
    console.log(
      'Iniciando sincronização de investimentos para o usuário:',
      user.id,
    );
    return await this.investmentService.syncInvestmentsFromPluggy(user);
  }
}

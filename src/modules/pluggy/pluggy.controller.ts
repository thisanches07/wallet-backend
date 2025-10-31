import { Controller, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateConnectTokenResponseDto,
  CreatePluggyUserResponseDto,
} from './dtos/pluggy-response.dto';
import { PluggyService } from './pluggy.service';

@ApiTags('Pluggy')
@Controller('pluggy')
export class PluggyController {
  private readonly logger = new Logger(PluggyController.name);

  constructor(private readonly pluggyService: PluggyService) {}

  @Post('users')
  @ApiOperation({
    summary: 'Criar usuário no Pluggy',
    description:
      'Cria um novo usuário na plataforma Pluggy para conexões bancárias',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: CreatePluggyUserResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor',
  })
  async createUser(): Promise<CreatePluggyUserResponseDto> {
    this.logger.log('Creating new Pluggy user');
    const userId = await this.pluggyService.createUser();
    return { userId };
  }

  @Post('connect-token')
  @ApiOperation({
    summary: 'Criar token de conexão',
    description:
      'Cria um token de conexão para autenticação do usuário no Pluggy Connect',
  })
  @ApiResponse({
    status: 201,
    description: 'Token de conexão criado com sucesso',
    type: CreateConnectTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor',
  })
  async createConnectToken(): Promise<CreateConnectTokenResponseDto> {
    this.logger.log(`Creating connect token for user`);
    const accessToken = await this.pluggyService.createConnectToken();
    return { accessToken };
  }
}

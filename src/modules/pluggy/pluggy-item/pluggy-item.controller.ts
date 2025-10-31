import { CreatePluggyItemDto } from '@modules/pluggy/dtos/create-pluggy-item.dto';
import { PluggyItemResponseDto } from '@modules/pluggy/pluggy-item/dtos/pluggy-item-response.dto';
import { PluggyItemService } from '@modules/pluggy/pluggy-item/pluggy-item.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedUser } from '../../../auth/auth-user.decorator';
import { FirebaseAuthGuard } from '../../../auth/firebase-auth.guard';
import { User } from '../../../entities/user.entity';
import { PluggyService } from '../pluggy.service';

@ApiTags('Pluggy Items')
@ApiBearerAuth('firebase-auth')
@Controller('pluggy-items')
@UseGuards(FirebaseAuthGuard)
export class PluggyItemController {
  constructor(
    private pluggyItemService: PluggyItemService,
    private pluggyService: PluggyService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar nova conexão bancária via Pluggy',
    description:
      'Salva um novo item conectado via Pluggy associado ao usuário autenticado.',
  })
  @ApiBody({
    type: CreatePluggyItemDto,
    description: 'Dados da conexão bancária',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Conexão bancária criada com sucesso',
    type: PluggyItemResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos fornecidos',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'itemId should not be empty',
          'institution should not be empty',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
    schema: {
      example: {
        statusCode: 401,
        message: 'Token ausente',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Item já existe para este usuário',
    schema: {
      example: {
        statusCode: 409,
        message: 'Item já conectado',
        error: 'Conflict',
      },
    },
  })
  async createPluggyItem(
    @Body() createPluggyItemDto: CreatePluggyItemDto,
    @AuthenticatedUser() user: User,
  ): Promise<PluggyItemResponseDto> {
    const pluggyItem = await this.pluggyItemService.createPluggyItem(
      createPluggyItemDto.itemId,
      createPluggyItemDto.institution,
      createPluggyItemDto.imageUrl,
      user,
    );

    return new PluggyItemResponseDto({
      id: pluggyItem.id,
      itemId: pluggyItem.itemId,
      institution: pluggyItem.institution,
      imageUrl: pluggyItem.imageUrl,
      connectedAt: pluggyItem.connectedAt,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Listar conexões bancárias do usuário',
    description:
      'Retorna todos os itens Pluggy conectados do usuário autenticado.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de conexões bancárias retornada com sucesso',
    type: [PluggyItemResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
    schema: {
      example: {
        statusCode: 401,
        message: 'Token ausente',
        error: 'Unauthorized',
      },
    },
  })
  async getAllPluggyItems(
    @AuthenticatedUser() user: User,
  ): Promise<PluggyItemResponseDto[]> {
    const pluggyItems = await this.pluggyItemService.findAllByUser(user);

    return pluggyItems.map(
      (item) =>
        new PluggyItemResponseDto({
          id: item.id,
          itemId: item.itemId,
          institution: item.institution,
          imageUrl: item.imageUrl,
          connectedAt: item.connectedAt,
        }),
    );
  }

  @Delete(':itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover conexão bancária',
    description:
      'Remove a conexão Pluggy de um usuário. Apenas o proprietário pode remover suas próprias conexões.',
  })
  @ApiParam({
    name: 'itemId',
    type: 'string',
    description: 'ID do item Pluggy a ser removido',
    example: 'pluggy_item_123456',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Conexão bancária removida com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Item não encontrado ou não pertence ao usuário',
    schema: {
      example: {
        statusCode: 404,
        message: 'Pluggy item with ID pluggy_item_123456 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
    schema: {
      example: {
        statusCode: 401,
        message: 'Token ausente',
        error: 'Unauthorized',
      },
    },
  })
  async deletePluggyItem(
    @Param('itemId') itemId: string,
    @AuthenticatedUser() user: User,
  ): Promise<void> {
    await this.pluggyItemService.deleteByItemIdAndUser(itemId, user);
  }

  @Get(':itemId/accounts')
  @ApiOperation({
    summary: 'Buscar contas bancárias do item',
    description:
      'Busca contas bancárias associadas ao item via API do Pluggy. Apenas o proprietário pode acessar suas próprias conexões.',
  })
  @ApiParam({
    name: 'itemId',
    type: 'string',
    description: 'ID do item Pluggy para buscar as contas',
    example: 'pluggy_item_123456',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contas bancárias retornadas com sucesso',
    schema: {
      example: {
        results: [
          {
            id: 'account_123',
            type: 'BANK',
            subtype: 'CHECKING_ACCOUNT',
            name: 'Conta Corrente',
            balance: 1500.5,
            currencyCode: 'BRL',
            item: {
              id: 'pluggy_item_123456',
              connector: {
                name: 'Banco do Brasil',
              },
            },
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Item não encontrado ou não pertence ao usuário',
    schema: {
      example: {
        statusCode: 404,
        message: 'Pluggy item with ID pluggy_item_123456 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
    schema: {
      example: {
        statusCode: 401,
        message: 'Token ausente',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_GATEWAY,
    description: 'Erro na comunicação com a API do Pluggy',
    schema: {
      example: {
        statusCode: 502,
        message: 'Failed to get accounts from Pluggy API',
        error: 'Bad Gateway',
      },
    },
  })
  async getPluggyItemAccounts(
    @Param('itemId') itemId: string,
    @AuthenticatedUser() user: User,
  ): Promise<any> {
    // Primeiro verifica se o usuário tem acesso a este item
    await this.pluggyItemService.findByItemIdAndUser(itemId, user);

    // Depois busca as contas via Pluggy API
    const accounts = await this.pluggyService.getAccountsByItemId(itemId);
    return accounts;
  }
}

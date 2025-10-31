import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro ou array de mensagens de validação',
    oneOf: [
      { type: 'string', example: 'Token ausente' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['itemId should not be empty'],
      },
    ],
  })
  message: string | string[];

  @ApiProperty({
    description: 'Tipo do erro HTTP',
    example: 'Bad Request',
  })
  error: string;
}

export class ValidationErrorResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Array de mensagens de validação',
    type: [String],
    example: ['itemId should not be empty', 'institution should not be empty'],
  })
  message: string[];

  @ApiProperty({
    description: 'Tipo do erro HTTP',
    example: 'Bad Request',
  })
  error: string;
}

export class UnauthorizedResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: 401,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro de autenticação',
    example: 'Token ausente',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo do erro HTTP',
    example: 'Unauthorized',
  })
  error: string;
}

export class NotFoundResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: 404,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de recurso não encontrado',
    example: 'Pluggy item with ID pluggy_item_123456 not found',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo do erro HTTP',
    example: 'Not Found',
  })
  error: string;
}

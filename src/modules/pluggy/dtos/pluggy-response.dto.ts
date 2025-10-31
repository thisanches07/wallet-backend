import { ApiProperty } from '@nestjs/swagger';

export class CreatePluggyUserResponseDto {
  @ApiProperty({
    description: 'ID do usuário criado no Pluggy',
    example: 'user_123456789',
  })
  userId: string;
}

export class CreateConnectTokenResponseDto {
  @ApiProperty({
    description: 'Token de conexão para autenticação do usuário',
    example: 'connect_token_abcdef123456',
  })
  accessToken: string;
}

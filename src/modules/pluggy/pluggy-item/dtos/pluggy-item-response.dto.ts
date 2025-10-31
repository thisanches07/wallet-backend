import { ApiProperty } from '@nestjs/swagger';

export class PluggyItemResponseDto {
  @ApiProperty({
    description: 'ID único do registro no banco de dados',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID único do item retornado pelo Pluggy',
    example: 'pluggy_item_123456',
  })
  itemId: string;

  @ApiProperty({
    description: 'Nome da instituição bancária',
    example: 'Banco do Brasil',
  })
  institution: string;

  @ApiProperty({
    description: 'URL da logo da instituição bancária',
    example: 'https://cdn.pluggy.ai/connectors/assets/bb.png',
  })
  imageUrl: string;

  @ApiProperty({
    description: 'Data e hora da conexão',
    example: '2025-01-21T10:30:00.000Z',
  })
  connectedAt: Date;

  constructor(partial: Partial<PluggyItemResponseDto>) {
    Object.assign(this, partial);
  }
}

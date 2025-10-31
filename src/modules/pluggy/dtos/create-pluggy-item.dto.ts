import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreatePluggyItemDto {
  @ApiProperty({
    description: 'ID único do item retornado pelo Pluggy',
    example: 'pluggy_item_123456',
  })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({
    description: 'Nome da instituição bancária',
    example: 'Banco do Brasil',
  })
  @IsString()
  @IsNotEmpty()
  institution: string;

  @ApiProperty({
    description: 'URL da logo da instituição bancária',
    example: 'https://cdn.pluggy.ai/connectors/assets/bb.png',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  imageUrl: string;
}

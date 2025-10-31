import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PluggyItem } from '../../../entities/pluggy-item.entity';
import { User } from '../../../entities/user.entity';

@Injectable()
export class PluggyItemService {
  constructor(
    @InjectRepository(PluggyItem)
    private pluggyItemRepository: Repository<PluggyItem>,
  ) {}

  async createPluggyItem(
    itemId: string,
    institution: string,
    imageUrl: string,
    user: User,
  ): Promise<PluggyItem> {
    const pluggyItem = this.pluggyItemRepository.create({
      itemId,
      institution,
      imageUrl,
      user,
    });

    return await this.pluggyItemRepository.save(pluggyItem);
  }

  async findAllByUser(user: User): Promise<PluggyItem[]> {
    return await this.pluggyItemRepository.find({
      where: { user: { id: user.id } },
      relations: ['user'],
    });
  }

  async findByItemIdAndUser(itemId: string, user: User): Promise<PluggyItem> {
    const pluggyItem = await this.pluggyItemRepository.findOne({
      where: { itemId, user: { id: user.id } },
      relations: ['user'],
    });

    if (!pluggyItem) {
      throw new NotFoundException(`Pluggy item with ID ${itemId} not found`);
    }

    return pluggyItem;
  }

  async deleteByItemIdAndUser(itemId: string, user: User): Promise<void> {
    const pluggyItem = await this.findByItemIdAndUser(itemId, user);
    await this.pluggyItemRepository.remove(pluggyItem);
  }
}

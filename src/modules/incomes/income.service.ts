import { DateFilterDto } from '@common/dtos/date-filter.dto';
import { Income } from '@entities/income.entity';
import { User } from '@entities/user.entity';
import { PluggyTransactionService } from '@modules/pluggy/pluggy-transactions/pluggy-transaction.service';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { CreateIncomeDto } from './dtos/create-income.dto';
import { UpdateIncomeDto } from './dtos/update-income.dto';

@Injectable()
export class IncomeService {
  constructor(
    @InjectRepository(Income)
    private readonly repo: Repository<Income>,
    private readonly pluggyTransactionService: PluggyTransactionService,
    private readonly logger: Logger,
  ) {}

  async create(dto: CreateIncomeDto, user: User) {
    try {
      const income = {
        description: dto.description,
        amount: dto.amount,
        startDate: dto.startDate,
        endDate: dto.endDate,
        user,
        category: dto.category,
      };

      return await this.repo.save(income);
    } catch (err) {
      this.logger.error('Erro ao salvar renda', { error: err });

      if (err instanceof NotFoundException) {
        throw err;
      }

      throw new InternalServerErrorException('Erro ao salvar renda.');
    }
  }

  async findAllByUser(user: User, filters?: DateFilterDto) {
    try {
      // Busca por transações reais do Pluggy
      const pluggyResponse =
        await this.pluggyTransactionService.getIncomesByUser(user, filters);

      const incomesResponse = [];

      if (pluggyResponse.length > 0) {
        incomesResponse.push(
          ...pluggyResponse.map((tx) => ({
            id: tx.id,
            itemId: tx.itemId,
            type: tx.type,
            description: tx.description,
            amount: +tx.amount,
            date: tx.date,
            category: tx.category,
            source: 'PLUGGY',
          })),
        );
      }

      const queryBuilder = this.repo
        .createQueryBuilder('income')
        .where('income.userId = :userId', { userId: user.id });

      // Aplicar filtros de data se fornecidos
      filters?.month !== undefined &&
        queryBuilder.andWhere('EXTRACT(MONTH FROM income.startDate) = :month', {
          month: filters.month + 1,
        });
      filters?.year !== undefined &&
        queryBuilder.andWhere('EXTRACT(YEAR FROM income.startDate) = :year', {
          year: filters.year,
        });

      const manualIncomes = await queryBuilder
        .orderBy('income.startDate', 'DESC')
        .getMany();
      incomesResponse.push(
        ...manualIncomes.map((income) => ({
          id: income.id,
          itemId: null,
          type: 'INCOME',
          description: income.description,
          amount: +income.amount,
          date: income.startDate,
          category: income.category,
          source: 'MANUAL',
        })),
      );

      return incomesResponse;
    } catch (err) {
      this.logger.error('Erro ao buscar rendas', { error: err });
      throw new InternalServerErrorException('Erro ao buscar rendas.');
    }
  }

  async remove(id: number, user: User) {
    try {
      const income = await this.repo.findOne({
        where: { id, user: { id: user.id } },
      });

      if (!income) {
        throw new NotFoundException('Renda não encontrada.');
      }

      return await this.repo.remove(income);
    } catch (err) {
      this.logger.error('Erro ao remover renda', { error: err });
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Erro ao remover renda.');
    }
  }

  async update(id: number, dto: UpdateIncomeDto, user: User) {
    try {
      const income = await this.repo.findOne({
        where: { id, user: { id: user.id } },
      });

      if (!income) {
        throw new NotFoundException('Renda não encontrada.');
      }

      // Atualizar apenas os campos fornecidos
      Object.assign(income, dto);

      return await this.repo.save(income);
    } catch (err) {
      this.logger.error('Erro ao atualizar renda', {
        error: err,
        incomeId: id,
      });

      if (err instanceof NotFoundException) {
        throw err;
      }

      throw new InternalServerErrorException('Erro ao atualizar renda.');
    }
  }
}

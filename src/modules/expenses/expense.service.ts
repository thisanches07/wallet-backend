import { DateFilterDto } from '@common/dtos/date-filter.dto';
import { Expense } from '@entities/expense.entity';
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
import { CreateExpenseDto } from './dtos/create-expense.dto';
import { UpdateExpenseDto } from './dtos/update-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private readonly repo: Repository<Expense>,
    private readonly pluggyTransactionService: PluggyTransactionService,
    private readonly logger: Logger,
  ) {}

  async create(dto: CreateExpenseDto, user: User) {
    try {
      return await this.repo.save({ ...dto, user });
    } catch (err) {
      this.logger.error('Erro ao salvar despesa', { error: err });

      if (err instanceof NotFoundException) {
        throw err;
      }

      throw new InternalServerErrorException('Erro ao salvar despesa.');
    }
  }

  async findAllByUser(user: User, filters?: DateFilterDto) {
    try {
      // Busca por transações reais do Pluggy
      const pluggyResponse =
        await this.pluggyTransactionService.getExpensesByUser(user, filters);

      const expensesResponse = [];

      if (pluggyResponse.length > 0) {
        expensesResponse.push(
          ...pluggyResponse.map((tx) => ({
            id: tx.id,
            itemId: tx.itemId,
            description: tx.description,
            amount: Math.abs(tx.amount),
            date: tx.date,
            category: tx.category,
            source: 'PLUGGY',
          })),
        );
      }

      const queryBuilder = this.repo
        .createQueryBuilder('expense')
        .where('expense.userId = :userId', { userId: user.id });

      filters?.month !== undefined &&
        queryBuilder.andWhere('EXTRACT(MONTH FROM expense.date) = :month', {
          month: filters.month + 1,
        });
      filters?.year !== undefined &&
        queryBuilder.andWhere('EXTRACT(YEAR FROM expense.date) = :year', {
          year: filters.year,
        });

      const expenses = await queryBuilder
        .orderBy('expense.date', 'DESC')
        .getMany();

      expenses.length &&
        expensesResponse.push(
          ...expenses.map((exp) => ({
            id: exp.id,
            description: exp.description,
            amount: exp.amount,
            date: exp.date,
            category: exp.category,
            source: 'MANUAL',
          })),
        );

      return expensesResponse;
    } catch (err) {
      this.logger.error('Erro ao buscar despesas', { error: err });
      throw new InternalServerErrorException('Erro ao buscar despesas.');
    }
  }

  async remove(id: number, user: User) {
    try {
      const expense = await this.repo.findOne({
        where: { id, user: { id: user.id } },
      });

      if (!expense) {
        throw new NotFoundException('Despesa não encontrada.');
      }

      return await this.repo.remove(expense);
    } catch (err) {
      this.logger.error('Erro ao remover despesa', { error: err });
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Erro ao remover despesa.');
    }
  }

  async getTotalByCategory(user: User, filters?: DateFilterDto) {
    try {
      const queryBuilder = this.repo
        .createQueryBuilder('expense')
        .leftJoin('expense.category', 'category')
        .select('category.name', 'category')
        .addSelect('SUM(expense.amount)', 'total')
        .where('expense.userId = :userId', { userId: user.id });

      // Aplicar filtros de data se fornecidos
      if (filters?.month && filters?.year) {
        queryBuilder
          .andWhere('EXTRACT(MONTH FROM expense.date) = :month', {
            month: filters.month,
          })
          .andWhere('EXTRACT(YEAR FROM expense.date) = :year', {
            year: filters.year,
          });
      } else if (filters?.month) {
        queryBuilder.andWhere('EXTRACT(MONTH FROM expense.date) = :month', {
          month: filters.month,
        });
      } else if (filters?.year) {
        queryBuilder.andWhere('EXTRACT(YEAR FROM expense.date) = :year', {
          year: filters.year,
        });
      }

      const result = await queryBuilder
        .groupBy('category.name')
        .orderBy('total', 'DESC')
        .getRawMany();

      return result.map((row) => ({
        category: row.category,
        total: parseFloat(row.total),
      }));
    } catch (err) {
      this.logger.error('Erro ao agrupar despesas por categoria', {
        error: err,
      });
      throw new InternalServerErrorException('Erro ao agrupar despesas.');
    }
  }

  async update(id: number, dto: UpdateExpenseDto, user: User) {
    try {
      const expense = await this.repo.findOne({
        where: { id, user: { id: user.id } },
        relations: ['category'],
      });

      if (!expense) {
        throw new NotFoundException('Despesa não encontrada.');
      }

      // Atualizar apenas os campos fornecidos
      Object.assign(expense, dto);

      return await this.repo.save(expense);
    } catch (err) {
      this.logger.error('Erro ao atualizar despesa', {
        error: err,
        expenseId: id,
      });

      if (err instanceof NotFoundException) {
        throw err;
      }

      throw new InternalServerErrorException('Erro ao atualizar despesa.');
    }
  }
}

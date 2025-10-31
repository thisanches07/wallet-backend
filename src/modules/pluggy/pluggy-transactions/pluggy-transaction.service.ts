import { DateFilterDto } from '@common/dtos/date-filter.dto';
import { Account } from '@entities/account.entity';
import { Transaction } from '@entities/transaction.entity';
import { User } from '@entities/user.entity';
import { EXCLUDED_CATEGORIES } from '@modules/pluggy/pluggy-transactions/pluggy-transaction.util';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { In, Repository } from 'typeorm';
import { ApiTokenUtil } from 'utils/getApiTokenUtil';

@Injectable()
export class PluggyTransactionService {
  private readonly logger = new Logger(PluggyTransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  async fetchAndSaveTransactions(
    itemId: string,
    userId: number,
  ): Promise<Transaction[]> {
    const apiKey = await ApiTokenUtil.generatePluggyApiKey();

    // 1. Buscar categorias traduzidas
    const categoriesRes = await axios.get('https://api.pluggy.ai/categories', {
      headers: { 'X-API-KEY': apiKey },
    });
    const categoryMap = new Map<string, string>(
      categoriesRes.data.results.map((c: any) => [
        c.description,
        c.descriptionTranslated,
      ]),
    );

    // 2. Buscar contas vinculadas ao item
    const accountsRes = await axios.get(
      `https://api.pluggy.ai/accounts?itemId=${itemId}`,
      { headers: { 'X-API-KEY': apiKey } },
    );
    const pluggyAccounts: any[] = accountsRes.data.results;

    // 2.1 Buscar contas já salvas
    const pluggyAccountIds = pluggyAccounts.map((acc: any) => acc.id);
    const existingAccounts = await this.accountRepo.findBy({
      pluggyAccountId: In(pluggyAccountIds),
    });
    const accountMap = new Map<string, Account>(
      existingAccounts.map((acc) => [acc.pluggyAccountId, acc]),
    );

    // 2.2 Criar novas contas
    const newAccounts = pluggyAccounts
      .filter((acc: any) => !accountMap.has(acc.id))
      .map((acc: any) =>
        this.accountRepo.create({
          pluggyAccountId: acc.id,
          userId,
          name: acc.name,
          type: acc.type,
          subtype: acc.subtype,
          number: acc.number,
          institutionName: acc.institution?.name || null,
          balance: acc.balance,
          availableBalance: acc.availableBalance,
        }),
      );

    const savedNewAccounts = await this.accountRepo.save(newAccounts);
    for (const acc of savedNewAccounts) {
      accountMap.set(acc.pluggyAccountId, acc);
    }

    // 3. Buscar todas as transações de todas as contas
    const allTransactionsFromApi: { tx: any; account: Account }[] = [];
    const allPluggyTransactionIds: string[] = [];

    for (const pluggyAcc of pluggyAccounts) {
      const localAcc = accountMap.get(pluggyAcc.id);
      if (!localAcc) continue;

      let page = 1;
      while (true) {
        const res = await axios.get(
          `https://api.pluggy.ai/transactions?accountId=${pluggyAcc.id}`,
          {
            headers: { 'X-API-KEY': apiKey },
            params: { page, pageSize: 500 },
          },
        );
        const results: any[] = res.data.results;
        if (!results.length) break;

        for (const tx of results) {
          allTransactionsFromApi.push({ tx, account: localAcc });
          allPluggyTransactionIds.push(tx.id);
        }

        page++;
      }
    }

    // 4. Buscar transações já existentes
    const existingTxs = await this.transactionRepo.find({
      where: { pluggyTransactionId: In(allPluggyTransactionIds) },
      select: ['pluggyTransactionId'],
    });
    const existingIds = new Set(existingTxs.map((t) => t.pluggyTransactionId));

    // 5. Criar novas transações
    const newTransactions = allTransactionsFromApi
      .filter(({ tx }) => !existingIds.has(tx.id))
      .map(({ tx, account }) =>
        this.transactionRepo.create({
          pluggyTransactionId: tx.id,
          description: tx.description,
          amount: tx.amount,
          date: tx.date,
          type: tx.amount > 0 ? 'INCOME' : 'EXPENSE',
          category: categoryMap.get(tx.category) || tx.category,
          itemId,
          user: { id: userId },
          account,
        }),
      );

    const saved = await this.transactionRepo.save(newTransactions);
    return saved;
  }

  async getIncomesByUser(user: User, filters?: DateFilterDto) {
    try {
      const queryBuilder = this.transactionRepo
        .createQueryBuilder('transaction')
        .leftJoin('transaction.account', 'account') // JOIN com a conta
        .where('transaction.userId = :userId', { userId: user.id })
        .andWhere('transaction.type = :type', { type: 'INCOME' })
        .andWhere('account.type != :creditType', { creditType: 'CREDIT' }) // Exclui contas de cartão
        .andWhere('transaction.category NOT IN (:...excludedCategories)', {
          excludedCategories: EXCLUDED_CATEGORIES,
        });

      if (filters?.month !== undefined) {
        queryBuilder.andWhere('EXTRACT(MONTH FROM transaction.date) = :month', {
          month: filters.month + 1,
        });
      }

      if (filters?.year !== undefined) {
        queryBuilder.andWhere('EXTRACT(YEAR FROM transaction.date) = :year', {
          year: filters.year,
        });
      }

      return await queryBuilder.getMany();
    } catch (error) {
      this.logger.error('Error fetching incomes:', error);
      throw error;
    }
  }

  async getExpensesByUser(user: User, filters?: DateFilterDto) {
    try {
      // 1. Despesas reais (type = EXPENSE, conta não é crédito)
      const query1 = this.transactionRepo
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.account', 'account')
        .where('transaction.userId = :userId', { userId: user.id })
        .andWhere('transaction.type = :type', { type: 'EXPENSE' })
        .andWhere('account.type != :creditType', { creditType: 'CREDIT' })
        .andWhere('transaction.description != :description', {
          description: 'Pagamento de fatura',
        })
        .andWhere('transaction.category NOT IN (:...excludedCategories)', {
          excludedCategories: EXCLUDED_CATEGORIES,
        });

      // 2. Compras no crédito (type = INCOME em conta CREDIT)
      const query2 = this.transactionRepo
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.account', 'account')
        .where('transaction.userId = :userId', { userId: user.id })
        .andWhere('transaction.type = :type', { type: 'INCOME' })
        .andWhere('account.type = :creditType', { creditType: 'CREDIT' })
        .andWhere('transaction.category NOT IN (:...excludedCategories)', {
          excludedCategories: EXCLUDED_CATEGORIES,
        });

      if (filters?.month !== undefined) {
        const month = filters.month + 1;
        query1.andWhere('EXTRACT(MONTH FROM transaction.date) = :month', {
          month,
        });
        query2.andWhere('EXTRACT(MONTH FROM transaction.date) = :month', {
          month,
        });
      }

      if (filters?.year !== undefined) {
        const year = filters.year;
        query1.andWhere('EXTRACT(YEAR FROM transaction.date) = :year', {
          year,
        });
        query2.andWhere('EXTRACT(YEAR FROM transaction.date) = :year', {
          year,
        });
      }

      const [expenses, creditPurchases] = await Promise.all([
        query1.getMany(),
        query2.getMany(),
      ]);

      const allExpenses = [...expenses, ...creditPurchases].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      return allExpenses;
    } catch (error) {
      this.logger.error('Error fetching expenses:', error);
      throw error;
    }
  }

  async getMonthlySummary(user: User, year: number) {
    // Receitas: INCOME em contas que NÃO são CREDIT + não estão em categorias excluídas
    const pluggyIncomesByMonth = await this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoin('transaction.account', 'account')
      .select([
        'EXTRACT(MONTH FROM transaction.date) as month',
        'COALESCE(SUM(transaction.amount), 0) as total',
      ])
      .where('transaction.userId = :userId', { userId: user.id })
      .andWhere('transaction.type = :type', { type: 'INCOME' })
      .andWhere('account.type != :creditType', { creditType: 'CREDIT' })
      .andWhere('transaction.category NOT IN (:...excludedCategories)', {
        excludedCategories: EXCLUDED_CATEGORIES,
      })
      .andWhere('EXTRACT(YEAR FROM transaction.date) = :year', { year })
      .groupBy('EXTRACT(MONTH FROM transaction.date)')
      .orderBy('month', 'ASC')
      .getRawMany();

    // Despesas:
    // 1. EXPENSE em contas que NÃO são CREDIT
    // 2. INCOME em contas do tipo CREDIT (compra no crédito)
    const pluggyExpenses1 = this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoin('transaction.account', 'account')
      .select([
        'EXTRACT(MONTH FROM transaction.date) as month',
        'COALESCE(SUM(transaction.amount), 0) as total',
      ])
      .where('transaction.userId = :userId', { userId: user.id })
      .andWhere('transaction.type = :type', { type: 'EXPENSE' })
      .andWhere('account.type != :creditType', { creditType: 'CREDIT' })
      .andWhere('transaction.description != :description', {
        description: 'Pagamento de fatura',
      })
      .andWhere('transaction.category NOT IN (:...excludedCategories)', {
        excludedCategories: EXCLUDED_CATEGORIES,
      })
      .andWhere('EXTRACT(YEAR FROM transaction.date) = :year', { year })
      .groupBy('EXTRACT(MONTH FROM transaction.date)');

    const pluggyExpenses2 = this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoin('transaction.account', 'account')
      .select([
        'EXTRACT(MONTH FROM transaction.date) as month',
        'COALESCE(SUM(transaction.amount), 0) as total',
      ])
      .where('transaction.userId = :userId', { userId: user.id })
      .andWhere('transaction.type = :type', { type: 'INCOME' })
      .andWhere('account.type = :creditType', { creditType: 'CREDIT' })
      .andWhere('transaction.category NOT IN (:...excludedCategories)', {
        excludedCategories: EXCLUDED_CATEGORIES,
      })
      .andWhere('EXTRACT(YEAR FROM transaction.date) = :year', { year })
      .groupBy('EXTRACT(MONTH FROM transaction.date)');

    const [res1, res2] = await Promise.all([
      pluggyExpenses1.getRawMany(),
      pluggyExpenses2.getRawMany(),
    ]);

    // Unir despesas (e inverter o sinal, pois INCOME em conta CREDIT ainda vem positivo)
    const expenseMap = new Map<number, number>();

    for (const r of [...res1, ...res2]) {
      const month = parseInt(r.month);
      const value = Math.abs(parseFloat(r.total));
      const current = expenseMap.get(month) || 0;
      expenseMap.set(month, current + value);
    }

    const pluggyExpensesByMonth = Array.from(expenseMap.entries()).map(
      ([month, total]) => ({
        month,
        total,
      }),
    );

    return { pluggyIncomesByMonth, pluggyExpensesByMonth };
  }

  async getMonthlyPluggyDataForExport(user: User, year: number, month: number) {
    try {
      // Receitas: INCOME em contas que não são CREDIT
      const pluggyIncomesByMonth = await this.transactionRepo
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.account', 'account')
        .where('transaction.userId = :userId', { userId: user.id })
        .andWhere('transaction.type = :type', { type: 'INCOME' })
        .andWhere('account.type != :creditType', { creditType: 'CREDIT' })
        .andWhere('transaction.category NOT IN (:...excludedCategories)', {
          excludedCategories: EXCLUDED_CATEGORIES,
        })
        .andWhere('EXTRACT(YEAR FROM transaction.date) = :year', { year })
        .andWhere('EXTRACT(MONTH FROM transaction.date) = :month', { month })
        .orderBy('transaction.date', 'ASC')
        .getMany();

      // Despesas:
      // 1. EXPENSE em conta que não é CREDIT
      const query1 = this.transactionRepo
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.account', 'account')
        .where('transaction.userId = :userId', { userId: user.id })
        .andWhere('transaction.type = :type', { type: 'EXPENSE' })
        .andWhere('account.type != :creditType', { creditType: 'CREDIT' })
        .andWhere('transaction.description != :description', {
          description: 'Pagamento de fatura',
        })
        .andWhere('transaction.category NOT IN (:...excludedCategories)', {
          excludedCategories: EXCLUDED_CATEGORIES,
        })
        .andWhere('EXTRACT(YEAR FROM transaction.date) = :year', { year })
        .andWhere('EXTRACT(MONTH FROM transaction.date) = :month', { month });

      // 2. INCOME em conta do tipo CREDIT (compra no crédito)
      const query2 = this.transactionRepo
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.account', 'account')
        .where('transaction.userId = :userId', { userId: user.id })
        .andWhere('transaction.type = :type', { type: 'INCOME' })
        .andWhere('account.type = :creditType', { creditType: 'CREDIT' })
        .andWhere('transaction.category NOT IN (:...excludedCategories)', {
          excludedCategories: EXCLUDED_CATEGORIES,
        })
        .andWhere('EXTRACT(YEAR FROM transaction.date) = :year', { year })
        .andWhere('EXTRACT(MONTH FROM transaction.date) = :month', { month });

      const [res1, res2] = await Promise.all([
        query1.getMany(),
        query2.getMany(),
      ]);

      const pluggyExpensesByMonth = [...res1, ...res2].map((tx) => ({
        ...tx,
        amount: Math.abs(Number(tx.amount)),
      }));

      return { pluggyIncomesByMonth, pluggyExpensesByMonth };
    } catch (err) {
      this.logger.error('Erro ao buscar dados mensais para exportação', {
        error: err,
        userId: user.id,
        year,
        month,
      });
      throw new InternalServerErrorException(
        'Erro ao buscar dados no Pluggy para exportação.',
      );
    }
  }

  async getMonthlyPluggyDataByCategory(
    user: User,
    year: number,
    month: number,
  ): Promise<{
    incomesByCategory: { categoryName: string; total: number; count: number }[];
    expensesByCategory: {
      categoryName: string;
      total: number;
      count: number;
    }[];
  }> {
    try {
      // INCOME em contas que não são CREDIT → RECEITA
      const incomes = await this.transactionRepo
        .createQueryBuilder('transaction')
        .leftJoin('transaction.account', 'account')
        .select([
          'transaction.category as categoryName',
          'COALESCE(SUM(transaction.amount), 0) as total',
          'COUNT(transaction.id) as count',
        ])
        .where('transaction.userId = :userId', { userId: user.id })
        .andWhere('transaction.type = :type', { type: 'INCOME' })
        .andWhere('account.type != :creditType', { creditType: 'CREDIT' })
        .andWhere('transaction.category NOT IN (:...excludedCategories)', {
          excludedCategories: EXCLUDED_CATEGORIES,
        })
        .andWhere('EXTRACT(YEAR FROM transaction.date) = :year', { year })
        .andWhere('EXTRACT(MONTH FROM transaction.date) = :month', { month })
        .groupBy('transaction.category')
        .getRawMany();

      // EXPENSE em conta != CREDIT e INCOME em conta == CREDIT → DESPESA
      const expenses1 = this.transactionRepo
        .createQueryBuilder('transaction')
        .leftJoin('transaction.account', 'account')
        .select([
          'transaction.category as categoryName',
          'COALESCE(SUM(transaction.amount), 0) as total',
          'COUNT(transaction.id) as count',
        ])
        .where('transaction.userId = :userId', { userId: user.id })
        .andWhere('transaction.type = :type', { type: 'EXPENSE' })
        .andWhere('account.type != :creditType', { creditType: 'CREDIT' })
        .andWhere('transaction.description != :description', {
          description: 'Pagamento de fatura',
        })
        .andWhere('transaction.category NOT IN (:...excludedCategories)', {
          excludedCategories: EXCLUDED_CATEGORIES,
        })
        .andWhere('EXTRACT(YEAR FROM transaction.date) = :year', { year })
        .andWhere('EXTRACT(MONTH FROM transaction.date) = :month', { month })
        .groupBy('transaction.category');

      const expenses2 = this.transactionRepo
        .createQueryBuilder('transaction')
        .leftJoin('transaction.account', 'account')
        .select([
          'transaction.category as categoryName',
          'COALESCE(SUM(transaction.amount), 0) as total',
          'COUNT(transaction.id) as count',
        ])
        .where('transaction.userId = :userId', { userId: user.id })
        .andWhere('transaction.type = :type', { type: 'INCOME' }) // compra no crédito
        .andWhere('account.type = :creditType', { creditType: 'CREDIT' })
        .andWhere('transaction.category NOT IN (:...excludedCategories)', {
          excludedCategories: EXCLUDED_CATEGORIES,
        })
        .andWhere('EXTRACT(YEAR FROM transaction.date) = :year', { year })
        .andWhere('EXTRACT(MONTH FROM transaction.date) = :month', { month })
        .groupBy('transaction.category');

      const [expensesRes1, expensesRes2] = await Promise.all([
        expenses1.getRawMany(),
        expenses2.getRawMany(),
      ]);

      // Agrupamento combinado
      const expenseMap = new Map<string, { total: number; count: number }>();

      [...expensesRes1, ...expensesRes2].forEach((e) => {
        const key = e.categoryname || 'Sem categoria';
        const existing = expenseMap.get(key) || { total: 0, count: 0 };
        expenseMap.set(key, {
          total: existing.total + parseFloat(e.total),
          count: existing.count + parseInt(e.count),
        });
      });

      const expensesByCategory = Array.from(expenseMap.entries()).map(
        ([categoryName, data]) => ({
          categoryName,
          total: Math.abs(data.total), // inverter sinal
          count: data.count,
        }),
      );

      const incomesByCategory = incomes.map((r) => ({
        categoryName: r.categoryname,
        total: parseFloat(r.total),
        count: parseInt(r.count),
      }));

      return { incomesByCategory, expensesByCategory };
    } catch (err) {
      this.logger.error(
        'Erro ao buscar dados por categoria nas transações do Pluggy',
        {
          error: err,
          userId: user.id,
          year,
          month,
        },
      );
      throw new InternalServerErrorException(
        'Erro ao buscar dados por categoria nas transações do Pluggy.',
      );
    }
  }

  async getYearlyEvolutionDataFromPluggy(
    user: User,
    year: number,
  ): Promise<{
    monthlyIncomes: {
      month: number;
      total: number;
      count: number;
      average: number;
    }[];
    monthlyExpenses: {
      month: number;
      total: number;
      count: number;
      average: number;
    }[];
  }> {
    try {
      const incomeQuery = this.transactionRepo
        .createQueryBuilder('transaction')
        .leftJoin('transaction.account', 'account')
        .select([
          'EXTRACT(MONTH FROM transaction.date) as month',
          'SUM(transaction.amount) as total',
          'COUNT(transaction.id) as count',
          'AVG(transaction.amount) as average',
        ])
        .where('transaction.userId = :userId', { userId: user.id })
        .andWhere('transaction.type = :type', { type: 'INCOME' })
        .andWhere('account.type != :creditType', { creditType: 'CREDIT' })
        .andWhere('transaction.category NOT IN (:...excludedCategories)', {
          excludedCategories: EXCLUDED_CATEGORIES,
        })
        .andWhere('EXTRACT(YEAR FROM transaction.date) = :year', { year })
        .groupBy('month');

      const expenseQuery1 = this.transactionRepo
        .createQueryBuilder('transaction')
        .leftJoin('transaction.account', 'account')
        .select([
          'EXTRACT(MONTH FROM transaction.date) as month',
          'SUM(transaction.amount) as total',
          'COUNT(transaction.id) as count',
          'AVG(transaction.amount) as average',
        ])
        .where('transaction.userId = :userId', { userId: user.id })
        .andWhere('transaction.type = :type', { type: 'EXPENSE' })
        .andWhere('account.type != :creditType', { creditType: 'CREDIT' })
        .andWhere('transaction.description != :description', {
          description: 'Pagamento de fatura',
        })
        .andWhere('transaction.category NOT IN (:...excludedCategories)', {
          excludedCategories: EXCLUDED_CATEGORIES,
        })
        .andWhere('EXTRACT(YEAR FROM transaction.date) = :year', { year })
        .groupBy('month');

      const expenseQuery2 = this.transactionRepo
        .createQueryBuilder('transaction')
        .leftJoin('transaction.account', 'account')
        .select([
          'EXTRACT(MONTH FROM transaction.date) as month',
          'SUM(transaction.amount) as total',
          'COUNT(transaction.id) as count',
          'AVG(transaction.amount) as average',
        ])
        .where('transaction.userId = :userId', { userId: user.id })
        .andWhere('transaction.type = :type', { type: 'INCOME' }) // compra no crédito
        .andWhere('account.type = :creditType', { creditType: 'CREDIT' })
        .andWhere('transaction.category NOT IN (:...excludedCategories)', {
          excludedCategories: EXCLUDED_CATEGORIES,
        })
        .andWhere('EXTRACT(YEAR FROM transaction.date) = :year', { year })
        .groupBy('month');

      const [rawIncomes, rawExpenses1, rawExpenses2] = await Promise.all([
        incomeQuery.getRawMany(),
        expenseQuery1.getRawMany(),
        expenseQuery2.getRawMany(),
      ]);

      const parseResults = (arr: any[]) =>
        arr.map((r) => ({
          month: parseInt(r.month),
          total: parseFloat(r.total),
          count: parseInt(r.count),
          average: parseFloat(r.average),
        }));

      // Agrupar receitas
      const monthlyIncomes = parseResults(rawIncomes);

      // Agrupar despesas (query 1 + query 2)
      const combinedExpenses = [...rawExpenses1, ...rawExpenses2];
      const tempMap = new Map<number, { total: number; count: number }>();

      combinedExpenses.forEach((r) => {
        const month = parseInt(r.month);
        const total = Math.abs(parseFloat(r.total));
        const count = parseInt(r.count);

        const existing = tempMap.get(month) || { total: 0, count: 0 };
        tempMap.set(month, {
          total: existing.total + total,
          count: existing.count + count,
        });
      });

      const monthlyExpenses = Array.from(tempMap.entries()).map(
        ([month, data]) => ({
          month,
          total: Math.abs(data.total),
          count: data.count,
          average: data.count > 0 ? Math.abs(data.total / data.count) : 0,
        }),
      );

      return { monthlyIncomes, monthlyExpenses };
    } catch (err) {
      this.logger.error(
        'Erro ao buscar evolução anual nas transações do Pluggy',
        {
          error: err,
          userId: user.id,
          year,
        },
      );
      throw new InternalServerErrorException(
        'Erro ao buscar evolução anual nas transações do Pluggy.',
      );
    }
  }
}

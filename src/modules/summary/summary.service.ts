import { Expense } from '@entities/expense.entity';
import { Income } from '@entities/income.entity';
import { User } from '@entities/user.entity';
import { PluggyTransactionService } from '@modules/pluggy/pluggy-transactions/pluggy-transaction.service';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';
import { Logger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import {
  MonthlySummaryDto,
  YearlySummaryDto,
} from './dtos/monthly-summary.dto';

@Injectable()
export class SummaryService {
  constructor(
    @InjectRepository(Income)
    private readonly incomeRepo: Repository<Income>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,

    private readonly pluggyTransactionService: PluggyTransactionService,
    private readonly logger: Logger,
  ) {}

  async getMonthlySummary(
    user: User,
    year: number,
  ): Promise<MonthlySummaryDto[]> {
    try {
      // Buscar receitas e despesas do Pluggy agrupadas por mês
      const { pluggyIncomesByMonth, pluggyExpensesByMonth } =
        await this.pluggyTransactionService.getMonthlySummary(user, year);

      // Buscar receitas manuais agrupadas por mês
      const incomesByMonth = await this.incomeRepo
        .createQueryBuilder('income')
        .select([
          'EXTRACT(MONTH FROM income.startDate) as month',
          'COALESCE(SUM(income.amount), 0) as total',
        ])
        .where('income.userId = :userId', { userId: user.id })
        .andWhere('EXTRACT(YEAR FROM income.startDate) = :year', { year })
        .groupBy('EXTRACT(MONTH FROM income.startDate)')
        .orderBy('month', 'ASC')
        .getRawMany();

      // Buscar despesas manuais agrupadas por mês
      const expensesByMonth = await this.expenseRepo
        .createQueryBuilder('expense')
        .select([
          'EXTRACT(MONTH FROM expense.date) as month',
          'COALESCE(SUM(expense.amount), 0) as total',
        ])
        .where('expense.userId = :userId', { userId: user.id })
        .andWhere('EXTRACT(YEAR FROM expense.date) = :year', { year })
        .groupBy('EXTRACT(MONTH FROM expense.date)')
        .orderBy('month', 'ASC')
        .getRawMany();

      // Mapa de receitas (manual + pluggy)
      const incomesMap = new Map<number, number>();
      incomesByMonth.forEach(({ month, total }) => {
        const m = parseInt(month);
        incomesMap.set(m, parseFloat(total));
      });
      pluggyIncomesByMonth.forEach(({ month, total }) => {
        const m = parseInt(month);
        const existing = incomesMap.get(m) || 0;
        incomesMap.set(m, existing + parseFloat(total));
      });

      // Mapa de despesas (manual + pluggy)
      const expensesMap = new Map<number, number>();
      expensesByMonth.forEach(({ month, total }) => {
        const m = parseInt(month);
        expensesMap.set(m, Math.abs(parseFloat(total)));
      });
      pluggyExpensesByMonth.forEach(({ month, total }) => {
        const m = parseInt(month.toString()); // garante que seja string
        const existing = expensesMap.get(m) || 0;
        const amount = Math.abs(parseFloat(total.toString()));
        expensesMap.set(m, existing + amount);
      });

      // Criar resumo para todos os meses até o atual
      const monthlySummaries: MonthlySummaryDto[] = [];
      for (let month = 1; month <= new Date().getMonth() + 1; month++) {
        const totalIncomes = incomesMap.get(month) || 0;
        const totalExpenses = expensesMap.get(month) || 0;

        monthlySummaries.push({
          year,
          month,
          totalIncomes,
          totalExpenses,
          balance: parseFloat((totalIncomes - totalExpenses).toFixed(2)),
        });
      }

      return monthlySummaries;
    } catch (err) {
      this.logger.error('Erro ao buscar resumo mensal', { error: err });
      throw new InternalServerErrorException('Erro ao buscar resumo mensal.');
    }
  }

  async getYearlySummary(user: User, year: number): Promise<YearlySummaryDto> {
    try {
      const monthlySummaries = await this.getMonthlySummary(user, year);

      const totalYearIncomes = monthlySummaries.reduce(
        (sum, month) => sum + month.totalIncomes,
        0,
      );
      const totalYearExpenses = monthlySummaries.reduce(
        (sum, month) => sum + month.totalExpenses,
        0,
      );

      return {
        year,
        // arredonda para duas casas decimais
        monthlySummaries: monthlySummaries.map((month) => ({
          ...month,
          totalIncomes: parseFloat(month.totalIncomes.toFixed(2)),
          totalExpenses: parseFloat(month.totalExpenses.toFixed(2)),
          balance: parseFloat(
            (month.totalIncomes - month.totalExpenses).toFixed(2),
          ),
        })),
        totalYearIncomes: parseFloat(totalYearIncomes.toFixed(2)),
        totalYearExpenses: parseFloat(totalYearExpenses.toFixed(2)),
        yearBalance: parseFloat(
          (totalYearIncomes - totalYearExpenses).toFixed(2),
        ),
      };
    } catch (err) {
      this.logger.error('Erro ao buscar resumo anual', { error: err });
      throw new InternalServerErrorException('Erro ao buscar resumo anual.');
    }
  }

  async getMonthlyDataForExport(user: User, year: number, month: number) {
    try {
      // Buscar receitas do mês
      const incomes = await this.incomeRepo
        .createQueryBuilder('income')
        .where('income.userId = :userId', { userId: user.id })
        .andWhere('EXTRACT(YEAR FROM income.startDate) = :year', { year })
        .andWhere('EXTRACT(MONTH FROM income.startDate) = :month', { month })
        .orderBy('income.startDate', 'ASC')
        .getMany();

      // Buscar despesas do mês
      const expenses = await this.expenseRepo
        .createQueryBuilder('expense')
        .where('expense.userId = :userId', { userId: user.id })
        .andWhere('EXTRACT(YEAR FROM expense.date) = :year', { year })
        .andWhere('EXTRACT(MONTH FROM expense.date) = :month', { month })
        .orderBy('expense.date', 'ASC')
        .getMany();

      return { incomes, expenses };
    } catch (err) {
      this.logger.error('Erro ao buscar dados mensais para exportação', {
        error: err,
        userId: user.id,
        year,
        month,
      });
      throw new InternalServerErrorException(
        'Erro ao buscar dados para exportação.',
      );
    }
  }

  async getMonthlyDataByCategory(user: User, year: number, month: number) {
    try {
      // Buscar receitas agrupadas por categoria (string)
      const incomesByCategory = await this.incomeRepo
        .createQueryBuilder('income')
        .select([
          'income.category as categoryName',
          'COALESCE(SUM(income.amount), 0) as total',
          'COUNT(income.id) as count',
        ])
        .where('income.userId = :userId', { userId: user.id })
        .andWhere('EXTRACT(YEAR FROM income.startDate) = :year', { year })
        .andWhere('EXTRACT(MONTH FROM income.startDate) = :month', { month })
        .groupBy('income.category')
        .orderBy('total', 'DESC')
        .getRawMany();

      // Buscar despesas agrupadas por categoria (string)
      const expensesByCategory = await this.expenseRepo
        .createQueryBuilder('expense')
        .select([
          'expense.category as categoryName',
          'COALESCE(SUM(expense.amount), 0) as total',
          'COUNT(expense.id) as count',
        ])
        .where('expense.userId = :userId', { userId: user.id })
        .andWhere('EXTRACT(YEAR FROM expense.date) = :year', { year })
        .andWhere('EXTRACT(MONTH FROM expense.date) = :month', { month })
        .groupBy('expense.category')
        .orderBy('total', 'DESC')
        .getRawMany();

      return { incomesByCategory, expensesByCategory };
    } catch (err) {
      this.logger.error('Erro ao buscar dados por categoria para exportação', {
        error: err,
        userId: user.id,
        year,
        month,
      });
      throw new InternalServerErrorException(
        'Erro ao buscar dados por categoria para exportação.',
      );
    }
  }

  async exportMonthlyDataToExcel(
    user: User,
    year: number,
    month: number,
  ): Promise<Buffer> {
    try {
      const { pluggyIncomesByMonth, pluggyExpensesByMonth } =
        await this.pluggyTransactionService.getMonthlyPluggyDataForExport(
          user,
          year,
          month,
        );

      const totalIncomes = [];
      const totalExpenses = [];
      pluggyIncomesByMonth.length && totalIncomes.push(...pluggyIncomesByMonth);
      pluggyExpensesByMonth.length &&
        totalExpenses.push(...pluggyExpensesByMonth);

      const { incomes, expenses } = await this.getMonthlyDataForExport(
        user,
        year,
        month,
      );
      incomes.length && totalIncomes.push(...incomes);
      expenses.length && totalExpenses.push(...expenses);
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Wallet App';
      workbook.created = new Date();

      // Aba de Receitas
      const incomeSheet = workbook.addWorksheet('Receitas');
      incomeSheet.columns = [
        { header: 'Data', key: 'date', width: 15 },
        { header: 'Descrição', key: 'description', width: 30 },
        { header: 'Categoria', key: 'category', width: 20 },
        { header: 'Valor (R$)', key: 'amount', width: 15 },
      ];

      // Estilo do cabeçalho - aplicar apenas às células com dados
      const incomeHeaderRow = incomeSheet.getRow(1);
      for (let col = 1; col <= 4; col++) {
        const cell = incomeHeaderRow.getCell(col);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4CAF50' },
        };
      }

      // Adicionar dados de receitas
      incomes.forEach((income) => {
        incomeSheet.addRow({
          date: income.startDate,
          description: income.description,
          category: income.category,
          amount: parseFloat(income.amount.toString()),
        });
      });

      pluggyIncomesByMonth.forEach((income) => {
        incomeSheet.addRow({
          date: income.date,
          description: income.description,
          category: income.category,
          amount: parseFloat(income.amount.toString()),
        });
      });

      // Formatar coluna de valores
      incomeSheet.getColumn('amount').numFmt = 'R$ #,##0.00';

      // Total de receitas
      const totalIncomesAmount = totalIncomes.reduce(
        (sum, income) => sum + parseFloat(income.amount.toString()),
        0,
      );
      const totalIncomeRow = incomeSheet.addRow({
        date: '',
        description: 'TOTAL',
        category: '',
        amount: totalIncomesAmount,
      });
      // Aplicar estilo apenas às células com dados
      for (let col = 1; col <= 4; col++) {
        const cell = totalIncomeRow.getCell(col);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE8F5E8' },
        };
      }

      // Aba de Despesas
      const expenseSheet = workbook.addWorksheet('Despesas');
      expenseSheet.columns = [
        { header: 'Data', key: 'date', width: 15 },
        { header: 'Descrição', key: 'description', width: 30 },
        { header: 'Categoria', key: 'category', width: 20 },
        { header: 'Valor (R$)', key: 'amount', width: 15 },
      ];

      // Estilo do cabeçalho - aplicar apenas às células com dados
      const expenseHeaderRow = expenseSheet.getRow(1);
      for (let col = 1; col <= 4; col++) {
        const cell = expenseHeaderRow.getCell(col);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF44336' },
        };
      }
      pluggyExpensesByMonth.forEach((expense) => {
        expenseSheet.addRow({
          date: expense.date,
          description: expense.description,
          category: expense.category,
          amount: parseFloat(expense.amount.toString()),
        });
      });

      // Adicionar dados de despesas
      expenses.forEach((expense) => {
        expenseSheet.addRow({
          date: expense.date,
          description: expense.description,
          category: expense.category,
          amount: parseFloat(expense.amount.toString()),
        });
      });

      // Formatar coluna de valores
      expenseSheet.getColumn('amount').numFmt = 'R$ #,##0.00';

      // Total de despesas
      const totalExpensesAmount = totalExpenses.reduce(
        (sum, expense) => sum + parseFloat(expense.amount.toString()),
        0,
      );
      const totalExpenseRow = expenseSheet.addRow({
        date: '',
        description: 'TOTAL',
        category: '',
        amount: totalExpensesAmount,
      });
      // Aplicar estilo apenas às células com dados
      for (let col = 1; col <= 4; col++) {
        const cell = totalExpenseRow.getCell(col);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFDE8E8' },
        };
      }

      // Aba de Resumo
      const summarySheet = workbook.addWorksheet('Resumo');
      summarySheet.columns = [
        { header: 'Tipo', key: 'type', width: 20 },
        { header: 'Valor (R$)', key: 'amount', width: 20 },
      ];

      // Estilo do cabeçalho - aplicar apenas às células com dados
      const summaryHeaderRow = summarySheet.getRow(1);
      for (let col = 1; col <= 2; col++) {
        const cell = summaryHeaderRow.getCell(col);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2196F3' },
        };
      }

      const balance = totalIncomesAmount - totalExpensesAmount;
      const summaryData = [
        { type: 'Total de Receitas', amount: totalIncomesAmount },
        { type: 'Total de Despesas', amount: totalExpensesAmount },
        { type: 'Saldo', amount: balance },
      ];

      summaryData.forEach((item, index) => {
        const row = summarySheet.addRow(item);
        if (index === 2) {
          // Linha do saldo
          // Aplicar estilo apenas às células com dados
          for (let col = 1; col <= 2; col++) {
            const cell = row.getCell(col);
            cell.font = { bold: true };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: balance >= 0 ? 'FFE8F5E8' : 'FFFDE8E8' },
            };
          }
        }
      });

      summarySheet.getColumn('amount').numFmt = 'R$ #,##0.00';

      // Gerar buffer do Excel
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (err) {
      this.logger.error('Erro ao exportar dados para Excel', {
        error: err,
        userId: user.id,
        year,
        month,
      });
      throw new InternalServerErrorException('Erro ao gerar arquivo Excel.');
    }
  }
  async getMergedMonthlyDataByCategory(
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
    const manual = await this.getMonthlyDataByCategory(user, year, month);
    const pluggy =
      await this.pluggyTransactionService.getMonthlyPluggyDataByCategory(
        user,
        year,
        month,
      );

    const mergeCategoryData = (
      a: { categoryName: string; total: number; count: number }[],
      b: { categoryName: string; total: number; count: number }[],
    ) => {
      const map = new Map<string, { total: number; count: number }>();

      [...a, ...b].forEach(({ categoryName, total, count }) => {
        const existing = map.get(categoryName) || { total: 0, count: 0 };
        map.set(categoryName, {
          total: existing.total + total,
          count: existing.count + count,
        });
      });

      return Array.from(map.entries())
        .map(([categoryName, data]) => ({
          categoryName,
          total: data.total,
          count: data.count,
        }))
        .sort((a, b) => b.total - a.total); // ordena por total desc
    };

    return {
      incomesByCategory: mergeCategoryData(
        manual.incomesByCategory,
        pluggy.incomesByCategory,
      ),
      expensesByCategory: mergeCategoryData(
        manual.expensesByCategory,
        pluggy.expensesByCategory,
      ),
    };
  }

  async exportMonthlyCategoryDataToExcel(
    user: User,
    year: number,
    month: number,
  ): Promise<Buffer> {
    try {
      const { incomesByCategory, expensesByCategory } =
        await this.getMergedMonthlyDataByCategory(user, year, month);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Wallet App';
      workbook.created = new Date();

      // Aba de Receitas por Categoria
      const incomeSheet = workbook.addWorksheet('Receitas por Categoria');
      incomeSheet.columns = [
        { header: 'Categoria', key: 'category', width: 25 },
        { header: 'Quantidade', key: 'count', width: 15 },
        { header: 'Valor Total (R$)', key: 'total', width: 18 },
        { header: 'Percentual (%)', key: 'percentage', width: 15 },
      ];

      // Estilo do cabeçalho
      const incomeHeaderRow = incomeSheet.getRow(1);
      for (let col = 1; col <= 4; col++) {
        const cell = incomeHeaderRow.getCell(col);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4CAF50' },
        };
        cell.alignment = { horizontal: 'center' };
      }

      // Calcular total de receitas para percentuais
      const totalIncomes = incomesByCategory.reduce(
        (sum, item) => sum + item.total,
        0,
      );

      // Adicionar dados de receitas por categoria
      incomesByCategory.forEach((item) => {
        const percentage =
          totalIncomes > 0 ? (item.total / totalIncomes) * 100 : 0;
        incomeSheet.addRow({
          category: item.categoryName || 'Sem categoria',
          count: item.count,
          total: item.total,
          percentage: percentage,
        });
      });

      // Formatar colunas
      incomeSheet.getColumn('total').numFmt = 'R$ #,##0.00';
      incomeSheet.getColumn('percentage').numFmt = '0.00"%"';
      incomeSheet.getColumn('count').alignment = { horizontal: 'center' };

      // Total de receitas
      const totalIncomeRow = incomeSheet.addRow({
        category: 'TOTAL',
        count: incomesByCategory.reduce((sum, item) => sum + item.count, 0),
        total: totalIncomes,
        percentage: 100,
      });
      for (let col = 1; col <= 4; col++) {
        const cell = totalIncomeRow.getCell(col);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE8F5E8' },
        };
      }

      // Aba de Despesas por Categoria
      const expenseSheet = workbook.addWorksheet('Despesas por Categoria');
      expenseSheet.columns = [
        { header: 'Categoria', key: 'category', width: 25 },
        { header: 'Quantidade', key: 'count', width: 15 },
        { header: 'Valor Total (R$)', key: 'total', width: 18 },
        { header: 'Percentual (%)', key: 'percentage', width: 15 },
      ];

      // Estilo do cabeçalho
      const expenseHeaderRow = expenseSheet.getRow(1);
      for (let col = 1; col <= 4; col++) {
        const cell = expenseHeaderRow.getCell(col);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF44336' },
        };
        cell.alignment = { horizontal: 'center' };
      }

      // Calcular total de despesas para percentuais
      const totalExpenses = expensesByCategory.reduce(
        (sum, item) => sum + item.total,
        0,
      );

      // Adicionar dados de despesas por categoria
      expensesByCategory.forEach((item) => {
        const percentage =
          totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0;
        expenseSheet.addRow({
          category: item.categoryName || 'Sem categoria',
          count: item.count,
          total: item.total,
          percentage: percentage,
        });
      });

      // Formatar colunas
      expenseSheet.getColumn('total').numFmt = 'R$ #,##0.00';
      expenseSheet.getColumn('percentage').numFmt = '0.00"%"';
      expenseSheet.getColumn('count').alignment = { horizontal: 'center' };

      // Total de despesas
      const totalExpenseRow = expenseSheet.addRow({
        category: 'TOTAL',
        count: expensesByCategory.reduce((sum, item) => sum + item.count, 0),
        total: totalExpenses,
        percentage: 100,
      });
      for (let col = 1; col <= 4; col++) {
        const cell = totalExpenseRow.getCell(col);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFDE8E8' },
        };
      }

      // Aba de Comparativo Geral
      const comparisonSheet = workbook.addWorksheet(
        'Comparativo por Categoria',
      );
      comparisonSheet.columns = [
        { header: 'Categoria', key: 'category', width: 25 },
        { header: 'Receitas (R$)', key: 'incomes', width: 18 },
        { header: 'Despesas (R$)', key: 'expenses', width: 18 },
        { header: 'Saldo (R$)', key: 'balance', width: 18 },
      ];

      // Estilo do cabeçalho
      const comparisonHeaderRow = comparisonSheet.getRow(1);
      for (let col = 1; col <= 4; col++) {
        const cell = comparisonHeaderRow.getCell(col);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2196F3' },
        };
        cell.alignment = { horizontal: 'center' };
      }

      // Criar mapa de categorias
      const categoryMap = new Map();

      incomesByCategory.forEach((item) => {
        const categoryName = item.categoryName || 'Sem categoria';
        categoryMap.set(categoryName, {
          category: categoryName,
          incomes: item.total,
          expenses: 0,
        });
      });

      expensesByCategory.forEach((item) => {
        const categoryName = item.categoryName || 'Sem categoria';
        if (categoryMap.has(categoryName)) {
          categoryMap.get(categoryName).expenses = item.total;
        } else {
          categoryMap.set(categoryName, {
            category: categoryName,
            incomes: 0,
            expenses: item.total,
          });
        }
      });

      // Adicionar dados comparativos
      Array.from(categoryMap.values())
        .sort((a, b) => b.incomes - b.expenses - (a.incomes - a.expenses))
        .forEach((item) => {
          const balance = item.incomes - item.expenses;
          const row = comparisonSheet.addRow({
            category: item.category,
            incomes: item.incomes,
            expenses: item.expenses,
            balance: balance,
          });

          // Colorir saldo baseado no valor
          const balanceCell = row.getCell(4);
          balanceCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: balance >= 0 ? 'FFE8F5E8' : 'FFFDE8E8' },
          };
        });

      // Formatar colunas monetárias
      comparisonSheet.getColumn('incomes').numFmt = 'R$ #,##0.00';
      comparisonSheet.getColumn('expenses').numFmt = 'R$ #,##0.00';
      comparisonSheet.getColumn('balance').numFmt = 'R$ #,##0.00';

      // Total geral
      const generalBalance = totalIncomes - totalExpenses;
      const totalRow = comparisonSheet.addRow({
        category: 'TOTAL GERAL',
        incomes: totalIncomes,
        expenses: totalExpenses,
        balance: generalBalance,
      });
      for (let col = 1; col <= 4; col++) {
        const cell = totalRow.getCell(col);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: generalBalance >= 0 ? 'FFE8F5E8' : 'FFFDE8E8' },
        };
      }

      // Gerar buffer do Excel
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (err) {
      this.logger.error('Erro ao exportar dados por categoria para Excel', {
        error: err,
        userId: user.id,
        year,
        month,
      });
      throw new InternalServerErrorException(
        'Erro ao gerar arquivo Excel por categoria.',
      );
    }
  }

  async getYearlyEvolutionData(user: User, year: number) {
    try {
      // Buscar evolução de receitas mensais
      const monthlyIncomes = await this.incomeRepo
        .createQueryBuilder('income')
        .select([
          'EXTRACT(MONTH FROM income.startDate) as month',
          'COALESCE(SUM(income.amount), 0) as total',
          'COUNT(income.id) as count',
          'COALESCE(AVG(income.amount), 0) as average',
        ])
        .where('income.userId = :userId', { userId: user.id })
        .andWhere('EXTRACT(YEAR FROM income.startDate) = :year', { year })
        .groupBy('EXTRACT(MONTH FROM income.startDate)')
        .orderBy('month', 'ASC')
        .getRawMany();

      // Buscar evolução de despesas mensais
      const monthlyExpenses = await this.expenseRepo
        .createQueryBuilder('expense')
        .select([
          'EXTRACT(MONTH FROM expense.date) as month',
          'COALESCE(SUM(expense.amount), 0) as total',
          'COUNT(expense.id) as count',
          'COALESCE(AVG(expense.amount), 0) as average',
        ])
        .where('expense.userId = :userId', { userId: user.id })
        .andWhere('EXTRACT(YEAR FROM expense.date) = :year', { year })
        .groupBy('EXTRACT(MONTH FROM expense.date)')
        .orderBy('month', 'ASC')
        .getRawMany();

      return { monthlyIncomes, monthlyExpenses };
    } catch (err) {
      this.logger.error('Erro ao buscar dados de evolução anual', {
        error: err,
        userId: user.id,
        year,
      });
      throw new InternalServerErrorException(
        'Erro ao buscar dados de evolução anual.',
      );
    }
  }

  async getMergedYearlyEvolutionData(
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
    const manual = await this.getYearlyEvolutionData(user, year);
    const pluggy =
      await this.pluggyTransactionService.getYearlyEvolutionDataFromPluggy(
        user,
        year,
      );

    const mergeByMonth = (
      a: { month: number; total: number; count: number; average: number }[],
      b: { month: number; total: number; count: number; average: number }[],
    ) => {
      const map = new Map<
        number,
        { total: number; count: number; average: number }
      >();

      [...a, ...b].forEach(({ month, total, count }) => {
        const existing = map.get(month) || { total: 0, count: 0, average: 0 };
        const newTotal = existing.total + total;
        const newCount = existing.count + count;
        const newAverage = newCount > 0 ? newTotal / newCount : 0;

        map.set(month, {
          total: newTotal,
          count: newCount,
          average: newAverage,
        });
      });

      return Array.from(map.entries())
        .map(([month, data]) => ({
          month,
          total: data.total,
          count: data.count,
          average: data.average,
        }))
        .sort((a, b) => a.month - b.month); // ordenar por mês ASC
    };

    return {
      monthlyIncomes: mergeByMonth(
        manual.monthlyIncomes,
        pluggy.monthlyIncomes,
      ),
      monthlyExpenses: mergeByMonth(
        manual.monthlyExpenses,
        pluggy.monthlyExpenses,
      ),
    };
  }

  async exportYearlyEvolutionToExcel(
    user: User,
    year: number,
  ): Promise<Buffer> {
    try {
      const { monthlyIncomes, monthlyExpenses } =
        await this.getMergedYearlyEvolutionData(user, year);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Wallet App';
      workbook.created = new Date();

      // Criar mapas para facilitar acesso aos dados
      const incomesMap = new Map();
      const expensesMap = new Map();

      monthlyIncomes.forEach((item) => {
        incomesMap.set(item.month, {
          total: item.total,
          count: item.count,
          average: item.average,
        });
      });

      monthlyExpenses.forEach((item) => {
        expensesMap.set(item.month, {
          total: item.total,
          count: item.count,
          average: item.average,
        });
      });

      // Aba de Evolução Geral
      const evolutionSheet = workbook.addWorksheet('Evolução Anual');
      evolutionSheet.columns = [
        { header: 'Mês', key: 'month', width: 15 },
        { header: 'Receitas (R$)', key: 'incomes', width: 18 },
        { header: 'Despesas (R$)', key: 'expenses', width: 18 },
        { header: 'Saldo (R$)', key: 'balance', width: 18 },
        { header: 'Variação Receitas (%)', key: 'incomeVariation', width: 20 },
        { header: 'Variação Despesas (%)', key: 'expenseVariation', width: 20 },
      ];

      // Estilo do cabeçalho
      const evolutionHeaderRow = evolutionSheet.getRow(1);
      for (let col = 1; col <= 6; col++) {
        const cell = evolutionHeaderRow.getCell(col);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2196F3' },
        };
        cell.alignment = { horizontal: 'center' };
      }

      const monthNames = [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
      ];

      let previousIncomes = 0;
      let previousExpenses = 0;

      // Adicionar dados mensais
      for (let month = 1; month <= 12; month++) {
        const incomeData = incomesMap.get(month) || {
          total: 0,
          count: 0,
          average: 0,
        };
        const expenseData = expensesMap.get(month) || {
          total: 0,
          count: 0,
          average: 0,
        };

        const currentIncomes = incomeData.total;
        const currentExpenses = expenseData.total;
        const balance = currentIncomes - currentExpenses;

        // Calcular variações percentuais
        const incomeVariation =
          previousIncomes > 0
            ? ((currentIncomes - previousIncomes) / previousIncomes) * 100
            : 0;
        const expenseVariation =
          previousExpenses > 0
            ? ((currentExpenses - previousExpenses) / previousExpenses) * 100
            : 0;

        const row = evolutionSheet.addRow({
          month: monthNames[month - 1],
          incomes: currentIncomes,
          expenses: currentExpenses,
          balance: balance,
          incomeVariation: month === 1 ? 0 : incomeVariation,
          expenseVariation: month === 1 ? 0 : expenseVariation,
        });

        // Colorir saldo baseado no valor
        const balanceCell = row.getCell(4);
        balanceCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: balance >= 0 ? 'FFE8F5E8' : 'FFFDE8E8' },
        };

        // Colorir variações
        if (month > 1) {
          const incomeVariationCell = row.getCell(5);
          incomeVariationCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: incomeVariation >= 0 ? 'FFE8F5E8' : 'FFFDE8E8' },
          };

          const expenseVariationCell = row.getCell(6);
          expenseVariationCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: expenseVariation <= 0 ? 'FFE8F5E8' : 'FFFDE8E8' },
          };
        }

        previousIncomes = currentIncomes;
        previousExpenses = currentExpenses;
      }

      // Formatar colunas
      evolutionSheet.getColumn('incomes').numFmt = 'R$ #,##0.00';
      evolutionSheet.getColumn('expenses').numFmt = 'R$ #,##0.00';
      evolutionSheet.getColumn('balance').numFmt = 'R$ #,##0.00';
      evolutionSheet.getColumn('incomeVariation').numFmt = '0.00"%"';
      evolutionSheet.getColumn('expenseVariation').numFmt = '0.00"%"';

      // Aba de Estatísticas Detalhadas
      const statsSheet = workbook.addWorksheet('Estatísticas Mensais');
      statsSheet.columns = [
        { header: 'Mês', key: 'month', width: 15 },
        { header: 'Qtd. Receitas', key: 'incomeCount', width: 15 },
        { header: 'Média Receitas (R$)', key: 'incomeAverage', width: 20 },
        { header: 'Qtd. Despesas', key: 'expenseCount', width: 15 },
        { header: 'Média Despesas (R$)', key: 'expenseAverage', width: 20 },
        { header: 'Total Transações', key: 'totalTransactions', width: 18 },
      ];

      // Estilo do cabeçalho
      const statsHeaderRow = statsSheet.getRow(1);
      for (let col = 1; col <= 6; col++) {
        const cell = statsHeaderRow.getCell(col);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF9C27B0' },
        };
        cell.alignment = { horizontal: 'center' };
      }

      // Adicionar dados estatísticos
      for (let month = 1; month <= 12; month++) {
        const incomeData = incomesMap.get(month) || {
          total: 0,
          count: 0,
          average: 0,
        };
        const expenseData = expensesMap.get(month) || {
          total: 0,
          count: 0,
          average: 0,
        };

        statsSheet.addRow({
          month: monthNames[month - 1],
          incomeCount: incomeData.count,
          incomeAverage: incomeData.average,
          expenseCount: expenseData.count,
          expenseAverage: expenseData.average,
          totalTransactions: incomeData.count + expenseData.count,
        });
      }

      // Formatar colunas
      statsSheet.getColumn('incomeAverage').numFmt = 'R$ #,##0.00';
      statsSheet.getColumn('expenseAverage').numFmt = 'R$ #,##0.00';
      statsSheet.getColumn('incomeCount').alignment = { horizontal: 'center' };
      statsSheet.getColumn('expenseCount').alignment = { horizontal: 'center' };
      statsSheet.getColumn('totalTransactions').alignment = {
        horizontal: 'center',
      };

      // Adicionar totais anuais na aba de estatísticas
      const totalIncomes = Array.from(incomesMap.values()).reduce(
        (sum, data) => sum + data.total,
        0,
      );
      const totalExpenses = Array.from(expensesMap.values()).reduce(
        (sum, data) => sum + data.total,
        0,
      );
      const totalIncomeTransactions = Array.from(incomesMap.values()).reduce(
        (sum, data) => sum + data.count,
        0,
      );
      const totalExpenseTransactions = Array.from(expensesMap.values()).reduce(
        (sum, data) => sum + data.count,
        0,
      );

      const totalRow = statsSheet.addRow({
        month: 'TOTAL ANUAL',
        incomeCount: totalIncomeTransactions,
        incomeAverage:
          totalIncomeTransactions > 0
            ? totalIncomes / totalIncomeTransactions
            : 0,
        expenseCount: totalExpenseTransactions,
        expenseAverage:
          totalExpenseTransactions > 0
            ? totalExpenses / totalExpenseTransactions
            : 0,
        totalTransactions: totalIncomeTransactions + totalExpenseTransactions,
      });

      for (let col = 1; col <= 6; col++) {
        const cell = totalRow.getCell(col);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE1BEE7' },
        };
      }

      // Aba de Resumo Anual
      const summarySheet = workbook.addWorksheet('Resumo Anual');
      summarySheet.columns = [
        { header: 'Indicador', key: 'indicator', width: 30 },
        { header: 'Valor', key: 'value', width: 20 },
      ];

      // Estilo do cabeçalho
      const summaryHeaderRow = summarySheet.getRow(1);
      for (let col = 1; col <= 2; col++) {
        const cell = summaryHeaderRow.getCell(col);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4CAF50' },
        };
        cell.alignment = { horizontal: 'center' };
      }

      const yearBalance = totalIncomes - totalExpenses;
      const avgMonthlyIncomes = totalIncomes / 12;
      const avgMonthlyExpenses = totalExpenses / 12;

      const summaryData = [
        { indicator: 'Total de Receitas no Ano', value: totalIncomes },
        { indicator: 'Total de Despesas no Ano', value: totalExpenses },
        { indicator: 'Saldo Anual', value: yearBalance },
        { indicator: 'Média Mensal de Receitas', value: avgMonthlyIncomes },
        { indicator: 'Média Mensal de Despesas', value: avgMonthlyExpenses },
        {
          indicator: 'Total de Transações',
          value: totalIncomeTransactions + totalExpenseTransactions,
        },
      ];

      summaryData.forEach((item, index) => {
        const row = summarySheet.addRow(item);
        if (index === 2) {
          // Saldo anual
          for (let col = 1; col <= 2; col++) {
            const cell = row.getCell(col);
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: yearBalance >= 0 ? 'FFE8F5E8' : 'FFFDE8E8' },
            };
          }
        }
      });

      summarySheet.getColumn('value').numFmt =
        '[>999999] R$ #,##0.00_);[>0] R$ #,##0.00;0';

      // Gerar buffer do Excel
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (err) {
      this.logger.error('Erro ao exportar evolução anual para Excel', {
        error: err,
        userId: user.id,
        year,
      });
      throw new InternalServerErrorException(
        'Erro ao gerar arquivo Excel de evolução anual.',
      );
    }
  }
}

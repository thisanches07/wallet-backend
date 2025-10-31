// src/db/data-source.ts
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Account } from '../entities/account.entity';
import { Expense } from '../entities/expense.entity';
import { Income } from '../entities/income.entity';
import { PluggyItem } from '../entities/pluggy-item.entity';
import { Transaction } from '../entities/transaction.entity';
import { UserIncomeAllocation } from '../entities/user-income-allocation.entity';
import { User } from '../entities/user.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    User,
    Expense,
    Income,
    UserIncomeAllocation,
    PluggyItem,
    Transaction,
    Account,
  ],
  migrations: ['src/db/migrations/*.ts'],
  synchronize: false,
});

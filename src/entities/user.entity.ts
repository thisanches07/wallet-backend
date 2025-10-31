import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Account } from './account.entity';
import { Expense } from './expense.entity';
import { Income } from './income.entity';
import { PluggyItem } from './pluggy-item.entity';
import { UserIncomeAllocation } from './user-income-allocation.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  firebase_uuid: string;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 50 })
  email: string;

  @OneToMany(() => Income, (i) => i.user)
  incomes: Income[];

  @OneToMany(() => UserIncomeAllocation, (uia) => uia.user)
  incomeAllocations: UserIncomeAllocation[];

  @OneToMany(() => Expense, (expense) => expense.user)
  expenses: Expense[];

  @OneToMany(() => PluggyItem, (pluggyItem) => pluggyItem.user)
  pluggyItems: PluggyItem[];

  @OneToMany(() => Account, (account) => account.user)
  accounts: Account[];
}

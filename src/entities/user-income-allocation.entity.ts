import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserIncomeAllocation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  fixedSalary: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  extraIncome: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalMonthlyIncome: number;

  @Column('decimal', { precision: 5, scale: 2 })
  investmentsPercentage: number;

  @Column('decimal', { precision: 5, scale: 2 })
  expensesPercentage: number;

  @Column('decimal', { precision: 5, scale: 2 })
  leisurePercentage: number;

  @Column('decimal', { precision: 10, scale: 2 })
  investmentsAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  expensesAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  leisureAmount: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.incomeAllocations)
  user: User;
}

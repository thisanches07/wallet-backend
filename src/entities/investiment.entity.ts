import { InvestmentSubType } from 'enum/investment-subtype.enum';
import { InvestmentType } from 'enum/investment-type.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InvestmentInstitution } from './Investment-institution';
import { PluggyItem } from './pluggy-item.entity';

@Entity('investments')
export class Investment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  code: string;

  @Column({ nullable: true })
  isin: string;

  @Column({ nullable: true })
  number: string;

  @Column({ nullable: true })
  owner: string;

  @Column({ nullable: true })
  currencyCode: string;

  @Column({
    type: 'enum',
    enum: InvestmentType,
  })
  type: InvestmentType;

  @Column({
    type: 'enum',
    enum: InvestmentSubType,
    nullable: true,
  })
  subtype: InvestmentSubType;

  @Column({ type: 'decimal', nullable: true })
  lastMonthRate: number;

  @Column({ type: 'decimal', nullable: true })
  lastTwelveMonthsRate: number;

  @Column({ type: 'decimal', nullable: true })
  annualRate: number;

  @Column({ type: 'timestamp', nullable: true })
  date: Date;

  @Column({ type: 'decimal', nullable: true })
  value: number;

  @Column({ type: 'decimal', nullable: true })
  quantity: number;

  @Column({ type: 'decimal' })
  amount: number;

  @Column({ type: 'decimal', nullable: true })
  taxes: number;

  @Column({ type: 'decimal', nullable: true })
  taxes2: number;

  @Column({ type: 'decimal', nullable: true })
  balance: number;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ type: 'decimal', nullable: true })
  rate: number;

  @Column({ nullable: true })
  rateType: string;

  @Column({ type: 'decimal', nullable: true })
  fixedAnnualRate: number;

  @Column({ nullable: true })
  issuer: string;

  @Column({ type: 'timestamp', nullable: true })
  issueDate: Date;

  @Column({ type: 'decimal', nullable: true })
  amountProfit: number;

  @Column({ type: 'decimal', nullable: true })
  amountWithdrawal: number;

  @Column({ type: 'decimal', nullable: true })
  amountOriginal: number;

  @Column({ nullable: true })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    taxRegime?: string;
    proposalNumber?: string;
    processNumber?: string;
    fundName?: string;
    insurer?: {
      cnpj: string;
      name: string;
    };
  };

  @Column({ nullable: true })
  providerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(
    () => InvestmentInstitution,
    (institution) => institution.investments,
    {
      nullable: true,
      cascade: true,
      eager: true,
    },
  )
  @JoinColumn({ name: 'institutionId' })
  @ManyToOne(() => InvestmentInstitution, { cascade: true, eager: true })
  institution: InvestmentInstitution;

  @Column({ nullable: true })
  institutionId: string;

  @ManyToOne(() => PluggyItem, { eager: false })
  @JoinColumn({ name: 'pluggyItemId' })
  pluggyItem: PluggyItem;

  @Column()
  pluggyItemId: number;
}

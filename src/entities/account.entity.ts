import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Transaction } from './transaction.entity';
import { User } from './user.entity';

@Entity('account')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  // ID da conta no Pluggy
  @Column({ unique: true })
  pluggyAccountId: string;

  // Conta associada ao usuário
  @ManyToOne(() => User, (user) => user.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  // Nome da conta (ex: Nubank, Bradesco Conta Corrente, etc)
  @Column()
  name: string;

  // Tipo de conta: CHECKING, SAVINGS, CREDIT, etc
  @Column()
  type: string;

  // Subtipo: conta_corrente, conta_poupanca, credit_card, etc
  @Column({ nullable: true })
  subtype: string;

  // Número da conta ou identificação adicional (se desejar)
  @Column({ nullable: true })
  number: string;

  // Instituição financeira
  @Column({ nullable: true })
  institutionName: string;

  // Saldo atual
  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  balance: number;

  // Saldo disponível
  @Column('decimal', { precision: 14, scale: 2, nullable: true })
  availableBalance: number;

  @OneToMany(() => Transaction, (transaction) => transaction.account)
  transactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

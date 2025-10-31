import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class PluggyItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  itemId: string;

  @Column({ length: 100 })
  institution: string;

  @Column({ type: 'text' })
  imageUrl: string;

  @CreateDateColumn()
  connectedAt: Date;

  @ManyToOne(() => User, (user) => user.pluggyItems)
  user: User;
}

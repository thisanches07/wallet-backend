import { Expense } from '@entities/expense.entity';
import { Transaction } from '@entities/transaction.entity';
import { ExpenseService } from '@modules/expenses/expense.service';
import { FirebaseModule } from '@modules/firebase/firebase.module';
import { PluggyTransactionModule } from '@modules/pluggy/pluggy-transactions/pluggy-transaction.module';
import { UserModule } from '@modules/users/user.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseController } from 'modules/expenses/expense.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, Transaction]),
    UserModule,
    FirebaseModule,
    PluggyTransactionModule,
  ],
  controllers: [ExpenseController],
  providers: [ExpenseService],
})
export class ExpenseModule {}

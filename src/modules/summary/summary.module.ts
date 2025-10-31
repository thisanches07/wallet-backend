import { Expense } from '@entities/expense.entity';
import { Income } from '@entities/income.entity';
import { FirebaseModule } from '@modules/firebase/firebase.module';
import { PluggyTransactionModule } from '@modules/pluggy/pluggy-transactions/pluggy-transaction.module';
import { UserModule } from '@modules/users/user.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Income, Expense]),
    FirebaseModule,
    UserModule,
    PluggyTransactionModule,
  ],
  controllers: [SummaryController],
  providers: [SummaryService],
  exports: [SummaryService],
})
export class SummaryModule {}

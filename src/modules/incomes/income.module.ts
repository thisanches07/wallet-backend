import { Income } from '@entities/income.entity';
import { FirebaseModule } from '@modules/firebase/firebase.module';
import { IncomeService } from '@modules/incomes/income.service';
import { PluggyTransactionModule } from '@modules/pluggy/pluggy-transactions/pluggy-transaction.module';
import { UserModule } from '@modules/users/user.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncomeController } from 'modules/incomes/income.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Income]),
    UserModule,
    FirebaseModule,
    PluggyTransactionModule,
  ],
  controllers: [IncomeController],
  providers: [IncomeService],
})
export class IncomeModule {}

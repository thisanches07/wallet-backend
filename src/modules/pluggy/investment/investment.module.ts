import { Investment } from '@entities/investiment.entity';
import { InvestmentInstitution } from '@entities/Investment-institution';
import { FirebaseModule } from '@modules/firebase/firebase.module';
import { InvestmentController } from '@modules/pluggy/investment/investment.controller';
import { InvestmentService } from '@modules/pluggy/investment/investment.service';
import { PluggyModule } from '@modules/pluggy/pluggy.module';
import { UserModule } from '@modules/users/user.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Investment, InvestmentInstitution]),
    PluggyModule,
    UserModule,
    FirebaseModule,
  ],
  controllers: [InvestmentController],
  providers: [InvestmentService],
})
export class InvestmentModule {}

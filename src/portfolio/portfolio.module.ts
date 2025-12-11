import { FirebaseModule } from '@modules/firebase/firebase.module';
import { UserModule } from '@modules/users/user.module';
import { Module } from '@nestjs/common';
import { AllocationsModule } from '../allocations/allocations.module';
import { PositionsModule } from '../positions/positions.module';
import { PortfolioController } from './portfolio.controller';
import { RebalanceService } from './rebalance.service';

@Module({
  imports: [AllocationsModule, PositionsModule, FirebaseModule, UserModule],
  controllers: [PortfolioController],
  providers: [RebalanceService],
  exports: [RebalanceService],
})
export class PortfolioModule {}

import { Module } from '@nestjs/common';
import { PositionsModule } from '../positions/positions.module';
import { AllocationsService } from './allocations.service';

@Module({
  imports: [PositionsModule],
  providers: [AllocationsService],
  exports: [AllocationsService],
})
export class AllocationsModule {}

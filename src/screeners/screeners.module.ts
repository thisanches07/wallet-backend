import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module';
import { CryptoScreener } from './crypto.screener';
import { EquitiesScreener } from './equities.screener';
import { FiisScreener } from './fiis.screener';
import { IntlScreener } from './intl.screener';
import { TreasuryScreener } from './treasury.screener';

@Module({
  imports: [ProvidersModule],
  providers: [
    TreasuryScreener,
    EquitiesScreener,
    FiisScreener,
    IntlScreener,
    CryptoScreener,
  ],
  exports: [
    TreasuryScreener,
    EquitiesScreener,
    FiisScreener,
    IntlScreener,
    CryptoScreener,
  ],
})
export class ScreenersModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CryptoProvider } from './crypto.provider';
import { EquitiesProvider } from './equities.provider';
import { FundsProvider } from './funds.provider';
import { MacroProvider } from './macro.provider';
import { TesouroProvider } from './tesouro.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    TesouroProvider,
    MacroProvider,
    EquitiesProvider,
    FundsProvider,
    CryptoProvider,
  ],
  exports: [
    TesouroProvider,
    MacroProvider,
    EquitiesProvider,
    FundsProvider,
    CryptoProvider,
  ],
})
export class ProvidersModule {}

import { Expense } from '@entities/expense.entity';
import { Income } from '@entities/income.entity';
import { UserIncomeAllocation } from '@entities/user-income-allocation.entity';
import { User } from '@entities/user.entity';
import { ExpenseModule } from '@modules/expenses/expense.module';
import { FirebaseModule } from '@modules/firebase/firebase.module';
import { HealthModule } from '@modules/health/health.module';
import { IncomeModule } from '@modules/incomes/income.module';
import { InvestmentModule } from '@modules/pluggy/investment/investment.module';
import { PluggyModule } from '@modules/pluggy/pluggy.module';
import { SummaryModule } from '@modules/summary/summary.module';
import { UserModule } from '@modules/users/user.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [
        LoggerModule.forRoot({
          pinoHttp: {
            level: 'info',
          },
        }),
        ConfigModule,
      ],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [User, Expense, Income, UserIncomeAllocation],
        synchronize: false,
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    FirebaseModule,
    HealthModule,
    UserModule,
    IncomeModule,
    ExpenseModule,
    SummaryModule,
    PluggyModule,
    InvestmentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

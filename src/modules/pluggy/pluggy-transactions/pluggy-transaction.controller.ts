import { AuthenticatedUser } from '@auth/auth-user.decorator';
import { FirebaseAuthGuard } from '@auth/firebase-auth.guard';
import { User } from '@entities/user.entity';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PluggyTransactionService } from './pluggy-transaction.service';

@Controller('pluggy-items/:itemId/transactions')
@UseGuards(FirebaseAuthGuard)
export class PluggyTransactionController {
  constructor(private readonly pluggyTxService: PluggyTransactionService) {}

  @Get()
  async syncTransactions(
    @Param('itemId') itemId: string,
    @AuthenticatedUser() req: User,
  ) {
    const userId = req.id;
    const transactions = await this.pluggyTxService.fetchAndSaveTransactions(
      itemId,
      userId,
    );
    return { data: transactions };
  }
}

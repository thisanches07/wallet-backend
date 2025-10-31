import { AuthenticatedUser } from '@auth/auth-user.decorator';
import { FirebaseAuthGuard } from '@auth/firebase-auth.guard';
import { DateFilterDto } from '@common/dtos/date-filter.dto';
import { User } from '@entities/user.entity';
import { CreateExpenseDto } from '@modules/expenses/dtos/create-expense.dto';
import {
  ExpenseCategoryTotalDto,
  ExpenseResponseDto,
} from '@modules/expenses/dtos/expense-response.dto';
import { UpdateExpenseDto } from '@modules/expenses/dtos/update-expense.dto';
import { ExpenseService } from '@modules/expenses/expense.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Expenses')
@ApiBearerAuth('firebase-auth')
@UseGuards(FirebaseAuthGuard)
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly service: ExpenseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new expense' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Expense created successfully',
    type: ExpenseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing token',
  })
  create(@Body() dto: CreateExpenseDto, @AuthenticatedUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all expenses for the authenticated user' })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Month to filter (0-11)',
    example: 5,
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Year to filter',
    example: 2025,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of expenses retrieved successfully',
    type: [ExpenseResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing token',
  })
  findAll(@Query() filters: DateFilterDto, @AuthenticatedUser() user: User) {
    return this.service.findAllByUser(user, filters);
  }

  @Get('/categories')
  @ApiOperation({ summary: 'Get expenses grouped by category' })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Month to filter (1-12)',
    example: 5,
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Year to filter',
    example: 2025,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expenses grouped by category retrieved successfully',
    type: [ExpenseCategoryTotalDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing token',
  })
  findAllByCategory(
    @Query() filters: DateFilterDto,
    @AuthenticatedUser() user: User,
  ) {
    return this.service.getTotalByCategory(user, filters);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense' })
  @ApiParam({ name: 'id', description: 'Expense ID', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expense updated successfully',
    type: ExpenseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Expense not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing token',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
    @AuthenticatedUser() user: User,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiParam({ name: 'id', description: 'Expense ID', type: 'number' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Expense deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Expense not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing token',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @AuthenticatedUser() user: User,
  ) {
    return this.service.remove(id, user);
  }
}

import { AuthenticatedUser } from '@auth/auth-user.decorator';
import { FirebaseAuthGuard } from '@auth/firebase-auth.guard';
import { DateFilterDto } from '@common/dtos/date-filter.dto';
import { User } from '@entities/user.entity';
import { CreateIncomeDto } from '@modules/incomes/dtos/create-income.dto';
import { IncomeResponseDto } from '@modules/incomes/dtos/income-response.dto';
import { UpdateIncomeDto } from '@modules/incomes/dtos/update-income.dto';
import { IncomeService } from '@modules/incomes/income.service';
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

@ApiTags('Incomes')
@ApiBearerAuth('firebase-auth')
@UseGuards(FirebaseAuthGuard)
@Controller('incomes')
export class IncomeController {
  constructor(private readonly service: IncomeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new income' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Income created successfully',
    type: IncomeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing token',
  })
  create(@Body() dto: CreateIncomeDto, @AuthenticatedUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all incomes for the authenticated user' })
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
    description: 'List of incomes retrieved successfully',
    type: [IncomeResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing token',
  })
  findAll(@Query() filters: DateFilterDto, @AuthenticatedUser() user: User) {
    return this.service.findAllByUser(user, filters);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an income' })
  @ApiParam({ name: 'id', description: 'Income ID', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Income updated successfully',
    type: IncomeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Income not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing token',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIncomeDto,
    @AuthenticatedUser() user: User,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an income' })
  @ApiParam({ name: 'id', description: 'Income ID', type: 'number' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Income deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Income not found',
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

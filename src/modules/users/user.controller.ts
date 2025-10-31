import { UserAuth } from '@auth/auth.decorator';
import { AuthenticatedUser } from '@auth/auth-user.decorator';
import { FirebaseAuthGuard } from '@auth/firebase-auth.guard';
import { User } from '@entities/user.entity';
import { UpdateUserDto } from '@modules/users/dtos/update-user.dto';
import { UserResponseDto } from '@modules/users/dtos/user-response.dto';
import { 
  CreateIncomeAllocationStep1Dto,
  CreateIncomeAllocationStep2Dto,
  CreateIncomeAllocationCompleteDto 
} from '@modules/users/dtos/create-income-allocation.dto';
import { 
  IncomeAllocationResponseDto,
  IncomeAllocationPreviewDto 
} from '@modules/users/dtos/income-allocation-response.dto';
import { UserService } from '@modules/users/user.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import admin from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';

@ApiTags('Users')
@ApiBearerAuth('firebase-auth')
@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing token',
  })
  getProfile(@UserAuth() user: admin.auth.DecodedIdToken) {
    return this.usersService.findOrCreateFromFirebase(user);
  }

  @UseGuards(FirebaseAuthGuard)
  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing token',
  })
  updateMe(@UserAuth() user: DecodedIdToken, @Body() body: UpdateUserDto) {
    return this.usersService.updateByFirebaseUid(user.uid, body);
  }

  @UseGuards(FirebaseAuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User account deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing token',
  })
  deleteMe(@UserAuth() user: DecodedIdToken) {
    return this.usersService.removeByFirebaseUid(user.uid);
  }

  // Income Allocation Routes
  @UseGuards(FirebaseAuthGuard)
  @Post('income-allocation/preview')
  @ApiOperation({
    summary: 'Previsualizar alocação de renda',
    description: 'Gera uma prévia da alocação de renda baseada nos dados fornecidos nas etapas 1 e 2',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prévia da alocação gerada com sucesso',
    type: IncomeAllocationPreviewDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos - verificar se soma dos percentuais não excede 100%',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autorizado',
  })
  async previewIncomeAllocation(
    @AuthenticatedUser() user: User,
    @Body() body: CreateIncomeAllocationStep1Dto & CreateIncomeAllocationStep2Dto,
  ): Promise<IncomeAllocationPreviewDto> {
    const step1Data: CreateIncomeAllocationStep1Dto = {
      fixedSalary: body.fixedSalary,
      extraIncome: body.extraIncome,
    };
    
    const step2Data: CreateIncomeAllocationStep2Dto = {
      investmentsPercentage: body.investmentsPercentage,
      expensesPercentage: body.expensesPercentage,
    };

    return this.usersService.previewIncomeAllocation(user, step1Data, step2Data);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('income-allocation')
  @ApiOperation({
    summary: 'Criar nova alocação de renda',
    description: 'Cria uma nova configuração de alocação de renda para o usuário',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Alocação de renda criada com sucesso',
    type: IncomeAllocationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos - verificar se soma dos percentuais não excede 100%',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autorizado',
  })
  async createIncomeAllocation(
    @AuthenticatedUser() user: User,
    @Body() createDto: CreateIncomeAllocationCompleteDto,
  ): Promise<IncomeAllocationResponseDto> {
    return this.usersService.createIncomeAllocation(user, createDto);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('income-allocation')
  @ApiOperation({
    summary: 'Obter alocação de renda atual',
    description: 'Retorna a configuração de alocação de renda ativa do usuário',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Alocação de renda obtida com sucesso',
    type: IncomeAllocationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Nenhuma alocação de renda encontrada',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autorizado',
  })
  async getCurrentIncomeAllocation(
    @AuthenticatedUser() user: User,
  ): Promise<IncomeAllocationResponseDto | null> {
    return this.usersService.getCurrentIncomeAllocation(user);
  }

  @UseGuards(FirebaseAuthGuard)
  @Put('income-allocation')
  @ApiOperation({
    summary: 'Atualizar alocação de renda',
    description: 'Atualiza a configuração de alocação de renda ativa do usuário',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Alocação de renda atualizada com sucesso',
    type: IncomeAllocationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos - verificar se soma dos percentuais não excede 100%',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Nenhuma alocação de renda ativa encontrada',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autorizado',
  })
  async updateIncomeAllocation(
    @AuthenticatedUser() user: User,
    @Body() updateDto: CreateIncomeAllocationCompleteDto,
  ): Promise<IncomeAllocationResponseDto> {
    return this.usersService.updateIncomeAllocation(user, updateDto);
  }
}

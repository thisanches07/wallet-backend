import { User } from '@entities/user.entity';
import { UserIncomeAllocation } from '@entities/user-income-allocation.entity';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import admin from 'firebase-admin';
import { Repository } from 'typeorm';
import { 
  CreateIncomeAllocationStep1Dto, 
  CreateIncomeAllocationStep2Dto,
  CreateIncomeAllocationCompleteDto 
} from './dtos/create-income-allocation.dto';
import { 
  IncomeAllocationResponseDto, 
  IncomeAllocationPreviewDto 
} from './dtos/income-allocation-response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserIncomeAllocation)
    private readonly incomeAllocationRepository: Repository<UserIncomeAllocation>,
  ) {}

  async findOrCreateFromFirebase(
    decoded: admin.auth.DecodedIdToken,
  ): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { firebase_uuid: decoded.uid },
    });
    console.log('Existing User', existingUser);

    if (existingUser) {
      return existingUser;
    }

    const newUser = this.userRepository.create({
      firebase_uuid: decoded.uid,
      name: decoded.name ?? '',
      email: decoded.email ?? '',
    });

    return this.userRepository.save(newUser);
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, data);
    return this.findById(id);
  }

  async updateByFirebaseUid(
    firebaseUid: string,
    data: Partial<User>,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { firebase_uuid: firebaseUid },
    });
    if (!user) throw new Error('User not found');
    Object.assign(user, data);
    return this.userRepository.save(user);
  }

  // Métodos para Income Allocation
  async previewIncomeAllocation(
    user: User,
    step1Data: CreateIncomeAllocationStep1Dto,
    step2Data: CreateIncomeAllocationStep2Dto,
  ): Promise<IncomeAllocationPreviewDto> {
    const totalMonthlyIncome = step1Data.fixedSalary + (step1Data.extraIncome || 0);
    const leisurePercentage = 100 - step2Data.investmentsPercentage - step2Data.expensesPercentage;

    if (leisurePercentage < 0) {
      throw new BadRequestException('A soma dos percentuais não pode exceder 100%');
    }

    const investmentsAmount = (totalMonthlyIncome * step2Data.investmentsPercentage) / 100;
    const expensesAmount = (totalMonthlyIncome * step2Data.expensesPercentage) / 100;
    const leisureAmount = (totalMonthlyIncome * leisurePercentage) / 100;

    return {
      totalMonthlyIncome,
      investmentsAmount: Math.round(investmentsAmount * 100) / 100,
      expensesAmount: Math.round(expensesAmount * 100) / 100,
      leisureAmount: Math.round(leisureAmount * 100) / 100,
      investmentsPercentage: step2Data.investmentsPercentage,
      expensesPercentage: step2Data.expensesPercentage,
      leisurePercentage,
    };
  }

  async createIncomeAllocation(
    user: User,
    createDto: CreateIncomeAllocationCompleteDto,
  ): Promise<IncomeAllocationResponseDto> {
    // Desativar alocação anterior se existir
    await this.incomeAllocationRepository.update(
      { user: { id: user.id }, isActive: true },
      { isActive: false }
    );

    const totalMonthlyIncome = createDto.fixedSalary + (createDto.extraIncome || 0);
    const leisurePercentage = 100 - createDto.investmentsPercentage - createDto.expensesPercentage;

    if (leisurePercentage < 0) {
      throw new BadRequestException('A soma dos percentuais não pode exceder 100%');
    }

    const investmentsAmount = (totalMonthlyIncome * createDto.investmentsPercentage) / 100;
    const expensesAmount = (totalMonthlyIncome * createDto.expensesPercentage) / 100;
    const leisureAmount = (totalMonthlyIncome * leisurePercentage) / 100;

    const incomeAllocation = this.incomeAllocationRepository.create({
      user,
      fixedSalary: createDto.fixedSalary,
      extraIncome: createDto.extraIncome || 0,
      totalMonthlyIncome,
      investmentsPercentage: createDto.investmentsPercentage,
      expensesPercentage: createDto.expensesPercentage,
      leisurePercentage,
      investmentsAmount: Math.round(investmentsAmount * 100) / 100,
      expensesAmount: Math.round(expensesAmount * 100) / 100,
      leisureAmount: Math.round(leisureAmount * 100) / 100,
      isActive: true,
    });

    const savedAllocation = await this.incomeAllocationRepository.save(incomeAllocation);

    return {
      id: savedAllocation.id,
      fixedSalary: Number(savedAllocation.fixedSalary),
      extraIncome: Number(savedAllocation.extraIncome),
      totalMonthlyIncome: Number(savedAllocation.totalMonthlyIncome),
      investmentsPercentage: Number(savedAllocation.investmentsPercentage),
      expensesPercentage: Number(savedAllocation.expensesPercentage),
      leisurePercentage: Number(savedAllocation.leisurePercentage),
      investmentsAmount: Number(savedAllocation.investmentsAmount),
      expensesAmount: Number(savedAllocation.expensesAmount),
      leisureAmount: Number(savedAllocation.leisureAmount),
      isActive: savedAllocation.isActive,
      createdAt: savedAllocation.createdAt,
      updatedAt: savedAllocation.updatedAt,
    };
  }

  async getCurrentIncomeAllocation(user: User): Promise<IncomeAllocationResponseDto | null> {
    const allocation = await this.incomeAllocationRepository.findOne({
      where: { user: { id: user.id }, isActive: true },
    });

    if (!allocation) {
      return null;
    }

    return {
      id: allocation.id,
      fixedSalary: Number(allocation.fixedSalary),
      extraIncome: Number(allocation.extraIncome),
      totalMonthlyIncome: Number(allocation.totalMonthlyIncome),
      investmentsPercentage: Number(allocation.investmentsPercentage),
      expensesPercentage: Number(allocation.expensesPercentage),
      leisurePercentage: Number(allocation.leisurePercentage),
      investmentsAmount: Number(allocation.investmentsAmount),
      expensesAmount: Number(allocation.expensesAmount),
      leisureAmount: Number(allocation.leisureAmount),
      isActive: allocation.isActive,
      createdAt: allocation.createdAt,
      updatedAt: allocation.updatedAt,
    };
  }

  async updateIncomeAllocation(
    user: User,
    updateDto: CreateIncomeAllocationCompleteDto,
  ): Promise<IncomeAllocationResponseDto> {
    const existingAllocation = await this.incomeAllocationRepository.findOne({
      where: { user: { id: user.id }, isActive: true },
    });

    if (!existingAllocation) {
      throw new NotFoundException('Alocação de renda ativa não encontrada');
    }

    const totalMonthlyIncome = updateDto.fixedSalary + (updateDto.extraIncome || 0);
    const leisurePercentage = 100 - updateDto.investmentsPercentage - updateDto.expensesPercentage;

    if (leisurePercentage < 0) {
      throw new BadRequestException('A soma dos percentuais não pode exceder 100%');
    }

    const investmentsAmount = (totalMonthlyIncome * updateDto.investmentsPercentage) / 100;
    const expensesAmount = (totalMonthlyIncome * updateDto.expensesPercentage) / 100;
    const leisureAmount = (totalMonthlyIncome * leisurePercentage) / 100;

    existingAllocation.fixedSalary = updateDto.fixedSalary;
    existingAllocation.extraIncome = updateDto.extraIncome || 0;
    existingAllocation.totalMonthlyIncome = totalMonthlyIncome;
    existingAllocation.investmentsPercentage = updateDto.investmentsPercentage;
    existingAllocation.expensesPercentage = updateDto.expensesPercentage;
    existingAllocation.leisurePercentage = leisurePercentage;
    existingAllocation.investmentsAmount = Math.round(investmentsAmount * 100) / 100;
    existingAllocation.expensesAmount = Math.round(expensesAmount * 100) / 100;
    existingAllocation.leisureAmount = Math.round(leisureAmount * 100) / 100;

    const savedAllocation = await this.incomeAllocationRepository.save(existingAllocation);

    return {
      id: savedAllocation.id,
      fixedSalary: Number(savedAllocation.fixedSalary),
      extraIncome: Number(savedAllocation.extraIncome),
      totalMonthlyIncome: Number(savedAllocation.totalMonthlyIncome),
      investmentsPercentage: Number(savedAllocation.investmentsPercentage),
      expensesPercentage: Number(savedAllocation.expensesPercentage),
      leisurePercentage: Number(savedAllocation.leisurePercentage),
      investmentsAmount: Number(savedAllocation.investmentsAmount),
      expensesAmount: Number(savedAllocation.expensesAmount),
      leisureAmount: Number(savedAllocation.leisureAmount),
      isActive: savedAllocation.isActive,
      createdAt: savedAllocation.createdAt,
      updatedAt: savedAllocation.updatedAt,
    };
  }

  async removeByFirebaseUid(firebaseUid: string): Promise<void> {
    await this.userRepository.delete({ firebase_uuid: firebaseUid });
  }
}

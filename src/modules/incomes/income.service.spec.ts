import { Income } from '@entities/income.entity';
import { User } from '@entities/user.entity';
import { IncomeService } from '@modules/income/income.service';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Logger } from 'nestjs-pino';
import { Repository } from 'typeorm';

describe('IncomeService', () => {
  let service: IncomeService;
  let repo: jest.Mocked<Repository<Income>>;

  const mockUser: User = { id: 1 } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncomeService,
        {
          provide: getRepositoryToken(Income),
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            error: jest.fn(),
            log: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IncomeService>(IncomeService);
    repo = module.get(getRepositoryToken(Income));
  });

  it('should create income', async () => {
    const dto = {
      description: 'Salário',
      amount: 1000,
      startDate: '2025-06-01',
    };
    repo.save.mockResolvedValue({ id: 1, ...dto, user: mockUser } as Income);

    const result = await service.create(dto, mockUser);

    expect(repo.save).toHaveBeenCalledWith({ ...dto, user: mockUser });
    expect(result.id).toBe(1);
  });

  it('should list incomes by user', async () => {
    const incomes = [{ id: 1 }, { id: 2 }] as Income[];
    repo.find.mockResolvedValue(incomes);

    const result = await service.findAllByUser(mockUser);

    expect(repo.find).toHaveBeenCalledWith({
      where: { user: { id: mockUser.id } },
    });
    expect(result).toEqual(incomes);
  });

  it('should remove income if found', async () => {
    const income = { id: 1, user: mockUser } as Income;

    repo.findOne.mockResolvedValue(income);
    repo.remove.mockResolvedValue(income);

    const result = await service.remove(1, mockUser);

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 1, user: { id: mockUser.id } },
    });
    expect(repo.remove).toHaveBeenCalledWith(income);
    expect(result).toEqual(income);
  });

  it('should throw NotFoundException if income not found on remove', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.remove(999, mockUser)).rejects.toThrow(
      NotFoundException,
    );
  });
});

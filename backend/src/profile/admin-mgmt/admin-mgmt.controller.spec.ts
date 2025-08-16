import { Test, TestingModule } from '@nestjs/testing';
import { AdminMgmtController } from './admin-mgmt.controller';
import { AdminMgmtService } from './admin-mgmt.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import { AuditService } from '../services/audit.service';
import { ProfileCompletionService } from '../services/profile-completion.service';
import { RateLimitGuard } from '../guards/rate-limit.guard';

describe('AdminMgmtController', () => {
  let controller: AdminMgmtController;

  const mockPrismaService = {
    profile: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      groupBy: jest.fn(),
      update: jest.fn(),
    },
    user: {
      groupBy: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockAuditService = {
    logProfileView: jest.fn(),
    logProfileUpdate: jest.fn(),
  };

  const mockCompletionService = {
    calculateCompletion: jest.fn(),
    getCompletionStats: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(),
  };

  const mockRateLimitGuard = {
    canActivate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminMgmtController],
      providers: [
        AdminMgmtService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: ProfileCompletionService, useValue: mockCompletionService },
      ],
    })
      .overrideGuard(AuthGuardWithRoles)
      .useValue(mockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useValue(mockRateLimitGuard)
      .compile();

    controller = module.get<AdminMgmtController>(AdminMgmtController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

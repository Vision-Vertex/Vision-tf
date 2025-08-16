import { Test, TestingModule } from '@nestjs/testing';
import { AdminMgmtService } from './admin-mgmt.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfileFiltersDto } from '../dto/update-admin-profile.dto';
import { UserRole } from '@prisma/client';
import { AuditService } from '../services/audit.service';
import { ProfileCompletionService } from '../services/profile-completion.service';

describe('AdminMgmtService', () => {
  let service: AdminMgmtService;
  let prismaService: PrismaService;
  let auditService: AuditService;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminMgmtService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: ProfileCompletionService,
          useValue: mockCompletionService,
        },
      ],
    }).compile();

    service = module.get<AdminMgmtService>(AdminMgmtService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
    const completionService = module.get<ProfileCompletionService>(
      ProfileCompletionService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllProfiles', () => {
    const mockProfiles = [
      {
        userId: 'user1',
        displayName: 'John Doe',
        companyName: 'Test Company',
        systemRole: 'ADMIN',
        permissions: ['manage_users', 'edit_content'],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
        lastSystemAccess: new Date('2025-01-03'),
        skills: ['JavaScript', 'React'],
        experience: 5,
        availability: { available: true, timezone: 'UTC+3' },
        workPreferences: { remoteWork: true },
        user: {
          id: 'user1',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john@example.com',
          username: 'johndoe',
          role: UserRole.ADMIN,
          isEmailVerified: true,
          isDeleted: false,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-02'),
        },
      },
    ];

    it('should return profiles with default pagination', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(1);
      mockAuditService.logProfileView.mockResolvedValue(undefined);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      const result = await service.getAllProfiles({}, 'admin-user-id');

      expect(result.profiles).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.totalCount).toBe(1);
      expect(mockAuditService.logProfileView).toHaveBeenCalled();
    });

    it('should filter by search term', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(1);
      mockAuditService.logProfileView.mockResolvedValue(undefined);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      const filters: ProfileFiltersDto = { search: 'john' };
      await service.getAllProfiles(filters, 'admin-user-id');

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                user: { firstname: { contains: 'john', mode: 'insensitive' } },
              },
              { user: { lastname: { contains: 'john', mode: 'insensitive' } } },
              { user: { email: { contains: 'john', mode: 'insensitive' } } },
              { user: { username: { contains: 'john', mode: 'insensitive' } } },
              { displayName: { contains: 'john', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should filter by role', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(1);
      mockAuditService.logProfileView.mockResolvedValue(undefined);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      const filters: ProfileFiltersDto = { role: UserRole.ADMIN };
      await service.getAllProfiles(filters, 'admin-user-id');

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: expect.objectContaining({
              role: UserRole.ADMIN,
            }),
          }),
        }),
      );
    });

    it('should filter by email verification status', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(1);
      mockAuditService.logProfileView.mockResolvedValue(undefined);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      const filters: ProfileFiltersDto = { isEmailVerified: true };
      await service.getAllProfiles(filters, 'admin-user-id');

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: expect.objectContaining({
              isEmailVerified: true,
            }),
          }),
        }),
      );
    });

    it('should filter by company name', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(1);
      mockAuditService.logProfileView.mockResolvedValue(undefined);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      const filters: ProfileFiltersDto = { companyName: 'Test' };
      await service.getAllProfiles(filters, 'admin-user-id');

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyName: { contains: 'Test', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should filter by skills', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(1);
      mockAuditService.logProfileView.mockResolvedValue(undefined);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      const filters: ProfileFiltersDto = { hasSkills: ['JavaScript', 'React'] };
      await service.getAllProfiles(filters, 'admin-user-id');

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            skills: { hasEvery: ['JavaScript', 'React'] },
          }),
        }),
      );
    });

    it('should filter by experience range', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(1);
      mockAuditService.logProfileView.mockResolvedValue(undefined);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      const filters: ProfileFiltersDto = {
        minExperience: 3,
        maxExperience: 10,
      };
      await service.getAllProfiles(filters, 'admin-user-id');

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            experience: { gte: 3, lte: 10 },
          }),
        }),
      );
    });

    it('should filter by availability status', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(1);
      mockAuditService.logProfileView.mockResolvedValue(undefined);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      const filters: ProfileFiltersDto = { isAvailable: true };
      await service.getAllProfiles(filters, 'admin-user-id');

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            availability: {
              not: null,
              path: ['available'],
              equals: true,
            },
          }),
        }),
      );
    });

    it('should filter by remote work preference', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(1);
      mockAuditService.logProfileView.mockResolvedValue(undefined);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      const filters: ProfileFiltersDto = { remoteWork: true };
      await service.getAllProfiles(filters, 'admin-user-id');

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workPreferences: {
              not: null,
              path: ['remoteWork'],
              equals: true,
            },
          }),
        }),
      );
    });

    it('should filter by timezone', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(1);
      mockAuditService.logProfileView.mockResolvedValue(undefined);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      const filters: ProfileFiltersDto = { timezone: 'UTC+3' };
      await service.getAllProfiles(filters, 'admin-user-id');

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            availability: {
              not: null,
              path: ['timezone'],
              equals: 'UTC+3',
            },
          }),
        }),
      );
    });

    it('should sort by user field', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(1);
      mockAuditService.logProfileView.mockResolvedValue(undefined);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      const filters: ProfileFiltersDto = { sortBy: 'email', sortOrder: 'asc' };
      await service.getAllProfiles(filters, 'admin-user-id');

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            user: { email: 'asc' },
          },
        }),
      );
    });

    it('should sort by profile field', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(1);
      mockAuditService.logProfileView.mockResolvedValue(undefined);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      const filters: ProfileFiltersDto = {
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      await service.getAllProfiles(filters, 'admin-user-id');

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: 'desc',
          },
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(50);
      mockAuditService.logProfileView.mockResolvedValue(undefined);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      const filters: ProfileFiltersDto = { page: 2, limit: 10 };
      const result = await service.getAllProfiles(filters, 'admin-user-id');

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(5);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should validate and sanitize input parameters', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(1);
      mockAuditService.logProfileView.mockResolvedValue(undefined);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      const filters: ProfileFiltersDto = {
        search: '  john  ',
        companyName: '  Test Company  ',
        page: 0,
        limit: 150,
      };
      await service.getAllProfiles(filters, 'admin-user-id');

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                user: { firstname: { contains: 'john', mode: 'insensitive' } },
              },
            ]),
            companyName: { contains: 'Test Company', mode: 'insensitive' },
          }),
          skip: 0,
          take: 100, // Should be capped at 100
        }),
      );
    });

    it('should handle invalid date filters gracefully', async () => {
      const filters: ProfileFiltersDto = {
        createdAtFrom: 'invalid-date',
        createdAtTo: '2025-12-31T23:59:59Z',
      };

      await expect(
        service.getAllProfiles(filters, 'admin-user-id'),
      ).rejects.toThrow('Invalid createdAtFrom date format');
    });

    it('should handle empty or invalid array filters', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(1);
      mockAuditService.logProfileView.mockResolvedValue(undefined);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      const filters: ProfileFiltersDto = {
        hasSkills: ['', '  ', 'JavaScript'],
        hasPermissions: ['', 'manage_users'],
      };
      await service.getAllProfiles(filters, 'admin-user-id');

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            skills: { hasEvery: ['JavaScript'] },
            permissions: { hasEvery: ['manage_users'] },
          }),
        }),
      );
    });
  });
});

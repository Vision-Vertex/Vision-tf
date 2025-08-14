import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { UserRole } from '@prisma/client';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';

describe('ProfileController Integration Tests', () => {
  let app: INestApplication;
  let prismaService: jest.Mocked<PrismaService>;

  const mockAuthGuard = {
    canActivate: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    profile: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(async (cb) => await cb()),
  } as unknown as jest.Mocked<PrismaService>;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        ProfileService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    })
      .overrideGuard(AuthGuardWithRoles)
      .useValue(mockAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    prismaService = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthGuard.canActivate.mockImplementation((context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = { userId: 'integration-test-user-id', roles: [UserRole.CLIENT] };
      return true;
    });
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('PATCH /profile (updateProfile)', () => {
    it('should successfully update a user profile', async () => {
      const userId = 'integration-test-user-id';
      const updateDto = { displayName: 'Updated Basic Profile' };
      const mockUser = {
        id: userId,
        profileId: 'mock-profile-id',
        email: 'mock@example.com',
      };
      const mockUpdatedProfile = {
        id: mockUser.profileId,
        userId: mockUser.id,
        displayName: updateDto.displayName,
        bio: null,
        profilePictureUrl: null,
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.profile.update as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .send(updateDto)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        statusCode: 200,
        message: 'Profile updated successfully',
        path: '/profile',
        timestamp: expect.any(String),
        data: mockUpdatedProfile,
      });

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });

      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: updateDto,
      });
    });

    it('should return 404 if profile to update is not found', async () => {
      const userId = 'non-existent-user-id';
      const updateDto = { displayName: 'Non-Existent Profile' };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .send(updateDto)
        .expect(404);

      expect(response.body.message).toEqual('User not found');
    });

    it('should return 400 for invalid profile picture URL', async () => {
      const userId = 'integration-test-user-id';
      const updateDto = { profilePictureUrl: 'invalid-url' };
      const mockUser = {
        id: userId,
        profileId: 'mock-profile-id',
        email: 'mock@example.com',
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .send(updateDto)
        .expect(400);

      expect(response.body.message).toEqual('Invalid profile picture URL format');
    });

    it('should return 400 for display name too short', async () => {
      const userId = 'integration-test-user-id';
      const updateDto = { displayName: 'A' }; // Less than 2 characters
      const mockUser = {
        id: userId,
        profileId: 'mock-profile-id',
        email: 'mock@example.com',
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .send(updateDto)
        .expect(400);

      expect(response.body.message).toEqual('Display name must be at least 2 characters');
    });

    it('should return 400 for bio too long', async () => {
      const userId = 'integration-test-user-id';
      const longBio = 'A'.repeat(501); // More than 500 characters
      const updateDto = { bio: longBio };
      const mockUser = {
        id: userId,
        profileId: 'mock-profile-id',
        email: 'mock@example.com',
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .send(updateDto)
        .expect(400);

      expect(response.body.message).toEqual('Bio must be 500 characters or less');
    });

    it('should return 401 when not authenticated', async () => {
      mockAuthGuard.canActivate.mockImplementationOnce(() => false);

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .send({ displayName: 'Test' })
        .expect(403);

      expect(response.body.message).toEqual('Forbidden resource');
    });
  });

  describe('PATCH /profile/developer (updateDeveloperProfile)', () => {
    it('should update developer profile successfully when user is a DEVELOPER', async () => {
      const userId = 'dev-user-id';
      const dto = {
        skills: ['Node.js', 'TypeScript'],
        experience: 5,
        hourlyRate: 50,
        currency: 'USD',
        availability: { monday: true },
        portfolioLinks: { github: 'https://github.com/dev' },
        education: [],
        workPreferences: {},
      };

      const mockUser = {
        id: userId,
        profileId: 'dev-profile-id',
        email: 'dev@example.com',
        role: UserRole.DEVELOPER,
      };

      const mockUpdatedProfile = {
        id: mockUser.profileId,
        userId: mockUser.id,
        ...dto,
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.DEVELOPER] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.profile.update as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      const response = await request(app.getHttpServer())
        .patch('/profile/developer')
        .send(dto)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        statusCode: 200,
        message: 'Developer profile updated successfully',
        path: '/profile/developer',
        timestamp: expect.any(String),
        data: mockUpdatedProfile,
      });

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { id: true, role: true },
      });

      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: expect.objectContaining(dto),
      });
    });

    it('should return 403 Forbidden if user is not a DEVELOPER', async () => {
      const userId = 'client-user-id';
      const dto = { skills: ['Java'] };

      mockAuthGuard.canActivate.mockImplementationOnce(() => false);

      const response = await request(app.getHttpServer())
        .patch('/profile/developer')
        .send(dto)
        .expect(403);

      expect(response.body.message).toEqual('Forbidden resource');
      expect(prismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return 400 if user exists but is not a DEVELOPER', async () => {
      const userId = 'client-user-id';
      const dto = { skills: ['Java'] };
      const mockUser = {
        id: userId,
        role: UserRole.CLIENT,
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .patch('/profile/developer')
        .send(dto)
        .expect(400);

      expect(response.body.message).toEqual('User is not a Developer or does not exist');
    });

    it('should return 400 for invalid portfolio links URL', async () => {
      const userId = 'dev-user-id';
      const dto = {
        portfolioLinks: { github: 'invalid-url' },
      };
      const mockUser = {
        id: userId,
        role: UserRole.DEVELOPER,
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.DEVELOPER] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .patch('/profile/developer')
        .send(dto)
        .expect(400);

      expect(response.body.message).toEqual('Invalid URL in portfolio links: invalid-url');
    });

    it('should return 400 for invalid custom links URL', async () => {
      const userId = 'dev-user-id';
      const dto = {
        portfolioLinks: {
          customLinks: [{ label: 'Test', url: 'invalid-url' }],
        },
      };
      const mockUser = {
        id: userId,
        role: UserRole.DEVELOPER,
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.DEVELOPER] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .patch('/profile/developer')
        .send(dto)
        .expect(400);

      expect(response.body.message).toEqual('Invalid custom link URL: invalid-url');
    });
  });

  describe('PATCH /profile/client (updateClientProfile)', () => {
    it('should update client profile successfully when user is a CLIENT', async () => {
      const userId = 'client-user-id';
      const dto = {
        companyName: 'New Client Co.',
        companyWebsite: 'https://newclientco.com',
        companySize: '50-100',
        industry: 'Tech',
        companyDescription: 'A tech company',
        contactPerson: 'John Doe',
        contactEmail: 'john@newclientco.com',
        contactPhone: '123-456-7890',
        location: { city: 'NYC' },
        billingAddress: { country: 'US', postalCode: '10001' },
        projectPreferences: {},
        socialLinks: {},
      };

      const mockUser = {
        id: userId,
        profileId: 'client-profile-id',
        email: 'client@example.com',
        role: UserRole.CLIENT,
      };

      const mockUpdatedProfile = {
        id: mockUser.profileId,
        userId: mockUser.id,
        ...dto,
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.profile.update as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      const response = await request(app.getHttpServer())
        .patch('/profile/client')
        .send(dto)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        statusCode: 200,
        message: 'Client profile updated successfully',
        path: '/profile/client',
        timestamp: expect.any(String),
        data: mockUpdatedProfile,
      });

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { id: true, role: true },
      });

      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: expect.objectContaining(dto),
      });
    });

    it('should return 403 Forbidden if user is not a CLIENT', async () => {
      const userId = 'dev-user-id';
      const dto = { companyName: 'Forbidden Co.' };

      mockAuthGuard.canActivate.mockImplementationOnce(() => false);

      const response = await request(app.getHttpServer())
        .patch('/profile/client')
        .send(dto)
        .expect(403);

      expect(response.body.message).toEqual('Forbidden resource');
      expect(prismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return 400 if user exists but is not a CLIENT', async () => {
      const userId = 'dev-user-id';
      const dto = { companyName: 'Forbidden Co.' };
      const mockUser = {
        id: userId,
        role: UserRole.DEVELOPER,
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.DEVELOPER] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .patch('/profile/client')
        .send(dto)
        .expect(400);

      expect(response.body.message).toEqual('User is not a client or does not exist');
    });

    it('should return 400 for invalid company website URL', async () => {
      const userId = 'client-user-id';
      const dto = { companyWebsite: 'invalid-url' };
      const mockUser = {
        id: userId,
        role: UserRole.CLIENT,
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .patch('/profile/client')
        .send(dto)
        .expect(400);

      expect(response.body.message).toEqual('Invalid company website URL');
    });

    it('should return 400 for invalid country format in billing address', async () => {
      const userId = 'client-user-id';
      const dto = {
        billingAddress: { country: 'invalid', postalCode: '10001' },
      };
      const mockUser = {
        id: userId,
        role: UserRole.CLIENT,
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .patch('/profile/client')
        .send(dto)
        .expect(400);

      expect(response.body.message).toEqual('Country must be 2-3 uppercase letters (ISO code)');
    });

    it('should return 400 for invalid postal code format', async () => {
      const userId = 'client-user-id';
      const dto = {
        billingAddress: { country: 'US', postalCode: 'invalid@code' },
      };
      const mockUser = {
        id: userId,
        role: UserRole.CLIENT,
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .patch('/profile/client')
        .send(dto)
        .expect(400);

      expect(response.body.message).toEqual('Postal code must be 3-10 characters and alphanumeric with dashes/spaces allowed');
    });
  });

  describe('PATCH /profile/admin (updateAdminProfile)', () => {
    it('should update admin profile successfully when user is an ADMIN', async () => {
      const userId = 'admin-user-id';
      const dto = {
        systemRole: 'SUPER',
        permissions: ['READ', 'WRITE'],
        lastSystemAccess: new Date().toISOString(),
        adminPreferences: {
          notificationSettings: {
            email: true,
            sms: false,
          },
        },
      };

      const mockUser = {
        id: userId,
        profileId: 'admin-profile-id',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };

      const mockUpdatedProfile = {
        id: mockUser.profileId,
        userId: mockUser.id,
        ...dto,
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.ADMIN] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.profile.update as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      const response = await request(app.getHttpServer())
        .patch('/profile/admin')
        .send(dto)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        statusCode: 200,
        message: 'Admin profile updated successfully',
        path: '/profile/admin',
        timestamp: expect.any(String),
        data: mockUpdatedProfile,
      });

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { id: true, role: true },
      });

      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: expect.objectContaining(dto),
      });
    });

    it('should return 403 Forbidden if user is not an ADMIN', async () => {
      const userId = 'user-id';
      const dto = { systemRole: 'BASIC' };

      mockAuthGuard.canActivate.mockImplementationOnce(() => false);

      const response = await request(app.getHttpServer())
        .patch('/profile/admin')
        .send(dto)
        .expect(403);

      expect(response.body.message).toEqual('Forbidden resource');
      expect(prismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return 400 if user exists but is not an ADMIN', async () => {
      const userId = 'user-id';
      const dto = { systemRole: 'BASIC' };
      const mockUser = {
        id: userId,
        role: UserRole.CLIENT,
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .patch('/profile/admin')
        .send(dto)
        .expect(400);

      expect(response.body.message).toEqual('User is not an admin or does not exist');
    });
  });

  describe('GET /profile (getMyProfile)', () => {
    it("should retrieve the authenticated user's profile", async () => {
      const userId = 'integration-test-user-id';

      const mockUserFromPrisma = {
        id: userId,
        email: 'test@example.com',
        role: UserRole.CLIENT,
        profile: {
          id: 'mock-profile-id',
          displayName: 'Test User',
          bio: 'Bio text',
          profilePictureUrl: 'http://example.com/pic.jpg',
          chatLastReadAt: new Date().toISOString(),
          // Add role-specific fields if necessary
        },
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

       (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUserFromPrisma);

      const response = await request(app.getHttpServer())
        .get('/profile')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        statusCode: 200,
        message: 'Data retrieved successfully',
        path: '/profile',
        timestamp: expect.any(String),
        data: {
          userId: mockUserFromPrisma.id,
          email: mockUserFromPrisma.email,
          role: mockUserFromPrisma.role,
          profile: {
            displayName: mockUserFromPrisma.profile.displayName,
            bio: mockUserFromPrisma.profile.bio,
            profilePictureUrl: mockUserFromPrisma.profile.profilePictureUrl,
            chatLastReadAt: mockUserFromPrisma.profile.chatLastReadAt,
          },
        },
      });

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          profile: true,
        },
      });
    });

    it('should return 404 if user or profile not found for get', async () => {
      const userId = 'another-non-existent-user-id';

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get('/profile')
        .expect(404);

      expect(response.body.message).toEqual('User not found');
    });

    it('should return 401 when not authenticated for get profile', async () => {
      mockAuthGuard.canActivate.mockImplementationOnce(() => false);

      const response = await request(app.getHttpServer())
        .get('/profile')
        .expect(403);

      expect(response.body.message).toEqual('Forbidden resource');
    });

    it('should handle developer profile with role-specific fields', async () => {
      const userId = 'dev-user-id';

      const mockUserFromPrisma = {
        id: userId,
        email: 'dev@example.com',
        role: UserRole.DEVELOPER,
        profile: {
          id: 'dev-profile-id',
          displayName: 'Developer User',
          bio: 'Full-stack developer',
          profilePictureUrl: 'http://example.com/dev.jpg',
          chatLastReadAt: new Date().toISOString(),
          skills: ['JavaScript', 'TypeScript', 'Node.js'],
          experience: 5,
          hourlyRate: 75,
          currency: 'USD',
          availability: { available: true, timezone: 'UTC+3' },
          portfolioLinks: { github: 'https://github.com/dev' },
          education: { degree: 'Computer Science', institution: 'MIT' },
          workPreferences: { remoteWork: true },
        },
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.DEVELOPER] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUserFromPrisma);

      const response = await request(app.getHttpServer())
        .get('/profile')
        .expect(200);

      expect(response.body.data.profile).toMatchObject({
        displayName: 'Developer User',
        bio: 'Full-stack developer',
        skills: ['JavaScript', 'TypeScript', 'Node.js'],
        experience: 5,
        hourlyRate: 75,
        currency: 'USD',
        availability: { available: true, timezone: 'UTC+3' },
        portfolioLinks: { github: 'https://github.com/dev' },
        education: { degree: 'Computer Science', institution: 'MIT' },
        workPreferences: { remoteWork: true },
      });
    });

    it('should handle client profile with role-specific fields', async () => {
      const userId = 'client-user-id';

      const mockUserFromPrisma = {
        id: userId,
        email: 'client@example.com',
        role: UserRole.CLIENT,
        profile: {
          id: 'client-profile-id',
          displayName: 'Client User',
          bio: 'Tech company owner',
          profilePictureUrl: 'http://example.com/client.jpg',
          chatLastReadAt: new Date().toISOString(),
          companyName: 'Tech Corp',
          companyWebsite: 'https://techcorp.com',
          companySize: '50-100',
          industry: 'Technology',
          companyDescription: 'Leading tech company',
          contactPerson: 'John Doe',
          contactEmail: 'john@techcorp.com',
          contactPhone: '123-456-7890',
          location: { city: 'San Francisco', country: 'US' },
          billingAddress: { country: 'US', postalCode: '94105' },
          projectPreferences: { budget: 'high', timeline: 'flexible' },
          socialLinks: { linkedin: 'https://linkedin.com/company/techcorp' },
        },
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUserFromPrisma);

      const response = await request(app.getHttpServer())
        .get('/profile')
        .expect(200);

      expect(response.body.data.profile).toMatchObject({
        displayName: 'Client User',
        bio: 'Tech company owner',
        companyName: 'Tech Corp',
        companyWebsite: 'https://techcorp.com',
        companySize: '50-100',
        industry: 'Technology',
        companyDescription: 'Leading tech company',
        contactPerson: 'John Doe',
        contactEmail: 'john@techcorp.com',
        contactPhone: '123-456-7890',
        location: { city: 'San Francisco', country: 'US' },
        billingAddress: { country: 'US', postalCode: '94105' },
        projectPreferences: { budget: 'high', timeline: 'flexible' },
        socialLinks: { linkedin: 'https://linkedin.com/company/techcorp' },
      });
    });

    it('should handle admin profile with role-specific fields', async () => {
      const userId = 'admin-user-id';

      const mockUserFromPrisma = {
        id: userId,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        profile: {
          id: 'admin-profile-id',
          displayName: 'Admin User',
          bio: 'System administrator',
          profilePictureUrl: 'http://example.com/admin.jpg',
          chatLastReadAt: new Date().toISOString(),
          systemRole: 'SUPER_ADMIN',
          permissions: ['READ', 'WRITE', 'DELETE', 'MANAGE_USERS'],
          lastSystemAccess: new Date().toISOString(),
          adminPreferences: {
            notificationSettings: {
              email: true,
              sms: true,
              push: false,
            },
            dashboardLayout: 'compact',
            theme: 'dark',
          },
        },
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.ADMIN] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUserFromPrisma);

      const response = await request(app.getHttpServer())
        .get('/profile')
        .expect(200);

      expect(response.body.data.profile).toMatchObject({
        displayName: 'Admin User',
        bio: 'System administrator',
        systemRole: 'SUPER_ADMIN',
        permissions: ['READ', 'WRITE', 'DELETE', 'MANAGE_USERS'],
        lastSystemAccess: expect.any(String),
        adminPreferences: {
          notificationSettings: {
            email: true,
            sms: true,
            push: false,
          },
          dashboardLayout: 'compact',
          theme: 'dark',
        },
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database errors gracefully', async () => {
      const userId = 'integration-test-user-id';
      const updateDto = { displayName: 'Test Profile' };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .send(updateDto)
        .expect(500);

      expect(response.body.message).toEqual('Internal server error');
    });

    it('should handle malformed request body', async () => {
      const userId = 'integration-test-user-id';

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.message).toContain('Unexpected token');
    });

    it('should handle empty request body for update operations', async () => {
      const userId = 'integration-test-user-id';
      const mockUser = {
        id: userId,
        profileId: 'mock-profile-id',
        email: 'mock@example.com',
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.profile.update as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: {},
      });
    });

    it('should handle partial updates correctly', async () => {
      const userId = 'integration-test-user-id';
      const updateDto = { displayName: 'Partial Update' };
      const mockUser = {
        id: userId,
        profileId: 'mock-profile-id',
        email: 'mock@example.com',
      };
      const mockUpdatedProfile = {
        id: mockUser.profileId,
        userId: mockUser.id,
        displayName: updateDto.displayName,
        bio: 'Existing bio',
        profilePictureUrl: 'http://example.com/existing.jpg',
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.profile.update as jest.Mock).mockResolvedValue(mockUpdatedProfile);

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .send(updateDto)
        .expect(200);

      expect(response.body.data.displayName).toBe(updateDto.displayName);
      expect(response.body.data.bio).toBe('Existing bio');
      expect(response.body.data.profilePictureUrl).toBe('http://example.com/existing.jpg');
    });

    it('should handle concurrent profile updates', async () => {
      const userId = 'integration-test-user-id';
      const updateDto1 = { displayName: 'First Update' };
      const updateDto2 = { bio: 'Second Update' };
      const mockUser = {
        id: userId,
        profileId: 'mock-profile-id',
        email: 'mock@example.com',
      };

      mockAuthGuard.canActivate.mockImplementation((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.profile.update as jest.Mock)
        .mockResolvedValueOnce({ ...mockUser, ...updateDto1 })
        .mockResolvedValueOnce({ ...mockUser, ...updateDto2 });

      // Simulate concurrent requests
      const [response1, response2] = await Promise.all([
        request(app.getHttpServer()).patch('/profile').send(updateDto1),
        request(app.getHttpServer()).patch('/profile').send(updateDto2),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(prismaService.profile.update).toHaveBeenCalledTimes(2);
    });

    it('should handle large profile data updates', async () => {
      const userId = 'integration-test-user-id';
      const largeDto = {
        displayName: 'Large Profile Update',
        bio: 'A'.repeat(500), // Maximum allowed length
        profilePictureUrl: 'https://example.com/large-image.jpg',
        chatLastReadAt: new Date().toISOString(),
      };
      const mockUser = {
        id: userId,
        profileId: 'mock-profile-id',
        email: 'mock@example.com',
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.profile.update as jest.Mock).mockResolvedValue({ ...mockUser, ...largeDto });

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .send(largeDto)
        .expect(200);

      expect(response.body.data.bio).toHaveLength(500);
      expect(response.body.data.profilePictureUrl).toBe(largeDto.profilePictureUrl);
    });

    it('should handle special characters in profile data', async () => {
      const userId = 'integration-test-user-id';
      const specialCharDto = {
        displayName: 'José María O\'Connor-Smith',
        bio: 'Special chars: éñüß@#$%^&*()_+-=[]{}|;:,.<>?',
        profilePictureUrl: 'https://example.com/special-chars-éñüß.jpg',
      };
      const mockUser = {
        id: userId,
        profileId: 'mock-profile-id',
        email: 'mock@example.com',
      };

      mockAuthGuard.canActivate.mockImplementationOnce((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.profile.update as jest.Mock).mockResolvedValue({ ...mockUser, ...specialCharDto });

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .send(specialCharDto)
        .expect(200);

      expect(response.body.data.displayName).toBe(specialCharDto.displayName);
      expect(response.body.data.bio).toBe(specialCharDto.bio);
    });

    it('should handle rate limiting simulation', async () => {
      const userId = 'integration-test-user-id';
      const updateDto = { displayName: 'Rate Limit Test' };
      const mockUser = {
        id: userId,
        profileId: 'mock-profile-id',
        email: 'mock@example.com',
      };

      mockAuthGuard.canActivate.mockImplementation((context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId, roles: [UserRole.CLIENT] };
        return true;
      });

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.profile.update as jest.Mock).mockResolvedValue({ ...mockUser, ...updateDto });

      // Simulate multiple rapid requests
      const requests = Array.from({ length: 5 }, () =>
        request(app.getHttpServer()).patch('/profile').send(updateDto)
      );

      const responses = await Promise.all(requests);

      // All requests should succeed (no rate limiting implemented in this test)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});

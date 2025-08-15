import { Test, TestingModule } from '@nestjs/testing';
import { ClientService } from './client.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CompanyInfoDto } from '../dto/update-client-profile.dto/company-info.dto';
import { BillingAddressDto, ProjectPreferencesDto, SocialLinksDto } from '../dto/update-client-profile.dto/update-client-profile.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ClientService', () => {
  let service: ClientService;
  let prisma: any;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    profile: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('updateCompanyInfo', () => {
    const userId = 'user-1';
    const dto: CompanyInfoDto = { companyName: 'Test Inc.' };

    it('should update company info for client', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'CLIENT',
        profile: { id: 'profile-1' },
      });
      mockPrisma.profile.update.mockResolvedValue({ id: 'profile-1', companyName: 'Test Inc.' });

      const result = await service.updateCompanyInfo(userId, dto);
      expect(result).toEqual({ id: 'profile-1', companyName: 'Test Inc.' });
      expect(mockPrisma.profile.update).toHaveBeenCalledWith({
        where: { id: 'profile-1' },
        data: expect.objectContaining({ companyName: 'Test Inc.' }),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.updateCompanyInfo(userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not client', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'ADMIN', profile: { id: 'profile-1' } });
      await expect(service.updateCompanyInfo(userId, dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if profile not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'CLIENT', profile: null });
      await expect(service.updateCompanyInfo(userId, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBillingAddress', () => {
    const userId = 'user-2';
    const dto: BillingAddressDto = { street: '123 Main St' };

    it('should update billing address for client', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'CLIENT',
        profile: { id: 'profile-2' },
      });
      mockPrisma.profile.update.mockResolvedValue({ id: 'profile-2', billingAddress: dto });

      const result = await service.updateBillingAddress(userId, dto);
      expect(result).toEqual({ id: 'profile-2', billingAddress: dto });
      expect(mockPrisma.profile.update).toHaveBeenCalledWith({
        where: { id: 'profile-2' },
        data: { billingAddress: expect.any(Object) },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.updateBillingAddress(userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not client', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'ADMIN', profile: { id: 'profile-2' } });
      await expect(service.updateBillingAddress(userId, dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if profile not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'CLIENT', profile: null });
      await expect(service.updateBillingAddress(userId, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProjectPreferences', () => {
    const userId = 'user-3';
    const dto: ProjectPreferencesDto = { };

    it('should update project preferences for client', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'CLIENT',
        profile: { id: 'profile-3' },
      });
      mockPrisma.profile.update.mockResolvedValue({ id: 'profile-3', projectPreferences: dto });

      const result = await service.updateProjectPreferences(userId, dto);
      expect(result).toEqual({ id: 'profile-3', projectPreferences: dto });
      expect(mockPrisma.profile.update).toHaveBeenCalledWith({
        where: { id: 'profile-3' },
        data: { projectPreferences: expect.any(Object) },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.updateProjectPreferences(userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not client', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'ADMIN', profile: { id: 'profile-3' } });
      await expect(service.updateProjectPreferences(userId, dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if profile not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'CLIENT', profile: null });
      await expect(service.updateProjectPreferences(userId, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateClientSocialLinks', () => {
    const userId = 'user-4';
    const dto: SocialLinksDto = { };

    it('should update social links for client', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        role: 'CLIENT',
        profile: { id: 'profile-4' },
      });
      mockPrisma.profile.update.mockResolvedValue({ id: 'profile-4', socialLinks: dto });

      const result = await service.updateClientSocialLinks(userId, dto);
      expect(result).toEqual({ id: 'profile-4', socialLinks: dto });
      expect(mockPrisma.profile.update).toHaveBeenCalledWith({
        where: { id: 'profile-4' },
        data: { socialLinks: expect.any(Object) },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.updateClientSocialLinks(userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not client', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'ADMIN', profile: { id: 'profile-4' } });
      await expect(service.updateClientSocialLinks(userId, dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if profile not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'CLIENT', profile: null });
      await expect(service.updateClientSocialLinks(userId, dto)).rejects.toThrow(NotFoundException);
    });
  });
});
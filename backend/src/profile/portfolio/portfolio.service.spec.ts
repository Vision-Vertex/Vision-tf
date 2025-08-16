import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioService } from './portfolio.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PortfolioLinkDto } from '../dto/update-developer-profile.dto/update-developer-profile.dto';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let prisma: PrismaService;

  const mockPrisma = {
    profile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('getPortfolioLinks', () => {
    it('should return portfolio links if found', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue({
        portfolioLinks: { customLinks: [] },
      });
      const result = await service.getPortfolioLinks('user1');
      expect(result).toEqual({ customLinks: [] });
    });

    it('should return empty object if not found', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(null);
      const result = await service.getPortfolioLinks('user1');
      expect(result).toEqual({});
    });
  });

  describe('addCustomLink', () => {
    const link: PortfolioLinkDto = {
      label: 'GitHub',
      url: 'https://github.com',
    };

    it('should add a new custom link', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue({
        portfolioLinks: { customLinks: [] },
      });
      mockPrisma.profile.update.mockResolvedValue({
        portfolioLinks: { customLinks: [link] },
      });
      const result = await service.addCustomLink('user1', link);
      const customLinks = result.customLinks ?? [];
      expect(customLinks).toContainEqual(link);
      expect(prisma.profile.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if URL invalid', async () => {
      const invalidLink = { label: 'GitHub', url: 'invalid-url' };
      await expect(service.addCustomLink('user1', invalidLink)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if label already exists', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue({
        portfolioLinks: { customLinks: [link] },
      });
      await expect(service.addCustomLink('user1', link)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateCustomLink', () => {
    const oldLink: PortfolioLinkDto = {
      label: 'GitHub',
      url: 'https://github.com',
    };
    const updatedLink: PortfolioLinkDto = {
      label: 'GitHub',
      url: 'https://github.com/new',
    };

    it('should update an existing link', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue({
        portfolioLinks: { customLinks: [oldLink] },
      });
      mockPrisma.profile.update.mockResolvedValue({
        portfolioLinks: { customLinks: [updatedLink] },
      });
      const result = await service.updateCustomLink(
        'user1',
        'GitHub',
        updatedLink,
      );
      const customLinks = result.customLinks ?? [];
      expect(customLinks[0].url).toBe(updatedLink.url);
    });

    it('should throw NotFoundException if no portfolio links', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(null);
      await expect(
        service.updateCustomLink('user1', 'GitHub', updatedLink),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if label not found', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue({
        portfolioLinks: { customLinks: [] },
      });
      await expect(
        service.updateCustomLink('user1', 'GitHub', updatedLink),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if new label conflicts', async () => {
      const conflictLink: PortfolioLinkDto = {
        label: 'GitLab',
        url: 'https://gitlab.com',
      };
      mockPrisma.profile.findUnique.mockResolvedValue({
        portfolioLinks: { customLinks: [oldLink, conflictLink] },
      });
      await expect(
        service.updateCustomLink('user1', 'GitHub', {
          label: 'GitLab',
          url: 'https://gitlab.com/new',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeCustomLink', () => {
    const link: PortfolioLinkDto = {
      label: 'GitHub',
      url: 'https://github.com',
    };

    it('should remove a custom link', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue({
        portfolioLinks: { customLinks: [link] },
      });
      mockPrisma.profile.update.mockResolvedValue({
        portfolioLinks: { customLinks: [] },
      });
      const result = await service.removeCustomLink('user1', 'GitHub');
      const customLinks = result.customLinks ?? [];
      expect(customLinks).toHaveLength(0);
    });

    it('should throw NotFoundException if no portfolio links', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(null);
      await expect(service.removeCustomLink('user1', 'GitHub')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if label not found', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue({
        portfolioLinks: { customLinks: [] },
      });
      await expect(service.removeCustomLink('user1', 'GitHub')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

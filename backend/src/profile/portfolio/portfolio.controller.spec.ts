import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PortfolioLinkDto, PortfolioLinksDto } from '../dto/update-developer-profile.dto/update-developer-profile.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PortfolioController', () => {
  let controller: PortfolioController;
  let service: jest.Mocked<PortfolioService>;

  const mockPortfolio: PortfolioLinksDto = {
    github: 'https://github.com/user',
    linkedin: 'https://linkedin.com/in/user',
    website: 'https://userwebsite.com',
    x: 'https://twitter.com/user',
    customLinks: [
      { label: 'Instagram', url: 'https://instagram.com/user', description: 'Portfolio showcase' },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        {
          provide: PortfolioService,
          useValue: {
            getPortfolioLinks: jest.fn().mockResolvedValue(mockPortfolio),
            addCustomLink: jest.fn().mockResolvedValue(mockPortfolio),
            updateCustomLink: jest.fn().mockResolvedValue(mockPortfolio),
            removeCustomLink: jest.fn().mockResolvedValue(mockPortfolio),
          },
        },
      ],
    }).compile();

    controller = module.get<PortfolioController>(PortfolioController);
    service = module.get(PortfolioService) as jest.Mocked<PortfolioService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPortfolioLinks', () => {
    it('should return portfolio links for a given userId', async () => {
      const result = await controller.getPortfolioLinks('user123');
      expect(service.getPortfolioLinks).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockPortfolio);
    });
  });

  describe('addCustomLink', () => {
    it('should add a custom link and return updated portfolio', async () => {
      const newLink: PortfolioLinkDto = {
        label: 'Dribbble',
        url: 'https://dribbble.com/user',
        description: 'Design portfolio',
      };

      const result = await controller.addCustomLink('user123', newLink);
      expect(service.addCustomLink).toHaveBeenCalledWith('user123', newLink);
      expect(result).toEqual(mockPortfolio);
    });
  });

  describe('updateCustomLink', () => {
    it('should update a custom link and return updated portfolio', async () => {
      const updatedLink: PortfolioLinkDto = {
        label: 'Instagram',
        url: 'https://instagram.com/newuser',
        description: 'Updated portfolio showcase',
      };

      const result = await controller.updateCustomLink('user123', 'Instagram', updatedLink);
      expect(service.updateCustomLink).toHaveBeenCalledWith('user123', 'Instagram', updatedLink);
      expect(result).toEqual(mockPortfolio);
    });
  });

  describe('removeCustomLink', () => {
    it('should remove a custom link and return updated portfolio', async () => {
      const result = await controller.removeCustomLink('user123', 'Instagram');
      expect(service.removeCustomLink).toHaveBeenCalledWith('user123', 'Instagram');
      expect(result).toEqual(mockPortfolio);
    });
  });
});


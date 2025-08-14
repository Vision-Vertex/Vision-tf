import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SkillsProfileService } from './skills-profile.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AddSkillDto } from '../dto/update-developer-profile.dto/update-developer-profile.dto';

describe('SkillsProfileService', () => {
  let service: SkillsProfileService;
  let prismaService: any;

  const mockPrismaService = {
    profile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SkillsProfileService>(SkillsProfileService);
    prismaService = module.get(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('getSkills', () => {
    const userId = 'test-user-id';

    it('should return skills array when profile exists with skills', async () => {
      const mockSkills = ['JavaScript', 'React', 'Node.js'];
      const mockProfile = { skills: mockSkills };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getSkills(userId);

      expect(result).toEqual(mockSkills);
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { skills: true },
      });
      expect(prismaService.profile.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when profile exists but has no skills', async () => {
      const mockProfile = { skills: null };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getSkills(userId);

      expect(result).toEqual([]);
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { skills: true },
      });
    });

    it('should return empty array when profile exists with empty skills array', async () => {
      const mockProfile = { skills: [] };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getSkills(userId);

      expect(result).toEqual([]);
    });

    it('should return empty array when profile does not exist', async () => {
      prismaService.profile.findUnique.mockResolvedValue(null);

      const result = await service.getSkills(userId);

      expect(result).toEqual([]);
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { skills: true },
      });
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      prismaService.profile.findUnique.mockRejectedValue(error);

      await expect(service.getSkills(userId)).rejects.toThrow('Database connection failed');
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { skills: true },
      });
    });
  });

  describe('addSkill', () => {
    const userId = 'test-user-id';
    const skillDto: AddSkillDto = { skill: 'TypeScript' };

    it('should add skill successfully when profile exists and skill is new', async () => {
      const existingSkills = ['JavaScript', 'React'];
      const mockProfile = { skills: existingSkills };
      const expectedSkills = [...existingSkills, skillDto.skill];

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue({ skills: expectedSkills });

      const result = await service.addSkill(userId, skillDto);

      expect(result).toEqual(expectedSkills);
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: expectedSkills },
      });
    });

    it('should add skill to empty skills array', async () => {
      const mockProfile = { skills: [] };
      const expectedSkills = [skillDto.skill];

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue({ skills: expectedSkills });

      const result = await service.addSkill(userId, skillDto);

      expect(result).toEqual(expectedSkills);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: expectedSkills },
      });
    });

    it('should add skill when skills array is null', async () => {
      const mockProfile = { skills: null };
      const expectedSkills = [skillDto.skill];

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue({ skills: expectedSkills });

      const result = await service.addSkill(userId, skillDto);

      expect(result).toEqual(expectedSkills);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: expectedSkills },
      });
    });

    it('should throw BadRequestException when profile does not exist', async () => {
      prismaService.profile.findUnique.mockResolvedValue(null);

      await expect(service.addSkill(userId, skillDto)).rejects.toThrow(
        new BadRequestException('Profile not found')
      );

      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaService.profile.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when skill already exists', async () => {
      const existingSkills = ['JavaScript', 'TypeScript', 'React'];
      const mockProfile = { skills: existingSkills };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      await expect(service.addSkill(userId, skillDto)).rejects.toThrow(
        new BadRequestException('Skill already exists')
      );

      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaService.profile.update).not.toHaveBeenCalled();
    });

    it('should handle case-sensitive skill comparison', async () => {
      const existingSkills = ['JavaScript', 'typescript', 'React'];
      const mockProfile = { skills: existingSkills };
      const expectedSkills = [...existingSkills, 'TypeScript'];

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue({ skills: expectedSkills });

      const result = await service.addSkill(userId, skillDto);

      expect(result).toEqual(expectedSkills);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: expectedSkills },
      });
    });

    it('should handle database errors during profile lookup', async () => {
      const error = new Error('Database connection failed');
      prismaService.profile.findUnique.mockRejectedValue(error);

      await expect(service.addSkill(userId, skillDto)).rejects.toThrow('Database connection failed');
      expect(prismaService.profile.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during profile update', async () => {
      const mockProfile = { skills: ['JavaScript'] };
      const error = new Error('Update failed');
      
      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockRejectedValue(error);

      await expect(service.addSkill(userId, skillDto)).rejects.toThrow('Update failed');
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: ['JavaScript', 'TypeScript'] },
      });
    });
  });

  describe('removeSkill', () => {
    const userId = 'test-user-id';
    const skillToRemove = 'React';

    it('should remove skill successfully when skill exists', async () => {
      const existingSkills = ['JavaScript', 'React', 'Node.js'];
      const mockProfile = { skills: existingSkills };
      const expectedSkills = ['JavaScript', 'Node.js'];

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue({ skills: expectedSkills });

      const result = await service.removeSkill(userId, skillToRemove);

      expect(result).toEqual(expectedSkills);
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: expectedSkills },
      });
    });

    it('should return same array when skill does not exist', async () => {
      const existingSkills = ['JavaScript', 'Node.js'];
      const mockProfile = { skills: existingSkills };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue({ skills: existingSkills });

      const result = await service.removeSkill(userId, skillToRemove);

      expect(result).toEqual(existingSkills);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: existingSkills },
      });
    });

    it('should handle empty skills array', async () => {
      const mockProfile = { skills: [] };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue({ skills: [] });

      const result = await service.removeSkill(userId, skillToRemove);

      expect(result).toEqual([]);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: [] },
      });
    });

    it('should handle null skills array', async () => {
      const mockProfile = { skills: null };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue({ skills: [] });

      const result = await service.removeSkill(userId, skillToRemove);

      expect(result).toEqual([]);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: [] },
      });
    });

    it('should throw BadRequestException when profile does not exist', async () => {
      prismaService.profile.findUnique.mockResolvedValue(null);

      await expect(service.removeSkill(userId, skillToRemove)).rejects.toThrow(
        new BadRequestException('Profile not found')
      );

      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaService.profile.update).not.toHaveBeenCalled();
    });

    it('should handle case-sensitive skill removal', async () => {
      const existingSkills = ['JavaScript', 'react', 'Node.js'];
      const mockProfile = { skills: existingSkills };
      const expectedSkills = ['JavaScript', 'Node.js'];

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue({ skills: expectedSkills });

      const result = await service.removeSkill(userId, 'react');

      expect(result).toEqual(expectedSkills);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: expectedSkills },
      });
    });

    it('should handle removing duplicate skills (remove all instances)', async () => {
      const existingSkills = ['JavaScript', 'React', 'React', 'Node.js'];
      const mockProfile = { skills: existingSkills };
      const expectedSkills = ['JavaScript', 'Node.js'];

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue({ skills: expectedSkills });

      const result = await service.removeSkill(userId, skillToRemove);

      expect(result).toEqual(expectedSkills);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: expectedSkills },
      });
    });

    it('should handle database errors during profile lookup', async () => {
      const error = new Error('Database connection failed');
      prismaService.profile.findUnique.mockRejectedValue(error);

      await expect(service.removeSkill(userId, skillToRemove)).rejects.toThrow('Database connection failed');
      expect(prismaService.profile.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during profile update', async () => {
      const mockProfile = { skills: ['JavaScript', 'React'] };
      const error = new Error('Update failed');
      
      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockRejectedValue(error);

      await expect(service.removeSkill(userId, skillToRemove)).rejects.toThrow('Update failed');
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: ['JavaScript'] },
      });
    });

    it('should handle special characters in skill names', async () => {
      const existingSkills = ['JavaScript', 'C#', 'C++', 'React'];
      const mockProfile = { skills: existingSkills };
      const expectedSkills = ['JavaScript', 'C++', 'React'];

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue({ skills: expectedSkills });

      const result = await service.removeSkill(userId, 'C#');

      expect(result).toEqual(expectedSkills);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: expectedSkills },
      });
    });
  });

  describe('Edge cases and error scenarios', () => {
    const userId = 'test-user-id';

    it('should handle very long skill names', async () => {
      const longSkillName = 'A'.repeat(1000);
      const existingSkills = ['JavaScript'];
      const mockProfile = { skills: existingSkills };
      const expectedSkills = [...existingSkills, longSkillName];

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue({ skills: expectedSkills });

      const result = await service.addSkill(userId, { skill: longSkillName });

      expect(result).toEqual(expectedSkills);
    });

    it('should handle empty string skill names', async () => {
      const existingSkills = ['JavaScript'];
      const mockProfile = { skills: existingSkills };
      const expectedSkills = [...existingSkills, ''];

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue({ skills: expectedSkills });

      const result = await service.addSkill(userId, { skill: '' });

      expect(result).toEqual(expectedSkills);
    });

    it('should handle whitespace-only skill names', async () => {
      const existingSkills = ['JavaScript'];
      const mockProfile = { skills: existingSkills };
      const expectedSkills = [...existingSkills, '   '];

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue({ skills: expectedSkills });

      const result = await service.addSkill(userId, { skill: '   ' });

      expect(result).toEqual(expectedSkills);
    });

    it('should handle Unicode characters in skill names', async () => {
      const unicodeSkill = '🎨 Design';
      const existingSkills = ['JavaScript'];
      const mockProfile = { skills: existingSkills };
      const expectedSkills = [...existingSkills, unicodeSkill];

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);
      prismaService.profile.update.mockResolvedValue({ skills: expectedSkills });

      const result = await service.addSkill(userId, { skill: unicodeSkill });

      expect(result).toEqual(expectedSkills);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SkillsProfileService } from './skills-profile.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AddSkillDto,
  UpdateSkillsDto,
} from '../dto/update-developer-profile.dto/update-developer-profile.dto';

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

      await expect(service.getSkills(userId)).rejects.toThrow(
        'Database connection failed',
      );
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
      const expectedSkills = [...existingSkills, skillDto.skill];

      prismaService.profile.update.mockResolvedValue({
        skills: expectedSkills,
      });

      const result = await service.addSkill(userId, skillDto);

      expect(result).toEqual(expectedSkills);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          skills: {
            push: 'TypeScript',
          },
        },
        select: { skills: true },
      });
    });

    it('should add skill to empty skills array', async () => {
      const expectedSkills = [skillDto.skill];

      prismaService.profile.update.mockResolvedValue({
        skills: expectedSkills,
      });

      const result = await service.addSkill(userId, skillDto);

      expect(result).toEqual(expectedSkills);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          skills: {
            push: 'TypeScript',
          },
        },
        select: { skills: true },
      });
    });

    it('should add skill when skills array is null', async () => {
      const expectedSkills = [skillDto.skill];

      prismaService.profile.update.mockResolvedValue({
        skills: expectedSkills,
      });

      const result = await service.addSkill(userId, skillDto);

      expect(result).toEqual(expectedSkills);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          skills: {
            push: 'TypeScript',
          },
        },
        select: { skills: true },
      });
    });

    it('should throw BadRequestException when profile does not exist', async () => {
      const error = { code: 'P2025' };
      prismaService.profile.update.mockRejectedValue(error);

      await expect(service.addSkill(userId, skillDto)).rejects.toThrow(
        new BadRequestException('Profile not found'),
      );

      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          skills: {
            push: 'TypeScript',
          },
        },
        select: { skills: true },
      });
    });

    it('should throw BadRequestException when skill is empty', async () => {
      const emptySkillDto: AddSkillDto = { skill: '' };

      await expect(service.addSkill(userId, emptySkillDto)).rejects.toThrow(
        new BadRequestException('Skill must be a valid string'),
      );

      expect(prismaService.profile.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when skill is too short', async () => {
      const shortSkillDto: AddSkillDto = { skill: 'A' };

      await expect(service.addSkill(userId, shortSkillDto)).rejects.toThrow(
        new BadRequestException('Skill name too short (min 2 characters)'),
      );

      expect(prismaService.profile.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when skill is too long', async () => {
      const longSkillDto: AddSkillDto = { skill: 'A'.repeat(51) };

      await expect(service.addSkill(userId, longSkillDto)).rejects.toThrow(
        new BadRequestException('Skill name too long (max 50 characters)'),
      );

      expect(prismaService.profile.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when skill contains invalid characters', async () => {
      const invalidSkillDto: AddSkillDto = { skill: 'JavaScript<script>' };

      await expect(service.addSkill(userId, invalidSkillDto)).rejects.toThrow(
        new BadRequestException(
          'Skill contains invalid characters. Only letters, numbers, spaces, hyphens, underscores, dots, #, and + are allowed',
        ),
      );

      expect(prismaService.profile.update).not.toHaveBeenCalled();
    });
  });

  describe('removeSkill', () => {
    const userId = 'test-user-id';
    const skillToRemove = 'React';

    it('should remove skill successfully when skill exists', async () => {
      const existingSkills = ['JavaScript', 'React', 'Node.js'];
      const expectedSkills = ['JavaScript', 'Node.js'];

      prismaService.profile.findUnique.mockResolvedValue({
        skills: existingSkills,
      });
      prismaService.profile.update.mockResolvedValue({
        skills: expectedSkills,
      });

      const result = await service.removeSkill(userId, skillToRemove);

      expect(result).toEqual(expectedSkills);
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { skills: true },
      });
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: expectedSkills },
        select: { skills: true },
      });
    });

    it('should return same array when skill does not exist', async () => {
      const existingSkills = ['JavaScript', 'Node.js'];

      prismaService.profile.findUnique.mockResolvedValue({
        skills: existingSkills,
      });
      prismaService.profile.update.mockResolvedValue({
        skills: existingSkills,
      });

      const result = await service.removeSkill(userId, skillToRemove);

      expect(result).toEqual(existingSkills);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: existingSkills },
        select: { skills: true },
      });
    });

    it('should handle empty skills array', async () => {
      prismaService.profile.findUnique.mockResolvedValue({ skills: [] });
      prismaService.profile.update.mockResolvedValue({ skills: [] });

      const result = await service.removeSkill(userId, skillToRemove);

      expect(result).toEqual([]);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: [] },
        select: { skills: true },
      });
    });

    it('should handle null skills array', async () => {
      prismaService.profile.findUnique.mockResolvedValue({ skills: null });
      prismaService.profile.update.mockResolvedValue({ skills: [] });

      const result = await service.removeSkill(userId, skillToRemove);

      expect(result).toEqual([]);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: [] },
        select: { skills: true },
      });
    });

    it('should throw BadRequestException when profile does not exist', async () => {
      prismaService.profile.findUnique.mockResolvedValue(null);

      await expect(service.removeSkill(userId, skillToRemove)).rejects.toThrow(
        new BadRequestException('Profile not found'),
      );

      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { skills: true },
      });
      expect(prismaService.profile.update).not.toHaveBeenCalled();
    });

    it('should handle case-sensitive skill removal', async () => {
      const existingSkills = ['JavaScript', 'react', 'Node.js'];
      const expectedSkills = ['JavaScript', 'Node.js'];

      prismaService.profile.findUnique.mockResolvedValue({
        skills: existingSkills,
      });
      prismaService.profile.update.mockResolvedValue({
        skills: expectedSkills,
      });

      const result = await service.removeSkill(userId, 'react');

      expect(result).toEqual(expectedSkills);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: expectedSkills },
        select: { skills: true },
      });
    });

    it('should handle removing duplicate skills (remove all instances)', async () => {
      const existingSkills = ['JavaScript', 'React', 'React', 'Node.js'];
      const expectedSkills = ['JavaScript', 'Node.js'];

      prismaService.profile.findUnique.mockResolvedValue({
        skills: existingSkills,
      });
      prismaService.profile.update.mockResolvedValue({
        skills: expectedSkills,
      });

      const result = await service.removeSkill(userId, skillToRemove);

      expect(result).toEqual(expectedSkills);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: expectedSkills },
        select: { skills: true },
      });
    });

    it('should handle database errors during profile lookup', async () => {
      const error = new Error('Database connection failed');
      prismaService.profile.findUnique.mockRejectedValue(error);

      await expect(service.removeSkill(userId, skillToRemove)).rejects.toThrow(
        'Database connection failed',
      );
      expect(prismaService.profile.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during profile update', async () => {
      const error = new Error('Update failed');

      prismaService.profile.findUnique.mockResolvedValue({
        skills: ['JavaScript', 'React'],
      });
      prismaService.profile.update.mockRejectedValue(error);

      await expect(service.removeSkill(userId, skillToRemove)).rejects.toThrow(
        'Update failed',
      );
      expect(prismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: { skills: true },
      });
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: ['JavaScript'] },
        select: { skills: true },
      });
    });

    it('should handle special characters in skill names', async () => {
      const existingSkills = ['JavaScript', 'C#', 'C++', 'React'];
      const expectedSkills = ['JavaScript', 'C++', 'React'];

      prismaService.profile.findUnique.mockResolvedValue({
        skills: existingSkills,
      });
      prismaService.profile.update.mockResolvedValue({
        skills: expectedSkills,
      });

      const result = await service.removeSkill(userId, 'C#');

      expect(result).toEqual(expectedSkills);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: expectedSkills },
        select: { skills: true },
      });
    });
  });

  describe('updateSkills', () => {
    const userId = 'test-user-id';

    it('should update skills array successfully', async () => {
      const newSkills = ['TypeScript', 'Vue.js', 'MongoDB'];
      const dto: UpdateSkillsDto = { skills: newSkills };

      prismaService.profile.update.mockResolvedValue({ skills: newSkills });

      const result = await service.updateSkills(userId, dto);

      expect(result).toEqual(newSkills);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: newSkills },
        select: { skills: true },
      });
    });

    it('should remove duplicates from skills array', async () => {
      const skillsWithDuplicates = [
        'JavaScript',
        'React',
        'JavaScript',
        'React',
      ];
      const expectedSkills = ['JavaScript', 'React'];
      const dto: UpdateSkillsDto = { skills: skillsWithDuplicates };

      prismaService.profile.update.mockResolvedValue({
        skills: expectedSkills,
      });

      const result = await service.updateSkills(userId, dto);

      expect(result).toEqual(expectedSkills);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: expectedSkills },
        select: { skills: true },
      });
    });

    it('should throw BadRequestException when profile not found', async () => {
      const dto: UpdateSkillsDto = { skills: ['JavaScript'] };
      const error = { code: 'P2025' };

      prismaService.profile.update.mockRejectedValue(error);

      await expect(service.updateSkills(userId, dto)).rejects.toThrow(
        new BadRequestException('Profile not found'),
      );
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: ['JavaScript'] },
        select: { skills: true },
      });
    });

    it('should handle empty skills array', async () => {
      const emptySkills: string[] = [];
      const dto: UpdateSkillsDto = { skills: emptySkills };

      prismaService.profile.update.mockResolvedValue({ skills: emptySkills });

      const result = await service.updateSkills(userId, dto);

      expect(result).toEqual(emptySkills);
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: emptySkills },
        select: { skills: true },
      });
    });

    it('should handle database errors during profile update', async () => {
      const dto: UpdateSkillsDto = { skills: ['JavaScript'] };
      const error = new Error('Update failed');

      prismaService.profile.update.mockRejectedValue(error);

      await expect(service.updateSkills(userId, dto)).rejects.toThrow(
        'Update failed',
      );
      expect(prismaService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: { skills: dto.skills },
        select: { skills: true },
      });
    });

    it('should throw BadRequestException when skills contain invalid skill', async () => {
      const dto: UpdateSkillsDto = {
        skills: ['JavaScript', 'Invalid<script>'],
      };

      await expect(service.updateSkills(userId, dto)).rejects.toThrow(
        new BadRequestException(
          'Skill contains invalid characters. Only letters, numbers, spaces, hyphens, underscores, dots, #, and + are allowed',
        ),
      );

      expect(prismaService.profile.update).not.toHaveBeenCalled();
    });
  });

  describe('suggestSkills', () => {
    const userId = 'test-user-id';

    it('should return skill suggestions when user has existing skills', async () => {
      const existingSkills = ['JavaScript', 'React'];
      const mockProfile = { skills: existingSkills };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.suggestSkills(userId);

      expect(result).toHaveLength(10);
      expect(result).not.toContain('JavaScript');
      expect(result).not.toContain('React');
      expect(result).toContain('TypeScript');
      expect(result).toContain('Vue.js');
    });

    it('should return all suggestions when user has no skills', async () => {
      const mockProfile = { skills: [] };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.suggestSkills(userId);

      expect(result).toHaveLength(10);
      expect(result).toContain('JavaScript');
      expect(result).toContain('TypeScript');
    });

    it('should not return skills user already has', async () => {
      const existingSkills = [
        'JavaScript',
        'React',
        'Node.js',
        'Python',
        'Java',
        'C#',
        'PHP',
        'Ruby',
        'Go',
        'Rust',
      ];
      const mockProfile = { skills: existingSkills };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.suggestSkills(userId);

      expect(result).toHaveLength(10);
      existingSkills.forEach((skill) => {
        expect(result).not.toContain(skill);
      });
    });

    it('should return limited number of suggestions', async () => {
      const mockProfile = { skills: [] };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.suggestSkills(userId);

      expect(result).toHaveLength(10);
    });

    it('should throw BadRequestException when profile not found', async () => {
      prismaService.profile.findUnique.mockResolvedValue(null);

      await expect(service.suggestSkills(userId)).rejects.toThrow(
        new BadRequestException('Profile not found'),
      );
    });

    it('should handle case-insensitive skill comparison', async () => {
      const existingSkills = ['javascript', 'REACT'];
      const mockProfile = { skills: existingSkills };

      prismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.suggestSkills(userId);

      expect(result).not.toContain('JavaScript');
      expect(result).not.toContain('React');
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');

      prismaService.profile.findUnique.mockRejectedValue(error);

      await expect(service.suggestSkills(userId)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});

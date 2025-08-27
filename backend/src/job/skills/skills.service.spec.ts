import { BadRequestException } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SkillLevel, SkillCategory } from './dto/skill.dto';

describe('SkillsService', () => {
  let service: SkillsService;

  beforeEach(() => {
    const prisma = {} as PrismaService; // mock if needed later
    service = new SkillsService(prisma);
  });

  // ===== Skill Name Validation =====
  describe('validateSkillName', () => {
    it('should validate and normalize a valid skill name', () => {
      const result = service.validateSkillName('React js');
      expect(result.isValid).toBe(true);
      // service converts "js" → "JS"
      expect(result.normalizedValue).toBe('React JS');
    });

    it('should reject empty string', () => {
      const result = service.validateSkillName('');
      expect(result.isValid).toBe(false);
      // service returns "Skill name must be a non-empty string"
      expect(result.errors).toContain('Skill name must be a non-empty string');
    });

    it('should reject invalid characters', () => {
      const result = service.validateSkillName('React@123');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toMatch(/invalid characters/);
    });

    it('should reject spam words', () => {
      const result = service.validateSkillName('test');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Skill name appears to be invalid or spam');
    });
  });

  // ===== Skill Level =====
  describe('validateSkillLevel', () => {
    it('should validate correct level', () => {
      const result = service.validateSkillLevel(SkillLevel.BEGINNER);
      expect(result.isValid).toBe(true);
      expect(result.normalizedValue).toBe('BEGINNER');
    });

    it('should reject invalid level', () => {
      const result = service.validateSkillLevel('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toMatch(/Invalid skill level/);
    });
  });

  // ===== Skill Weight =====
  describe('validateSkillWeight', () => {
    it('should accept valid weight and normalize to 2 decimals', () => {
      const result = service.validateSkillWeight(0.345);
      expect(result.isValid).toBe(true);
      expect(result.normalizedValue).toBe(0.35);
    });

    it('should reject negative weight', () => {
      const result = service.validateSkillWeight(-1);
      expect(result.isValid).toBe(false);
    });

    it('should reject > 1.0 weight', () => {
      const result = service.validateSkillWeight(2);
      expect(result.isValid).toBe(false);
    });
  });

  // ===== Skill Category =====
  describe('validateSkillCategory', () => {
    it('should validate valid category', () => {
      const result = service.validateSkillCategory(SkillCategory.FRONTEND);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid category', () => {
      const result = service.validateSkillCategory('invalid');
      expect(result.isValid).toBe(false);
    });
  });

  // ===== Job Skills Validation =====
  describe('validateJobSkills', () => {
    it('should validate required skills successfully', () => {
      const required = [{ skill: 'React', level: SkillLevel.BEGINNER, weight: 0.5 }];
      const result = service.validateJobSkills(required);
      expect(result.valid).toBe(true);
      expect(result.validSkills).toContain('React');
    });

    it('should reject invalid skill name', () => {
      const required = [{ skill: '!!!', level: SkillLevel.BEGINNER, weight: 0.5 }];
      const result = service.validateJobSkills(required);
      expect(result.valid).toBe(false);
      expect(result.invalidSkills.length).toBeGreaterThan(0);
    });

    it('should suggest similar skills when invalid given', () => {
      // use invalid-but-similar skill to trigger suggestions
      const required = [{ skill: 'Reakt!', level: SkillLevel.BEGINNER, weight: 0.5 }];
      const result = service.validateJobSkills(required);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  // ===== Search Skills =====
  describe('searchSkills', () => {
    it('should return matching skills', () => {
      const result = service.searchSkills('React');
      expect(result).toContain('React');
    });

    it('should throw for invalid query', () => {
      expect(() => service.searchSkills('!!!')).toThrow(BadRequestException);
    });
  });

  // ===== Popular Skills =====
  it('getPopularSkills should return limited list', () => {
    const result = service.getPopularSkills(3);
    expect(result.length).toBe(3);
  });

  // ===== Extract Skills =====
  describe('extractSkillsFromDescription', () => {
    it('should extract known skills from text', () => {
      const result = service.extractSkillsFromDescription('We use React, Node.js, and Docker');
      expect(result).toContain('React');
      expect(result).toContain('Node.js');
    });

    it('should throw for invalid description', () => {
      expect(() => service.extractSkillsFromDescription('')).toThrow(BadRequestException);
    });
  });

  // ===== Suggestions by Project Type =====
  describe('getSkillSuggestionsByProjectType', () => {
    it('should return suggestions for valid project type', () => {
      const result = service.getSkillSuggestionsByProjectType(SkillCategory.FRONTEND);
      expect(result.skills.length).toBeGreaterThan(0);
    });

    it('should throw for invalid project type', () => {
      expect(() => service.getSkillSuggestionsByProjectType('invalid')).toThrow(BadRequestException);
    });
  });

  // ===== Skill Data Validation =====
  describe('validateAndNormalizeSkillData', () => {
    it('should accept valid skill data', () => {
      const result = service.validateAndNormalizeSkillData({
        name: 'React',
        category: SkillCategory.FRONTEND,
        description: 'Frontend library',
      });
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid description', () => {
      const result = service.validateAndNormalizeSkillData({
        name: 'React',
        category: SkillCategory.FRONTEND,
        description: 'x'.repeat(1001),
      });
      expect(result.isValid).toBe(false);
    });
  });
});

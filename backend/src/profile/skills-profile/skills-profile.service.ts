import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AddSkillDto,
  UpdateSkillsDto,
} from '../dto/update-developer-profile.dto/update-developer-profile.dto';
@Injectable()
export class SkillsProfileService {
  constructor(private prisma: PrismaService) {}

  // Get all skills for a developer
  async getSkills(userId: string): Promise<string[]> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { skills: true },
    });
    return profile?.skills || [];
  }

  // Add a single skill
  async addSkill(userId: string, dto: AddSkillDto): Promise<string[]> {
    this.validateSkill(dto.skill);

    try {
      const result = await this.prisma.profile.update({
        where: { userId },
        data: {
          skills: {
            push: dto.skill,
          },
        },
        select: { skills: true },
      });
      return result.skills || [];
    } catch (error) {
      if (error.code === 'P2025') {
        throw new BadRequestException('Profile not found');
      }
      throw error;
    }
  }

  // Remove a skill
  async removeSkill(userId: string, skill: string): Promise<string[]> {
    try {
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
        select: { skills: true },
      });

      if (!profile) {
        throw new BadRequestException('Profile not found');
      }

      const filteredSkills = (profile.skills || []).filter((s) => s !== skill);

      const result = await this.prisma.profile.update({
        where: { userId },
        data: { skills: filteredSkills },
        select: { skills: true },
      });

      return result.skills || [];
    } catch (error) {
      if (error.code === 'P2025') {
        throw new BadRequestException('Profile not found');
      }
      throw error;
    }
  }

  // Update skills array (bulk update)
  async updateSkills(userId: string, dto: UpdateSkillsDto): Promise<string[]> {
    // Validate all skills
    dto.skills.forEach((skill) => this.validateSkill(skill));

    // Remove duplicates efficiently
    const uniqueSkills = Array.from(new Set(dto.skills));

    try {
      const result = await this.prisma.profile.update({
        where: { userId },
        data: { skills: uniqueSkills },
        select: { skills: true },
      });
      return result.skills || [];
    } catch (error) {
      if (error.code === 'P2025') {
        throw new BadRequestException('Profile not found');
      }
      throw error;
    }
  }

  // Get skill suggestions
  async suggestSkills(userId: string): Promise<string[]> {
    try {
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
        select: { skills: true },
      });

      if (!profile) {
        throw new BadRequestException('Profile not found');
      }

      const currentSkills = profile.skills || [];

      // Sample skills database - you can expand this manually
      const allSkills = [
        'JavaScript',
        'TypeScript',
        'React',
        'Vue.js',
        'Angular',
        'Node.js',
        'Python',
        'Java',
        'C#',
        'PHP',
        'Ruby',
        'Go',
        'Rust',
        'Swift',
        'HTML',
        'CSS',
        'SASS',
        'LESS',
        'Bootstrap',
        'Tailwind CSS',
        'MongoDB',
        'PostgreSQL',
        'MySQL',
        'Redis',
        'DynamoDB',
        'Docker',
        'Kubernetes',
        'AWS',
        'Azure',
        'GCP',
        'Git',
        'GitHub',
        'GitLab',
        'CI/CD',
        'Jenkins',
        'REST API',
        'GraphQL',
        'Microservices',
        'Serverless',
      ];

      // Optimized O(n) algorithm using Set
      const currentSkillsSet = new Set(
        currentSkills.map((skill) => skill.toLowerCase()),
      );

      const suggestions = allSkills.filter(
        (skill) => !currentSkillsSet.has(skill.toLowerCase()),
      );

      // Return top 10 suggestions
      return suggestions.slice(0, 10);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new BadRequestException('Profile not found');
      }
      throw error;
    }
  }

  // Private validation method
  private validateSkill(skill: string): void {
    if (!skill || typeof skill !== 'string') {
      throw new BadRequestException('Skill must be a valid string');
    }

    const trimmedSkill = skill.trim();

    if (trimmedSkill.length === 0) {
      throw new BadRequestException('Skill cannot be empty');
    }

    if (trimmedSkill.length > 50) {
      throw new BadRequestException('Skill name too long (max 50 characters)');
    }

    if (trimmedSkill.length < 2) {
      throw new BadRequestException('Skill name too short (min 2 characters)');
    }

    // Allow alphanumeric, spaces, hyphens, underscores, dots, #, and +
    if (!/^[a-zA-Z0-9\s\-_\.#\+]+$/.test(trimmedSkill)) {
      throw new BadRequestException(
        'Skill contains invalid characters. Only letters, numbers, spaces, hyphens, underscores, dots, #, and + are allowed',
      );
    }

    // Prevent XSS and injection attacks
    if (
      trimmedSkill.toLowerCase().includes('<script>') ||
      trimmedSkill.toLowerCase().includes('javascript:') ||
      trimmedSkill.toLowerCase().includes('onload=') ||
      trimmedSkill.toLowerCase().includes('onerror=')
    ) {
      throw new BadRequestException(
        'Skill contains potentially harmful content',
      );
    }
  }
}

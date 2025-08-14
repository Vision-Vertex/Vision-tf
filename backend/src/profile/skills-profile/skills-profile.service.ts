import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddSkillDto } from '../dto/update-developer-profile.dto/update-developer-profile.dto';
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
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new BadRequestException('Profile not found');

    const skills = profile.skills || [];
    if (skills.includes(dto.skill)) {
      throw new BadRequestException('Skill already exists');
    }

    skills.push(dto.skill);

    await this.prisma.profile.update({
      where: { userId },
      data: { skills },
    });

    return skills;
  }

  // Remove a skill
  async removeSkill(userId: string, skill: string): Promise<string[]> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new BadRequestException('Profile not found');

    const skills = profile.skills || [];
    const filteredSkills = skills.filter(s => s !== skill);

    await this.prisma.profile.update({
      where: { userId },
      data: { skills: filteredSkills },
    });

    return filteredSkills;
  }


  
}

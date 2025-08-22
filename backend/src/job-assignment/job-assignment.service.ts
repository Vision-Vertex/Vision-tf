import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobAssignmentDto } from './dto/create-job-assignment.dto';
import { UpdateJobAssignmentDto } from './dto/update-job-assignment.dto';
import { AssignmentStatus } from '@prisma/client';
import  { DeveloperSuggestionDto } from './dto/developer-suggestion.dto';
@Injectable()
export class JobAssignmentService {
  constructor(private prisma: PrismaService) {}

 async create(dto: CreateJobAssignmentDto) {
  // Validate job exists
  const job = await this.prisma.job.findUnique({ where: { id: dto.jobId } });
  if (!job) throw new HttpException('Job not found', HttpStatus.NOT_FOUND);

  // Validate developer exists
  const developer = await this.prisma.user.findUnique({ where: { id: dto.developerId } });
  if (!developer || developer.role !== 'DEVELOPER') {
    throw new HttpException('Selected user is not a developer', HttpStatus.BAD_REQUEST);
  }
/*
  // Validate job status
  const allowedStatuses = ['APPROVED', 'PUBLISHED'] as const;
  if (!allowedStatuses.includes(job.status as any)) {
    throw new HttpException('Cannot assign developer. Job is not open for assignment.', HttpStatus.BAD_REQUEST);
  }
*/
  // Ensure assignmentType defaults to MANUAL if not provided
  const assignmentType = dto.assignmentType || 'MANUAL';

  return this.prisma.jobAssignment.create({
    data: {
      ...dto,
      assignmentType, 
      notes: dto.notes || null, // Prisma may expect null instead of undefined
    },
  });
}


  findAll() {
    return this.prisma.jobAssignment.findMany({
      include: { job: true, developer: true, assignedByUser: true },
    });
  }

  findOne(id: string) {
    return this.prisma.jobAssignment.findUnique({
      where: { id },
      include: { job: true, developer: true, assignedByUser: true },
    });
  }

  async update(id: string, dto: UpdateJobAssignmentDto) {
    const assignment = await this.findOne(id);
    if (!assignment) {
      throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
    }
    return this.prisma.jobAssignment.update({
      where: { id },
      data: dto,
    });
  }

  async updateStatus(id: string, status: AssignmentStatus) {
    const assignment = await this.findOne(id);
    if (!assignment) {
      throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
    }

    // Workflow transitions (example rules)
    if (assignment.status === 'COMPLETED' && status !== 'CANCELLED') {
      throw new HttpException(
        'Cannot change status of a completed assignment',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.jobAssignment.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: string) {
    const assignment = await this.findOne(id);
    if (!assignment) {
      throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
    }
    return this.prisma.jobAssignment.delete({ where: { id } });
  }
async suggestDevelopers(jobId: string): Promise<DeveloperSuggestionDto[]> {
  const job = await this.prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new HttpException('Job not found', HttpStatus.NOT_FOUND);

  if (!job.requiredSkills) return [];

  const requiredSkills: string[] = job.requiredSkills as string[];

  const developers = await this.prisma.user.findMany({
    where: {
      role: 'DEVELOPER',
      profile: {
        skills: {
          hasSome: requiredSkills, // filter in DB
        },
      },
    },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      username: true,
      email: true,
      profile: {
        select: { skills: true },
      },
    },
  });

  // map Prisma result → DTO
  return developers.map(dev => ({
    id: dev.id,
    firstname: dev.firstname,
    lastname: dev.lastname,
    username: dev.username,
    email: dev.email,
    skills: dev.profile?.skills || [],
  }));
}

//team
async createTeam(name: string, developerIds: string[], description?: string) {
    // Validate developers
    const developers = await this.prisma.user.findMany({
      where: { id: { in: developerIds }, role: 'DEVELOPER' },
    });
    if (developers.length !== developerIds.length) {
      throw new HttpException('Some developers not found or not valid', HttpStatus.BAD_REQUEST);
    }
      return this.prisma.team.create({
      data: {
        name,
        description,
        members: {
          create: developers.map(dev => ({
            userId: dev.id,
            role: 'MEMBER',
          })),
        },
      },
      include: { members: { include: { user: true } } },
    });
  }
   async assignTeamToJob(jobId: string, teamId: string, assignedBy: string, notes?: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new HttpException('Job not found', HttpStatus.NOT_FOUND);

    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new HttpException('Team not found', HttpStatus.NOT_FOUND);

    return this.prisma.teamAssignment.create({
      data: {
        jobId,
        teamId,
        assignedBy,
        notes: notes || null,
      },
      include: { team: { include: { members: { include: { user: true } } } }, job: true },
    });
  }

  async createTeamAndAssign(jobId: string, name: string, developerIds: string[], assignedBy: string, description?: string, notes?: string) {
    const team = await this.createTeam(name, developerIds, description);
    return this.assignTeamToJob(jobId, team.id, assignedBy, notes);
  }

  async updateTeamAssignmentStatus(id: string, status: AssignmentStatus) {
    const assignment = await this.prisma.teamAssignment.findUnique({ where: { id } });
    if (!assignment) {
      throw new HttpException('Team assignment not found', HttpStatus.NOT_FOUND);
    }

    return this.prisma.teamAssignment.update({
      where: { id },
      data: { status },
    });
  }

  async getTeamAssignments(jobId: string) {
    return this.prisma.teamAssignment.findMany({
      where: { jobId },
      include: { team: { include: { members: { include: { user: true } } } } },
    });
  }


}

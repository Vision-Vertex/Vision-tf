import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto, UpdateJobDto } from './dto';
import { JobEventService } from './job-event.service';
import { JobStatus } from '@prisma/client';

@Injectable()
export class JobService {
  constructor(
    private prisma: PrismaService,
    private jobEventService: JobEventService,
  ) {}

  async create(createJobDto: CreateJobDto, userId: string) {
    try {
    
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      console.log('Creating job with userId:', userId);
      console.log('Job data:', createJobDto);

      
      const jobData = {
        ...createJobDto,
        
        clientId: userId,
        requiredSkills: createJobDto.requiredSkills ? JSON.parse(JSON.stringify(createJobDto.requiredSkills)) : null,
        preferredSkills: createJobDto.preferredSkills ? JSON.parse(JSON.stringify(createJobDto.preferredSkills)) : null,
        budget: createJobDto.budget ? JSON.parse(JSON.stringify(createJobDto.budget)) : null,
        deadline: new Date(createJobDto.deadline),
      };

      const job = await this.prisma.job.create({
        data: jobData,
        include: {
          client: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
      });

      console.log('Job created successfully:', job.id);

      
      try {
        await this.jobEventService.jobCreated(job.id, userId, {
          title: job.title,
          clientId: job.clientId,
          status: job.status,
          priority: job.priority,
        });
        console.log('Job event published successfully');
      } catch (eventError) {
        console.error('Event publishing failed:', eventError);
        
      }

      return job;
    } catch (error) {
      console.error('Job creation failed:', error);
      throw error;
    }
  }

  async findAll() {
    try {
      return await this.prisma.job.findMany({
        include: {
          client: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const job = await this.prisma.job.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      return job;
    } catch (error) {
      console.error('Failed to fetch job:', error);
      throw error;
    }
  }

  async update(id: string, updateJobDto: UpdateJobDto, userId: string) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const existingJob = await this.prisma.job.findUnique({
        where: { id },
      });

      if (!existingJob) {
        throw new NotFoundException('Job not found');
      }

      
      const updateData: any = { ...updateJobDto };
      
      if (updateJobDto.requiredSkills !== undefined) {
        updateData.requiredSkills = updateJobDto.requiredSkills ? JSON.parse(JSON.stringify(updateJobDto.requiredSkills)) : null;
      }
      if (updateJobDto.preferredSkills !== undefined) {
        updateData.preferredSkills = updateJobDto.preferredSkills ? JSON.parse(JSON.stringify(updateJobDto.preferredSkills)) : null;
      }
      if (updateJobDto.budget !== undefined) {
        updateData.budget = updateJobDto.budget ? JSON.parse(JSON.stringify(updateJobDto.budget)) : null;
      }
      if (updateJobDto.deadline) {
        updateData.deadline = new Date(updateJobDto.deadline);
      }

      const updatedJob = await this.prisma.job.update({
        where: { id },
        data: updateData,
        include: {
          client: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
      });

      
      try {
        await this.jobEventService.jobUpdated(id, userId, {
          changes: updateData,
          previousData: existingJob,
          updatedAt: new Date().toISOString(),
        });
      } catch (eventError) {
        console.error('Event publishing failed:', eventError);
      }

      return updatedJob;
    } catch (error) {
      console.error('Job update failed:', error);
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const job = await this.prisma.job.findUnique({
        where: { id },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      
      try {
        await this.jobEventService.jobDeleted(id, userId);
      } catch (eventError) {
        console.error('Event publishing failed:', eventError);
      }


      return await this.prisma.job.delete({ where: { id } });
    } catch (error) {
      console.error('Job deletion failed:', error);
      throw error;
    }
  }

  async updateStatus(id: string, newStatus: JobStatus, userId: string, reason?: string) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const job = await this.prisma.job.findUnique({
        where: { id },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      const previousStatus = job.status;

      const updatedJob = await this.prisma.job.update({
        where: { id },
        data: {
          status: newStatus,
          updatedAt: new Date(),
        },
        include: {
          client: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
      });

      
      try {
        await this.jobEventService.jobStatusChanged(id, userId, previousStatus, newStatus, reason);
      } catch (eventError) {
        console.error('Event publishing failed:', eventError);
      }

      return updatedJob;
    } catch (error) {
      console.error('Job status update failed:', error);
      throw error;
    }
  }

  async findByClient(clientId: string) {
    try {
      return await this.prisma.job.findMany({
        where: { clientId },
        include: {
          client: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Failed to fetch client jobs:', error);
      throw error;
    }
  }
}

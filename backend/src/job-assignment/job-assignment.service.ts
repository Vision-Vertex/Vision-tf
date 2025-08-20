import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobAssignmentDto } from './dto/create-job-assignment.dto';
import { UpdateJobAssignmentDto } from './dto/update-job-assignment.dto';
import { AssignmentStatus } from '@prisma/client';

@Injectable()
export class JobAssignmentService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateJobAssignmentDto) {
    return this.prisma.jobAssignment.create({ data: dto });
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
}

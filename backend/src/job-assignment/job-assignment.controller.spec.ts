import { Test, TestingModule } from '@nestjs/testing';
import { JobAssignmentController } from './job-assignment.controller';
import { JobAssignmentService } from './job-assignment.service';

describe('JobAssignmentController', () => {
  let controller: JobAssignmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobAssignmentController],
      providers: [JobAssignmentService],
    }).compile();

    controller = module.get<JobAssignmentController>(JobAssignmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { JobAssignmentService } from './job-assignment.service';

describe('JobAssignmentService', () => {
  let service: JobAssignmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobAssignmentService],
    }).compile();

    service = module.get<JobAssignmentService>(JobAssignmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

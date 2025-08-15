import { Test, TestingModule } from '@nestjs/testing';
import { AdminMgmtController } from './admin-mgmt.controller';
import { AdminMgmtService } from './admin-mgmt.service';

describe('AdminMgmtController', () => {
  let controller: AdminMgmtController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminMgmtController],
      providers: [AdminMgmtService],
    }).compile();

    controller = module.get<AdminMgmtController>(AdminMgmtController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

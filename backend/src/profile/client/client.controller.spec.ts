import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

describe('ClientController (Integration)', () => {
  let app: INestApplication;
  let clientService: ClientService;

  const mockUser = { id: 'user-id', role: 'CLIENT' };

  const mockClientService = {
    updateCompanyInfo: jest.fn().mockImplementation((userId, dto) => ({ ...dto, userId })),
    updateBillingAddress: jest.fn().mockImplementation((userId, dto) => ({ ...dto, userId })),
    updateProjectPreferences: jest.fn().mockImplementation((userId, dto) => ({ ...dto, userId })),
    updateClientSocialLinks: jest.fn().mockImplementation((userId, dto) => ({ ...dto, userId })),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [
        { provide: ClientService, useValue: mockClientService },
      ],
    })
      // Mock guards to automatically allow requests
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (context) => {
        const req = context.switchToHttp().getRequest();
        req.user = mockUser;
        return true;
      }})
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    clientService = module.get<ClientService>(ClientService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PATCH /profile/company', () => {
    it('should update company info', async () => {
      const dto = { name: 'Acme Corp', website: 'https://acme.com' };
      const res = await request(app.getHttpServer())
        .patch('/profile/company')
        .send(dto)
        .expect(200);

      expect(res.body).toEqual({ ...dto, userId: mockUser.id });
      expect(clientService.updateCompanyInfo).toHaveBeenCalledWith(mockUser.id, dto);
    });
  });

  describe('PATCH /profile/billing', () => {
    it('should update billing address', async () => {
      const dto = { address: '123 Street', city: 'City', country: 'Country' };
      const res = await request(app.getHttpServer())
        .patch('/profile/billing')
        .send(dto)
        .expect(200);

      expect(res.body).toEqual({ ...dto, userId: mockUser.id });
      expect(clientService.updateBillingAddress).toHaveBeenCalledWith(mockUser.id, dto);
    });
  });

  describe('PATCH /profile/project-preferences', () => {
    it('should update project preferences', async () => {
      const dto = { preferredTechnologies: ['Node', 'React'], budget: 5000 };
      const res = await request(app.getHttpServer())
        .patch('/profile/project-preferences')
        .send(dto)
        .expect(200);

      expect(res.body).toEqual({ ...dto, userId: mockUser.id });
      expect(clientService.updateProjectPreferences).toHaveBeenCalledWith(mockUser.id, dto);
    });
  });

  describe('PATCH /profile/client-social', () => {
    it('should update client social links', async () => {
      const dto = { linkedin: 'https://linkedin.com/in/test', twitter: 'https://twitter.com/test' };
      const res = await request(app.getHttpServer())
        .patch('/profile/client-social')
        .send(dto)
        .expect(200);

      expect(res.body).toEqual({ ...dto, userId: mockUser.id });
      expect(clientService.updateClientSocialLinks).toHaveBeenCalledWith(mockUser.id, dto);
    });
  });
});

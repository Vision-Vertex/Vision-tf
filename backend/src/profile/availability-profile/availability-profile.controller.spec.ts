import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { UserRole } from '@prisma/client';
import { AvailabilityDto, WorkPreferencesDto } from '../dto/update-developer-profile.dto/update-developer-profile.dto';

describe('AvailabilityProfileController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let developerToken: string;
  let clientToken: string;
  let developerUserId: string;
  let clientUserId: string;

  const testDeveloper = {
    email: 'developer@test.com',
    username: 'testdeveloper',
    password: 'TestPassword123!',
    firstname: 'Test',
    lastname: 'Developer',
    role: UserRole.DEVELOPER,
  };

  const testClient = {
    email: 'client@test.com',
    username: 'testclient',
    password: 'TestPassword123!',
    firstname: 'Test',
    lastname: 'Client',
    role: UserRole.CLIENT,
  };

  const sampleAvailability: AvailabilityDto = {
    available: true,
    hours: '9-5',
    timezone: 'UTC+3',
    noticePeriod: '2 weeks',
    maxHoursPerWeek: 40,
    preferredProjectTypes: ['web', 'mobile'],
  };

  const sampleWorkPreferences: WorkPreferencesDto = {
    remoteWork: true,
    onSiteWork: false,
    hybridWork: true,
    travelWillingness: 'national',
    contractTypes: ['hourly', 'fixed'],
    minProjectDuration: '1-2 weeks',
    maxProjectDuration: '6+ months',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);

    // Clean up database
    await prisma.session.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const developerUser = await authService.signup(testDeveloper);
    const clientUser = await authService.signup(testClient);
    
    developerUserId = developerUser.data!.id;
    clientUserId = clientUser.data!.id;

    // Login to get tokens
    const developerLogin = await authService.login(
      {
        email: testDeveloper.email,
        password: testDeveloper.password,
      },
      'test-user-agent',
      '127.0.0.1'
    );
    const clientLogin = await authService.login(
      {
        email: testClient.email,
        password: testClient.password,
      },
      'test-user-agent',
      '127.0.0.1'
    );

    // Handle potential 2FA requirement
    if ('requires2FA' in developerLogin.data!) {
      throw new Error('2FA not supported in tests');
    }
    if ('requires2FA' in clientLogin.data!) {
      throw new Error('2FA not supported in tests');
    }

    developerToken = developerLogin.data!.accessToken;
    clientToken = clientLogin.data!.accessToken;
  });

  afterAll(async () => {
    await prisma.session.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 when no token provided', () => {
      return request(app.getHttpServer())
        .get('/profile/developer/availability/availability')
        .expect(401);
    });

    it('should return 403 when client tries to access developer endpoints', () => {
      return request(app.getHttpServer())
        .get('/profile/developer/availability/availability')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  describe('POST /profile/developer/availability/availability', () => {
    it('should update developer availability successfully', () => {
      return request(app.getHttpServer())
        .patch('/profile/developer/availability/availability')
        .set('Authorization', `Bearer ${developerToken}`)
        .send(sampleAvailability)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(res.body.data.available).toBe(sampleAvailability.available);
          expect(res.body.data.hours).toBe(sampleAvailability.hours);
          expect(res.body.data.timezone).toBe(sampleAvailability.timezone);
        });
    });

    it('should handle non-whitelisted fields gracefully', () => {
      const invalidAvailability = {
        nonExistentField: 'should-be-ignored',
      };

      return request(app.getHttpServer())
        .patch('/profile/developer/availability/availability')
        .set('Authorization', `Bearer ${developerToken}`)
        .send(invalidAvailability)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should handle partial availability updates', () => {
      const partialAvailability = {
        available: false,
        timezone: 'UTC+5',
      };

      return request(app.getHttpServer())
        .patch('/profile/developer/availability/availability')
        .set('Authorization', `Bearer ${developerToken}`)
        .send(partialAvailability)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.available).toBe(partialAvailability.available);
          expect(res.body.data.timezone).toBe(partialAvailability.timezone);
        });
    });
  });

  describe('POST /profile/developer/availability/work-preferences', () => {
    it('should update developer work preferences successfully', () => {
      return request(app.getHttpServer())
        .patch('/profile/developer/availability/work-preferences')
        .set('Authorization', `Bearer ${developerToken}`)
        .send(sampleWorkPreferences)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(res.body.data.remoteWork).toBe(sampleWorkPreferences.remoteWork);
          expect(res.body.data.onSiteWork).toBe(sampleWorkPreferences.onSiteWork);
          expect(res.body.data.hybridWork).toBe(sampleWorkPreferences.hybridWork);
        });
    });

    it('should handle non-whitelisted fields in work preferences gracefully', () => {
      const invalidWorkPreferences = {
        nonExistentField: 'should-be-ignored',
      };

      return request(app.getHttpServer())
        .patch('/profile/developer/availability/work-preferences')
        .set('Authorization', `Bearer ${developerToken}`)
        .send(invalidWorkPreferences)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should handle partial work preferences updates', () => {
      const partialWorkPreferences = {
        remoteWork: false,
        travelWillingness: 'international',
      };

      return request(app.getHttpServer())
        .patch('/profile/developer/availability/work-preferences')
        .set('Authorization', `Bearer ${developerToken}`)
        .send(partialWorkPreferences)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.remoteWork).toBe(partialWorkPreferences.remoteWork);
          expect(res.body.data.travelWillingness).toBe(partialWorkPreferences.travelWillingness);
        });
    });
  });

  describe('GET /profile/developer/availability/availability', () => {
    it('should get developer availability successfully', () => {
      return request(app.getHttpServer())
        .get('/profile/developer/availability/availability')
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
        });
    });

    it('should return default availability for new developer', async () => {
      // Create a new developer - they get default availability
      const newDeveloper = {
        email: 'newdev@test.com',
        username: 'newdev',
        password: 'TestPassword123!',
        firstname: 'New',
        lastname: 'Dev',
        role: UserRole.DEVELOPER,
      };

      const newDevUser = await authService.signup(newDeveloper);
      const newDevLogin = await authService.login(
        {
          email: newDeveloper.email,
          password: newDeveloper.password,
        },
        'test-user-agent',
        '127.0.0.1'
      );

      if ('requires2FA' in newDevLogin.data!) {
        throw new Error('2FA not supported in tests');
      }

      return request(app.getHttpServer())
        .get('/profile/developer/availability/availability')
        .set('Authorization', `Bearer ${newDevLogin.data!.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual({
            available: true,
            hours: '9-5',
          });
        });
    });
  });

  describe('GET /profile/developer/availability/work-preferences', () => {
    it('should get developer work preferences successfully', () => {
      return request(app.getHttpServer())
        .get('/profile/developer/availability/work-preferences')
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
        });
    });

    it('should return null when no work preferences are set', async () => {
      // Create a new developer - they don't get default work preferences
      const newDeveloper = {
        email: 'newdev2@test.com',
        username: 'newdev2',
        password: 'TestPassword123!',
        firstname: 'New',
        lastname: 'Dev2',
        role: UserRole.DEVELOPER,
      };

      const newDevUser = await authService.signup(newDeveloper);
      const newDevLogin = await authService.login(
        {
          email: newDeveloper.email,
          password: newDeveloper.password,
        },
        'test-user-agent',
        '127.0.0.1'
      );

      if ('requires2FA' in newDevLogin.data!) {
        throw new Error('2FA not supported in tests');
      }

      return request(app.getHttpServer())
        .get('/profile/developer/availability/work-preferences')
        .set('Authorization', `Bearer ${newDevLogin.data!.accessToken}`)
        .expect(200)
                 .expect((res) => {
           expect(res.body.success).toBe(true);
           expect(res.body.data).toBeUndefined();
         });
    });
  });

  describe('Data Persistence', () => {
    it('should persist availability data correctly', async () => {
      const testAvailability = {
        available: true,
        hours: '10-6',
        timezone: 'UTC+2',
        noticePeriod: '1 week',
        maxHoursPerWeek: 35,
        preferredProjectTypes: ['backend', 'api'],
      };

      // Update availability
      await request(app.getHttpServer())
        .patch('/profile/developer/availability/availability')
        .set('Authorization', `Bearer ${developerToken}`)
        .send(testAvailability)
        .expect(200);

      // Verify data is persisted by fetching it
      return request(app.getHttpServer())
        .get('/profile/developer/availability/availability')
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.available).toBe(testAvailability.available);
          expect(res.body.data.hours).toBe(testAvailability.hours);
          expect(res.body.data.timezone).toBe(testAvailability.timezone);
          expect(res.body.data.noticePeriod).toBe(testAvailability.noticePeriod);
          expect(res.body.data.maxHoursPerWeek).toBe(testAvailability.maxHoursPerWeek);
          expect(res.body.data.preferredProjectTypes).toEqual(testAvailability.preferredProjectTypes);
        });
    });

    it('should persist work preferences data correctly', async () => {
      const testWorkPreferences = {
        remoteWork: false,
        onSiteWork: true,
        hybridWork: false,
        travelWillingness: 'local',
        contractTypes: ['fixed'],
        minProjectDuration: '3-6 months',
        maxProjectDuration: '1 year',
      };

      // Update work preferences
      await request(app.getHttpServer())
        .patch('/profile/developer/availability/work-preferences')
        .set('Authorization', `Bearer ${developerToken}`)
        .send(testWorkPreferences)
        .expect(200);

      // Verify data is persisted by fetching it
      return request(app.getHttpServer())
        .get('/profile/developer/availability/work-preferences')
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.remoteWork).toBe(testWorkPreferences.remoteWork);
          expect(res.body.data.onSiteWork).toBe(testWorkPreferences.onSiteWork);
          expect(res.body.data.hybridWork).toBe(testWorkPreferences.hybridWork);
          expect(res.body.data.travelWillingness).toBe(testWorkPreferences.travelWillingness);
          expect(res.body.data.contractTypes).toEqual(testWorkPreferences.contractTypes);
          expect(res.body.data.minProjectDuration).toBe(testWorkPreferences.minProjectDuration);
          expect(res.body.data.maxProjectDuration).toBe(testWorkPreferences.maxProjectDuration);
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', () => {
      return request(app.getHttpServer())
        .patch('/profile/developer/availability/availability')
        .set('Authorization', `Bearer ${developerToken}`)
        .set('Content-Type', 'application/json')
        .send('{"available": "not-a-boolean", "invalid":}')
        .expect(400);
    });

    it('should handle empty request body gracefully', () => {
      return request(app.getHttpServer())
        .patch('/profile/developer/availability/availability')
        .set('Authorization', `Bearer ${developerToken}`)
        .send({})
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should handle invalid token format', () => {
      return request(app.getHttpServer())
        .get('/profile/developer/availability/availability')
        .set('Authorization', 'InvalidTokenFormat')
        .expect(401);
    });

    it('should handle expired token', async () => {
      // This test would require mocking JWT service to return expired token
      // For now, we'll test with a clearly invalid token
      return request(app.getHttpServer())
        .get('/profile/developer/availability/availability')
        .set('Authorization', 'Bearer expired.token.here')
        .expect(401);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long strings in text fields', () => {
      const longString = 'a'.repeat(1000);
      const availabilityWithLongStrings = {
        ...sampleAvailability,
        hours: longString,
        timezone: longString,
        noticePeriod: longString,
      };

      return request(app.getHttpServer())
        .patch('/profile/developer/availability/availability')
        .set('Authorization', `Bearer ${developerToken}`)
        .send(availabilityWithLongStrings)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.hours).toBe(longString);
        });
    });

    it('should handle large arrays in preferredProjectTypes', () => {
      const largeArray = Array.from({ length: 100 }, (_, i) => `project-type-${i}`);
      const availabilityWithLargeArray = {
        ...sampleAvailability,
        preferredProjectTypes: largeArray,
      };

      return request(app.getHttpServer())
        .patch('/profile/developer/availability/availability')
        .set('Authorization', `Bearer ${developerToken}`)
        .send(availabilityWithLargeArray)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.preferredProjectTypes).toEqual(largeArray);
        });
    });

    it('should handle boundary values for maxHoursPerWeek', () => {
      const boundaryValues = [0, 1, 168, 169]; // 168 hours = 7 days * 24 hours

      return Promise.all(
        boundaryValues.map((hours) =>
          request(app.getHttpServer())
            .patch('/profile/developer/availability/availability')
            .set('Authorization', `Bearer ${developerToken}`)
            .send({ ...sampleAvailability, maxHoursPerWeek: hours })
            .expect(200)
            .expect((res) => {
              expect(res.body.success).toBe(true);
              expect(res.body.data.maxHoursPerWeek).toBe(hours);
            })
        )
      );
    });
  });
});

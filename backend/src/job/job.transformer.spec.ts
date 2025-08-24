import { JobTransformer } from './job.transformer';
import { JobStatus, JobPriority, ProjectType, WorkLocation, JobVisibility } from '@prisma/client';

describe('JobTransformer', () => {
  let transformer: JobTransformer;

  const mockClient = {
    id: 'client-123',
    firstname: 'John',
    lastname: 'Doe',
    email: 'john.doe@example.com'
  };

  const mockBudget = {
    type: 'FIXED',
    amount: 5000,
    currency: 'USD'
  };

  const mockRequiredSkills = [
    { skill: 'React', level: 'EXPERT', weight: 1.0 },
    { skill: 'TypeScript', level: 'ADVANCED', weight: 0.8 }
  ];

  const mockPreferredSkills = [
    { skill: 'Node.js', level: 'INTERMEDIATE', weight: 0.5 }
  ];

  const mockJob = {
    id: 'job-123',
    title: 'Full-Stack React Developer',
    description: 'We need an experienced React developer to build a modern web application',
    deadline: new Date('2024-12-31T23:59:59.000Z'),
    clientId: 'client-123',
    status: JobStatus.DRAFT,
    priority: JobPriority.HIGH,
    projectType: ProjectType.WEB_APP,
    location: WorkLocation.REMOTE,
    estimatedHours: 80,
    requiredSkills: mockRequiredSkills,
    preferredSkills: mockPreferredSkills,
    budget: mockBudget,
    attachments: ['https://example.com/file1.pdf', 'https://example.com/file2.jpg'],
    tags: ['react', 'typescript', 'fullstack', 'remote'],
    visibility: JobVisibility.PUBLIC,
    requirements: 'Must be available for weekly meetings and provide daily updates',
    deliverables: ['Source code', 'Documentation', 'Deployment guide'],
    constraints: 'Must use React 18+ and be compatible with existing legacy system',
    riskFactors: ['Tight deadline', 'Complex integration requirements'],
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    publishedAt: null,
    approvedAt: null,
    onHoldAt: null,
    cancelledAt: null,
    completedAt: null,
    expiredAt: null,
    version: 1,
    lastModifiedBy: null,
    statusChangedAt: null,
    previousStatus: null,
    client: mockClient
  };

  beforeEach(() => {
    transformer = new JobTransformer();
  });

  describe('transform', () => {
    it('should transform a complete job object correctly', () => {
      // Act
      const result = transformer.transform(mockJob);

      // Assert
      expect(result).toEqual({
        id: 'job-123',
        title: 'Full-Stack React Developer',
        description: 'We need an experienced React developer to build a modern web application',
        deadline: new Date('2024-12-31T23:59:59.000Z'),
        status: JobStatus.DRAFT,
        priority: JobPriority.HIGH,
        projectType: ProjectType.WEB_APP,
        location: WorkLocation.REMOTE,
        estimatedHours: 80,
        tags: ['react', 'typescript', 'fullstack', 'remote'],
        attachments: ['https://example.com/file1.pdf', 'https://example.com/file2.jpg'],
        requirements: 'Must be available for weekly meetings and provide daily updates',
        deliverables: ['Source code', 'Documentation', 'Deployment guide'],
        constraints: 'Must use React 18+ and be compatible with existing legacy system',
        riskFactors: ['Tight deadline', 'Complex integration requirements'],
        visibility: JobVisibility.PUBLIC,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
        client: {
          id: 'client-123',
          name: 'John Doe',
          email: 'john.doe@example.com'
        },
        budget: {
          type: 'FIXED',
          amount: 5000,
          currency: 'USD'
        },
        requiredSkills: mockRequiredSkills,
        preferredSkills: mockPreferredSkills
      });
    });

    it('should handle job with missing optional fields', () => {
      // Arrange
      const minimalJob = {
        id: 'job-456',
        title: 'Minimal Job',
        description: 'Basic job description',
        client: mockClient
      };

      // Act
      const result = transformer.transform(minimalJob);

      // Assert
      expect(result).toEqual({
        id: 'job-456',
        title: 'Minimal Job',
        description: 'Basic job description',
        deadline: null,
        status: 'DRAFT',
        priority: 'MEDIUM',
        projectType: null,
        location: 'REMOTE',
        estimatedHours: null,
        tags: [],
        attachments: [],
        requirements: null,
        deliverables: [],
        constraints: null,
        riskFactors: [],
        visibility: 'PUBLIC',
        createdAt: null,
        updatedAt: null,
        client: {
          id: 'client-123',
          name: 'John Doe',
          email: 'john.doe@example.com'
        },
        budget: null,
        requiredSkills: [],
        preferredSkills: []
      });
    });

    it('should return null for null/undefined job', () => {
      // Act & Assert
      expect(transformer.transform(null)).toBeNull();
      expect(transformer.transform(undefined)).toBeNull();
    });

    it('should handle job with empty string values', () => {
      // Arrange
      const jobWithEmptyStrings = {
        ...mockJob,
        title: '',
        description: '',
        requirements: ''
      };

      
      const result = transformer.transform(jobWithEmptyStrings);

      
      expect(result!.title).toBe(''); 
      expect(result!.description).toBe(''); 
      expect(result!.requirements).toBe(null); 
    });

    it('should handle job with falsy values', () => {
      
      const jobWithFalsyValues = {
        ...mockJob,
        title: 0,
        description: false,
        estimatedHours: 0
      };

      
      const result = transformer.transform(jobWithFalsyValues);

     
      expect(result!.title).toBe(''); 
      expect(result!.description).toBe(''); 
      expect(result!.estimatedHours).toBe(null); 
    });
  });

  describe('transformMany', () => {
    it('should transform multiple jobs correctly', () => {
      
      const jobs = [mockJob, { ...mockJob, id: 'job-456' }];

    
      const result = transformer.transformMany(jobs);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('job-123');
      expect(result[1].id).toBe('job-456');
      expect(result[0]).toHaveProperty('client');
      expect(result[1]).toHaveProperty('client');
    });

    it('should filter out null and undefined jobs', () => {
      
      const jobsWithNulls = [mockJob, null, undefined, { ...mockJob, id: 'job-456' }];

      
      const result = transformer.transformMany(jobsWithNulls);

      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('job-123');
      expect(result[1].id).toBe('job-456');
    });

    it('should return empty array for non-array input', () => {
      // Act & Assert
      expect(transformer.transformMany(null as any)).toEqual([]);
      expect(transformer.transformMany(undefined as any)).toEqual([]);
      expect(transformer.transformMany('not-an-array' as any)).toEqual([]);
      expect(transformer.transformMany(123 as any)).toEqual([]);
      expect(transformer.transformMany({} as any)).toEqual([]);
    });

    it('should return empty array for empty array input', () => {
      
      const result = transformer.transformMany([]);

      
      expect(result).toEqual([]);
    });

    it('should handle array with only null/undefined values', () => {
      
      const nullJobs = [null, undefined, null];

      
      const result = transformer.transformMany(nullJobs);

      
      expect(result).toEqual([]);
    });
  });

  describe('transformForCreate', () => {
    it('should transform job for creation with correct fields', () => {
      
      const result = transformer.transformForCreate(mockJob);


      expect(result).toEqual({
        id: 'job-123',
        title: 'Full-Stack React Developer',
        description: 'We need an experienced React developer to build a modern web application',
        deadline: new Date('2024-12-31T23:59:59.000Z'),
        status: JobStatus.DRAFT,
        priority: JobPriority.HIGH,
        projectType: ProjectType.WEB_APP,
        location: WorkLocation.REMOTE,
        estimatedHours: 80,
        tags: ['react', 'typescript', 'fullstack', 'remote'],
        visibility: JobVisibility.PUBLIC,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        client: {
          id: 'client-123',
          name: 'John Doe',
          email: 'john.doe@example.com'
        }
      });
    });

    it('should not include fields not needed for creation', () => {
      // Act
      const result = transformer.transformForCreate(mockJob);

      // Assert
      expect(result).not.toHaveProperty('requirements');
      expect(result).not.toHaveProperty('deliverables');
      expect(result).not.toHaveProperty('constraints');
      expect(result).not.toHaveProperty('riskFactors');
      expect(result).not.toHaveProperty('updatedAt');
      expect(result).not.toHaveProperty('budget');
      expect(result).not.toHaveProperty('requiredSkills');
      expect(result).not.toHaveProperty('preferredSkills');
      expect(result).not.toHaveProperty('attachments');
    });

    it('should return null for null/undefined job', () => {
      // Act & Assert
      expect(transformer.transformForCreate(null)).toBeNull();
      expect(transformer.transformForCreate(undefined)).toBeNull();
    });
  });

  describe('transformForUpdate', () => {
    it('should transform job for update with correct fields', () => {
      // Act
      const result = transformer.transformForUpdate(mockJob);

      // Assert
      expect(result).toEqual({
        id: 'job-123',
        title: 'Full-Stack React Developer',
        description: 'We need an experienced React developer to build a modern web application',
        deadline: new Date('2024-12-31T23:59:59.000Z'),
        status: JobStatus.DRAFT,
        priority: JobPriority.HIGH,
        projectType: ProjectType.WEB_APP,
        location: WorkLocation.REMOTE,
        estimatedHours: 80,
        tags: ['react', 'typescript', 'fullstack', 'remote'],
        requirements: 'Must be available for weekly meetings and provide daily updates',
        deliverables: ['Source code', 'Documentation', 'Deployment guide'],
        constraints: 'Must use React 18+ and be compatible with existing legacy system',
        riskFactors: ['Tight deadline', 'Complex integration requirements'],
        visibility: JobVisibility.PUBLIC,
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
        client: {
          id: 'client-123',
          name: 'John Doe',
          email: 'john.doe@example.com'
        }
      });
    });

    it('should not include fields not needed for update', () => {
      // Act
      const result = transformer.transformForUpdate(mockJob);

      // Assert
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('budget');
      expect(result).not.toHaveProperty('requiredSkills');
      expect(result).not.toHaveProperty('preferredSkills');
      expect(result).not.toHaveProperty('attachments');
    });

    it('should return null for null/undefined job', () => {
      // Act & Assert
      expect(transformer.transformForUpdate(null)).toBeNull();
      expect(transformer.transformForUpdate(undefined)).toBeNull();
    });
  });

  describe('private methods', () => {
    describe('transformClient', () => {
      it('should transform client with complete information', () => {
        // Arrange
        const completeClient = {
          id: 'client-123',
          firstname: 'Jane',
          lastname: 'Smith',
          email: 'jane.smith@example.com'
        };

        // Act - Access private method through public method
        const result = transformer.transform(mockJob);
        const client = result!.client;

        // Assert
        expect(client).toEqual({
          id: 'client-123',
          name: 'John Doe',
          email: 'john.doe@example.com'
        });
      });

      it('should handle client with missing firstname', () => {
        // Arrange
        const jobWithPartialClient = {
          ...mockJob,
          client: {
            id: 'client-123',
            lastname: 'Smith',
            email: 'smith@example.com'
          }
        };

        // Act
        const result = transformer.transform(jobWithPartialClient);

        // Assert
        expect(result!.client!.name).toBe('Smith');
      });

      it('should handle client with missing lastname', () => {
        // Arrange
        const jobWithPartialClient = {
          ...mockJob,
          client: {
            id: 'client-123',
            firstname: 'Jane',
            email: 'jane@example.com'
          }
        };

        // Act
        const result = transformer.transform(jobWithPartialClient);

        // Assert
        expect(result!.client!.name).toBe('Jane');
      });

      it('should handle client with missing both names', () => {
        // Arrange
        const jobWithPartialClient = {
          ...mockJob,
          client: {
            id: 'client-123',
            email: 'unknown@example.com'
          }
        };

        // Act
        const result = transformer.transform(jobWithPartialClient);

        // Assert
        expect(result!.client!.name).toBe('Unknown');
      });

      it('should handle client with empty names', () => {
        // Arrange
        const jobWithEmptyNames = {
          ...mockJob,
          client: {
            id: 'client-123',
            firstname: '',
            lastname: '',
            email: 'test@example.com'
          }
        };

        // Act
        const result = transformer.transform(jobWithEmptyNames);

        // Assert
        expect(result!.client!.name).toBe('Unknown');
      });

      it('should handle null client', () => {
        // Arrange
        const jobWithoutClient = {
          ...mockJob,
          client: null
        };

        // Act
        const result = transformer.transform(jobWithoutClient);

        // Assert
        expect(result!.client).toBeNull();
      });

      it('should handle undefined client', () => {
        // Arrange
        const jobWithoutClient = {
          ...mockJob,
          client: undefined
        };

        // Act
        const result = transformer.transform(jobWithoutClient);

        // Assert
        expect(result!.client).toBeNull();
      });

      it('should handle client with missing email', () => {
        // Arrange
        const jobWithPartialClient = {
          ...mockJob,
          client: {
            id: 'client-123',
            firstname: 'John',
            lastname: 'Doe'
          }
        };

        // Act
        const result = transformer.transform(jobWithPartialClient);

        // Assert
        expect(result!.client!.email).toBe('');
      });
    });

    describe('transformBudget', () => {
      it('should transform budget with complete information', () => {
        // Act
        const result = transformer.transform(mockJob);

        // Assert
        expect(result!.budget).toEqual({
          type: 'FIXED',
          amount: 5000,
          currency: 'USD'
        });
      });

      it('should handle budget with missing fields', () => {
        // Arrange
        const jobWithPartialBudget = {
          ...mockJob,
          budget: {
            type: 'HOURLY'
          }
        };

        // Act
        const result = transformer.transform(jobWithPartialBudget);

        // Assert
        expect(result!.budget).toEqual({
          type: 'HOURLY',
          amount: 0,
          currency: 'USD'
        });
      });

      it('should handle null budget', () => {
        // Arrange
        const jobWithoutBudget = {
          ...mockJob,
          budget: null
        };

        // Act
        const result = transformer.transform(jobWithoutBudget);

        // Assert
        expect(result!.budget).toBeNull();
      });

      it('should handle undefined budget', () => {
        // Arrange
        const jobWithoutBudget = {
          ...mockJob,
          budget: undefined
        };

        // Act
        const result = transformer.transform(jobWithoutBudget);

        // Assert
        expect(result!.budget).toBeNull();
      });

      it('should handle non-object budget', () => {
        // Arrange
        const jobWithInvalidBudget = {
          ...mockJob,
          budget: 'invalid-budget'
        };

        // Act
        const result = transformer.transform(jobWithInvalidBudget);

        // Assert
        expect(result!.budget).toBeNull();
      });

      it('should handle budget with falsy values', () => {
        // Arrange
        const jobWithFalsyBudget = {
          ...mockJob,
          budget: {
            type: '',
            amount: 0,
            currency: ''
          }
        };

        // Act
        const result = transformer.transform(jobWithFalsyBudget);

        // Assert
        // Note: Empty strings and 0 are treated as falsy by the || operator
        expect(result!.budget).toEqual({
          type: 'UNKNOWN', // Empty string is falsy, gets default 'UNKNOWN'
          amount: 0, // 0 is preserved
          currency: 'USD' // Empty string is falsy, gets default 'USD'
        });
      });
    });

    describe('transformSkills', () => {
      it('should transform skills array correctly', () => {
        // Act
        const result = transformer.transform(mockJob);

        // Assert
        expect(result!.requiredSkills).toEqual(mockRequiredSkills);
        expect(result!.preferredSkills).toEqual(mockPreferredSkills);
      });

      it('should handle null skills', () => {
        // Arrange
        const jobWithoutSkills = {
          ...mockJob,
          requiredSkills: null,
          preferredSkills: null
        };

        // Act
        const result = transformer.transform(jobWithoutSkills);

        // Assert
        expect(result!.requiredSkills).toEqual([]);
        expect(result!.preferredSkills).toEqual([]);
      });

      it('should handle undefined skills', () => {
        // Arrange
        const jobWithoutSkills = {
          ...mockJob,
          requiredSkills: undefined,
          preferredSkills: undefined
        };

        // Act
        const result = transformer.transform(jobWithoutSkills);

        // Assert
        expect(result!.requiredSkills).toEqual([]);
        expect(result!.preferredSkills).toEqual([]);
      });

      it('should handle non-array skills', () => {
        // Arrange
        const jobWithInvalidSkills = {
          ...mockJob,
          requiredSkills: 'not-an-array',
          preferredSkills: 123
        };

        // Act
        const result = transformer.transform(jobWithInvalidSkills);

        // Assert
        expect(result!.requiredSkills).toEqual([]);
        expect(result!.preferredSkills).toEqual([]);
      });

      it('should filter out invalid skill objects', () => {
        // Arrange
        const jobWithMixedSkills = {
          ...mockJob,
          requiredSkills: [
            { skill: 'React', level: 'EXPERT' },
            null,
            undefined,
            'invalid-skill',
            { skill: 'TypeScript', level: 'ADVANCED' }
          ]
        };

        // Act
        const result = transformer.transform(jobWithMixedSkills);

        // Assert
        expect(result!.requiredSkills).toEqual([
          { skill: 'React', level: 'EXPERT' },
          { skill: 'TypeScript', level: 'ADVANCED' }
        ]);
      });
    });

    describe('transformArray', () => {
      it('should transform array correctly', () => {
        // Act
        const result = transformer.transform(mockJob);

        // Assert
        expect(result!.tags).toEqual(['react', 'typescript', 'fullstack', 'remote']);
        expect(result!.attachments).toEqual(['https://example.com/file1.pdf', 'https://example.com/file2.jpg']);
        expect(result!.deliverables).toEqual(['Source code', 'Documentation', 'Deployment guide']);
        expect(result!.riskFactors).toEqual(['Tight deadline', 'Complex integration requirements']);
      });

      it('should handle null array', () => {
        // Arrange
        const jobWithNullArrays = {
          ...mockJob,
          tags: null,
          attachments: null
        };

        // Act
        const result = transformer.transform(jobWithNullArrays);

        // Assert
        expect(result!.tags).toEqual([]);
        expect(result!.attachments).toEqual([]);
      });

      it('should handle undefined array', () => {
        // Arrange
        const jobWithUndefinedArrays = {
          ...mockJob,
          tags: undefined,
          attachments: undefined
        };

        // Act
        const result = transformer.transform(jobWithUndefinedArrays);

        // Assert
        expect(result!.tags).toEqual([]);
        expect(result!.attachments).toEqual([]);
      });

      it('should handle non-array input', () => {
        // Arrange
        const jobWithInvalidArrays = {
          ...mockJob,
          tags: 'not-an-array',
          attachments: 123
        };

        // Act
        const result = transformer.transform(jobWithInvalidArrays);

        // Assert
        expect(result!.tags).toEqual([]);
        expect(result!.attachments).toEqual([]);
      });

      it('should filter out null and undefined items', () => {
        // Arrange
        const jobWithMixedArrays = {
          ...mockJob,
          tags: ['react', null, 'typescript', undefined, 'fullstack']
        };

        // Act
        const result = transformer.transform(jobWithMixedArrays);

        // Assert
        expect(result!.tags).toEqual(['react', 'typescript', 'fullstack']);
      });

      it('should handle empty array', () => {
        // Arrange
        const jobWithEmptyArrays = {
          ...mockJob,
          tags: [],
          attachments: []
        };

        // Act
        const result = transformer.transform(jobWithEmptyArrays);

        // Assert
        expect(result!.tags).toEqual([]);
        expect(result!.attachments).toEqual([]);
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle job with all null values', () => {
      // Arrange
      const nullJob = {
        id: null,
        title: null,
        description: null,
        client: null,
        budget: null,
        requiredSkills: null,
        preferredSkills: null,
        tags: null,
        attachments: null,
        deliverables: null,
        riskFactors: null
      };

      // Act
      const result = transformer.transform(nullJob);

      // Assert
      expect(result!.id).toBe('');
      expect(result!.title).toBe('');
      expect(result!.description).toBe('');
      expect(result!.client).toBeNull();
      expect(result!.budget).toBeNull();
      expect(result!.requiredSkills).toEqual([]);
      expect(result!.preferredSkills).toEqual([]);
      expect(result!.tags).toEqual([]);
      expect(result!.attachments).toEqual([]);
      expect(result!.deliverables).toEqual([]);
      expect(result!.riskFactors).toEqual([]);
    });

    it('should handle job with all undefined values', () => {
      // Arrange
      const undefinedJob = {
        id: undefined,
        title: undefined,
        description: undefined,
        client: undefined,
        budget: undefined,
        requiredSkills: undefined,
        preferredSkills: undefined,
        tags: undefined,
        attachments: undefined,
        deliverables: undefined,
        riskFactors: undefined
      };

      // Act
      const result = transformer.transform(undefinedJob);

      // Assert
      expect(result!.id).toBe('');
      expect(result!.title).toBe('');
      expect(result!.description).toBe('');
      expect(result!.client).toBeNull();
      expect(result!.budget).toBeNull();
      expect(result!.requiredSkills).toEqual([]);
      expect(result!.preferredSkills).toEqual([]);
      expect(result!.tags).toEqual([]);
      expect(result!.attachments).toEqual([]);
      expect(result!.deliverables).toEqual([]);
      expect(result!.riskFactors).toEqual([]);
    });

    it('should handle job with mixed data types', () => {
      // Arrange
      const mixedJob = {
        id: 123,
        title: ['title', 'array'],
        description: { nested: 'object' },
        deadline: 'invalid-date',
        status: 404,
        priority: 'INVALID_PRIORITY',
        projectType: ['invalid', 'type'],
        location: null,
        estimatedHours: 'eighty',
        client: 'not-a-client-object',
        budget: [1, 2, 3],
        requiredSkills: 'string-skills',
        preferredSkills: { skill: 'object' },
        tags: 'single-tag',
        attachments: 5,
        requirements: ['array', 'requirements'],
        deliverables: 'string-deliverables',
        constraints: true,
        riskFactors: 42
      };

      // Act
      const result = transformer.transform(mixedJob);

      // Assert
      expect(result!.id).toBe(123);
      expect(result!.title).toEqual(['title', 'array']);
      expect(result!.description).toEqual({ nested: 'object' });
      expect(result!.deadline).toBe('invalid-date');
      expect(result!.status).toBe(404);
      expect(result!.priority).toBe('INVALID_PRIORITY');
      expect(result!.projectType).toEqual(['invalid', 'type']);
      expect(result!.location).toBe('REMOTE'); // null is falsy, gets default 'REMOTE'
      expect(result!.estimatedHours).toBe('eighty');
      // The client is a string, so transformClient returns null, but the job object itself becomes the client
      expect(result!.client).toEqual({
        id: undefined,
        name: 'Unknown',
        email: ''
      });
      // Arrays are objects in JavaScript, so transformBudget processes it
      expect(result!.budget).toEqual({
        type: 'UNKNOWN',
        amount: 0,
        currency: 'USD'
      });
      expect(result!.requiredSkills).toEqual([]);
      expect(result!.preferredSkills).toEqual([]);
      expect(result!.tags).toEqual([]);
      expect(result!.attachments).toEqual([]);
      expect(result!.requirements).toEqual(['array', 'requirements']);
      expect(result!.deliverables).toEqual([]);
      expect(result!.constraints).toBe(true);
      expect(result!.riskFactors).toEqual([]);
    });

    it('should handle deeply nested objects', () => {
      // Arrange
      const deepJob = {
        ...mockJob,
        client: {
          ...mockClient,
          profile: {
            avatar: {
              url: 'https://example.com/avatar.jpg',
              thumbnail: {
                small: 'https://example.com/thumb-small.jpg',
                medium: 'https://example.com/thumb-medium.jpg'
              }
            }
          }
        }
      };

      // Act
      const result = transformer.transform(deepJob);

      // Assert
      // Should only extract the basic client fields, not the nested profile
      expect(result!.client).toEqual({
        id: 'client-123',
        name: 'John Doe',
        email: 'john.doe@example.com'
      });
    });

    it('should handle circular references gracefully', () => {
      // Arrange
      const circularJob = { ...mockJob };
      (circularJob as any).client = circularJob; // Create circular reference

      // Act & Assert - Should not throw error
      expect(() => transformer.transform(circularJob)).not.toThrow();
      
      const result = transformer.transform(circularJob);
      // Circular reference creates a client object with the job's own properties
      expect(result!.client).toEqual({
        id: 'job-123',
        name: 'Unknown', // No firstname/lastname, so gets 'Unknown'
        email: '' // No email, so gets empty string
      });
    });
  });
});

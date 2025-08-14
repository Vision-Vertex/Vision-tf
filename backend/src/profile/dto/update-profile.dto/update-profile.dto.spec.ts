import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateProfileDto } from './update-profile.dto';

describe('UpdateProfileDto', () => {
  it('should validate valid profile update', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      displayName: 'John Doe',
      bio: 'Software engineer at XYZ',
      profilePictureUrl: 'https://example.com/avatar.jpg',
      chatLastReadAt: '2025-08-11T10:30:00Z'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with partial data', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      displayName: 'John Doe',
      bio: 'Software engineer at XYZ'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with only display name', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      displayName: 'John Doe'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with only bio', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      bio: 'Software engineer at XYZ'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with only profile picture URL', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      profilePictureUrl: 'https://example.com/avatar.jpg'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with only chat last read timestamp', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      chatLastReadAt: '2025-08-11T10:30:00Z'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate empty object', async () => {
    const dto = plainToClass(UpdateProfileDto, {});

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with null values for optional fields', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      displayName: 'John Doe',
      bio: null,
      profilePictureUrl: null,
      chatLastReadAt: null
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with undefined values for optional fields', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      displayName: 'John Doe',
      bio: undefined,
      profilePictureUrl: undefined,
      chatLastReadAt: undefined
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid display name type', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      displayName: 123 // Should be string
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid bio type', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      bio: 123 // Should be string
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid profile picture URL type', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      profilePictureUrl: 123 // Should be string
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid chat last read timestamp format', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      chatLastReadAt: 'invalid-date-format'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid chat last read timestamp type', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      chatLastReadAt: 123 // Should be string
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate with empty string values', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      displayName: '',
      bio: '',
      profilePictureUrl: ''
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with long text values', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      displayName: 'A'.repeat(100),
      bio: 'B'.repeat(1000),
      profilePictureUrl: 'https://example.com/very/long/url/with/many/segments/and/parameters?param1=value1&param2=value2'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with special characters', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      displayName: 'John-Doe (Developer)',
      bio: 'Software engineer specializing in React & Node.js. Love working with TypeScript! 🚀',
      profilePictureUrl: 'https://example.com/avatar.jpg?size=large&format=png'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with different date formats', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      chatLastReadAt: '2025-08-11T10:30:00.000Z'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with different URL formats', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      profilePictureUrl: 'http://example.com/avatar.jpg'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with relative URL', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      profilePictureUrl: '/avatars/john-doe.jpg'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with data URL', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      profilePictureUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with all fields populated', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      displayName: 'John Doe',
      bio: 'Software engineer at XYZ with 5+ years of experience in full-stack development. Passionate about creating scalable and maintainable code.',
      profilePictureUrl: 'https://example.com/avatars/john-doe.jpg?size=large&format=webp',
      chatLastReadAt: '2025-08-11T10:30:00.123Z'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with whitespace-only strings', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      displayName: '   ',
      bio: '\t\n\r',
      profilePictureUrl: ' '
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with unicode characters', async () => {
    const dto = plainToClass(UpdateProfileDto, {
      displayName: 'José María',
      bio: 'Développeur logiciel avec expérience en React et Node.js. Passionné par la création de code maintenable.',
      profilePictureUrl: 'https://example.com/avatars/josé-maría.jpg'
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

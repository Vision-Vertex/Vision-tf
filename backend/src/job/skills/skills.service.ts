import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  SkillLevel, 
  SkillCategory, 
  JobSkillRequirementDto, 
  SkillValidationResponseDto,
  SkillSuggestionsDto,
  CreateSkillDto,
  UpdateSkillDto,
  SkillSearchDto
} from './dto/skill.dto';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  normalizedValue?: string | number;
}

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== SKILL VALIDATION AND NORMALIZATION =====

  /**
   * Validate skill name format and content
   */
  validateSkillName(skillName: string): ValidationResult {
    const errors: string[] = [];
    
    if (!skillName || typeof skillName !== 'string') {
      errors.push('Skill name must be a non-empty string');
      return { isValid: false, errors };
    }

    const trimmed = skillName.trim();
    
    if (trimmed.length < 1) {
      errors.push('Skill name must be at least 1 character long');
    }
    
    if (trimmed.length > 100) {
      errors.push('Skill name must be no more than 100 characters long');
    }

    // Check for invalid characters (allow letters, numbers, spaces, hyphens, dots, plus signs)
    const validPattern = /^[a-zA-Z0-9\s\-\.\+]+$/;
    if (!validPattern.test(trimmed)) {
      errors.push('Skill name contains invalid characters. Only letters, numbers, spaces, hyphens, dots, and plus signs are allowed');
    }

    // Check for common spam patterns
    const spamPatterns = [
      /\b(spam|test|demo|example|temp|tmp)\b/i,
      /^[0-9]+$/,
      /^[^a-zA-Z]+$/,
      /\b(admin|root|system|user)\b/i
    ];

    for (const pattern of spamPatterns) {
      if (pattern.test(trimmed)) {
        errors.push('Skill name appears to be invalid or spam');
        break;
      }
    }

    const isValid = errors.length === 0;
    const normalizedValue = isValid ? this.normalizeSkillName(trimmed) : undefined;

    return {
      isValid,
      errors,
      normalizedValue
    };
  }

  /**
   * Normalize skill name for consistent storage and comparison
   */
  normalizeSkillName(skillName: string): string {
    if (!skillName) return '';

    return skillName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/^[a-z]/, (match) => match.toUpperCase()) // Capitalize first letter
      .replace(/\s+[a-z]/g, (match) => match.toUpperCase()) // Capitalize first letter of each word
      .replace(/\b(js|ts|css|html|sql|api|ui|ux|devops|ai|ml|vr|ar)\b/gi, (match) => match.toUpperCase()) // Common abbreviations
      .replace(/\b(react|vue|angular|node|python|java|php|ruby|go|rust|swift|kotlin)\b/gi, (match) => match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()); // Framework names
  }

  /**
   * Validate skill level
   */
  validateSkillLevel(level: string): ValidationResult {
    const errors: string[] = [];
    
    if (!level || typeof level !== 'string') {
      errors.push('Skill level must be a non-empty string');
      return { isValid: false, errors };
    }

    const normalizedLevel = level.toUpperCase();
    const validLevels = Object.values(SkillLevel);
    
    if (!validLevels.includes(normalizedLevel as SkillLevel)) {
      errors.push(`Invalid skill level. Must be one of: ${validLevels.join(', ')}`);
    }

    const isValid = errors.length === 0;
    
    return {
      isValid,
      errors,
      normalizedValue: isValid ? normalizedLevel : undefined
    };
  }

  /**
   * Validate skill weight
   */
  validateSkillWeight(weight: number): ValidationResult {
    const errors: string[] = [];
    
    if (typeof weight !== 'number' || isNaN(weight)) {
      errors.push('Skill weight must be a valid number');
      return { isValid: false, errors };
    }

    if (weight < 0) {
      errors.push('Skill weight cannot be negative');
    }
    
    if (weight > 1) {
      errors.push('Skill weight cannot exceed 1.0');
    }

    // Round to 2 decimal places for consistency
    const normalizedWeight = Math.round(weight * 100) / 100;

    const isValid = errors.length === 0;
    
    return {
      isValid,
      errors,
      normalizedValue: isValid ? normalizedWeight : undefined
    };
  }

  /**
   * Validate skill category
   */
  validateSkillCategory(category: string): ValidationResult {
    const errors: string[] = [];
    
    if (!category || typeof category !== 'string') {
      errors.push('Skill category must be a non-empty string');
      return { isValid: false, errors };
    }

    const normalizedCategory = category.toUpperCase();
    const validCategories = Object.values(SkillCategory);
    
    if (!validCategories.includes(normalizedCategory as SkillCategory)) {
      errors.push(`Invalid skill category. Must be one of: ${validCategories.join(', ')}`);
    }

    const isValid = errors.length === 0;
    
    return {
      isValid,
      errors,
      normalizedValue: isValid ? normalizedCategory : undefined
    };
  }

  /**
   * Comprehensive validation of job skill requirements
   */
  validateJobSkills(requiredSkills: JobSkillRequirementDto[], preferredSkills?: JobSkillRequirementDto[]): SkillValidationResponseDto {
    const errors: string[] = [];
    const validSkills: string[] = [];
    const invalidSkills: string[] = [];
    const suggestions: string[] = [];

    // Validate required skills
    if (!requiredSkills || !Array.isArray(requiredSkills)) {
      errors.push('Required skills must be an array');
      return this.createValidationResponse(false, errors, validSkills, invalidSkills, suggestions);
    }

    if (requiredSkills.length === 0) {
      errors.push('At least one required skill must be specified');
      return this.createValidationResponse(false, errors, validSkills, invalidSkills, suggestions);
    }

    // Validate each required skill
    for (let i = 0; i < requiredSkills.length; i++) {
      const skill = requiredSkills[i];
      const skillErrors: string[] = [];

      // Validate skill object structure
      if (!skill || typeof skill !== 'object') {
        skillErrors.push(`Required skill at index ${i} must be an object`);
        invalidSkills.push(`Skill ${i + 1}`);
        continue;
      }

      // Validate skill name
      const nameValidation = this.validateSkillName(skill.skill);
      if (!nameValidation.isValid) {
        skillErrors.push(`Required skill ${i + 1} name: ${nameValidation.errors.join(', ')}`);
        invalidSkills.push(skill.skill || `Skill ${i + 1}`);
      } else {
        if (typeof nameValidation.normalizedValue === 'string') {
          validSkills.push(nameValidation.normalizedValue);
        }
      }

      // Validate skill level
      const levelValidation = this.validateSkillLevel(skill.level);
      if (!levelValidation.isValid) {
        skillErrors.push(`Required skill ${i + 1} level: ${levelValidation.errors.join(', ')}`);
      }

      // Validate skill weight
      const weightValidation = this.validateSkillWeight(skill.weight);
      if (!weightValidation.isValid) {
        skillErrors.push(`Required skill ${i + 1} weight: ${weightValidation.errors.join(', ')}`);
      }

      // Add skill-specific errors
      if (skillErrors.length > 0) {
        errors.push(...skillErrors);
      }
    }

    // Validate preferred skills if provided
    if (preferredSkills && Array.isArray(preferredSkills)) {
      for (let i = 0; i < preferredSkills.length; i++) {
        const skill = preferredSkills[i];
        const skillErrors: string[] = [];

        if (!skill || typeof skill !== 'object') {
          skillErrors.push(`Preferred skill at index ${i} must be an object`);
          invalidSkills.push(`Preferred Skill ${i + 1}`);
          continue;
        }

        // Validate skill name
        const nameValidation = this.validateSkillName(skill.skill);
        if (!nameValidation.isValid) {
          skillErrors.push(`Preferred skill ${i + 1} name: ${nameValidation.errors.join(', ')}`);
          invalidSkills.push(skill.skill || `Preferred Skill ${i + 1}`);
              } else {
        if (typeof nameValidation.normalizedValue === 'string') {
          validSkills.push(nameValidation.normalizedValue);
        }
      }

        // Validate skill level
        const levelValidation = this.validateSkillLevel(skill.level);
        if (!levelValidation.isValid) {
          skillErrors.push(`Preferred skill ${i + 1} level: ${levelValidation.errors.join(', ')}`);
        }

        // Validate skill weight
        const weightValidation = this.validateSkillWeight(skill.weight);
        if (!weightValidation.isValid) {
          skillErrors.push(`Preferred skill ${i + 1} weight: ${weightValidation.errors.join(', ')}`);
        }

        // Add skill-specific errors
        if (skillErrors.length > 0) {
          errors.push(...skillErrors);
        }
      }
    }

    // Generate suggestions for invalid skill
    if (invalidSkills.length > 0) {
      for (const invalidSkill of invalidSkills) {
        if (typeof invalidSkill === 'string' && invalidSkill.length > 0) {
          const similarSkills = this.findSimilarSkills(invalidSkill);
          if (similarSkills.length > 0) {
            suggestions.push(`Did you mean: ${similarSkills.slice(0, 3).join(', ')}`);
          }
        }
      }
    }

    const isValid = errors.length === 0;
    return this.createValidationResponse(isValid, errors, validSkills, invalidSkills, suggestions);
  }

  /**
   * Find similar skills based on input
   */
  private findSimilarSkills(input: string): string[] {
    const availableSkills = this.getAvailableSkills();
    const normalizedInput = typeof input === 'string' ? input.toLowerCase() : '';
    
    return availableSkills
      .filter(skill => 
        skill.toLowerCase().includes(normalizedInput) || 
        normalizedInput.includes(skill.toLowerCase()) ||
        this.calculateSimilarity(normalizedInput, skill.toLowerCase()) > 0.6
      )
      .slice(0, 5); // Return top 5 matches
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
  }

  /**
   * Create validation response object
   */
  private createValidationResponse(
    valid: boolean, 
    errors: string[], 
    validSkills: string[], 
    invalidSkills: string[], 
    suggestions: string[]
  ): SkillValidationResponseDto {
    return {
      valid,
      errors,
      validSkills,
      invalidSkills,
      suggestions
    };
  }

  // ===== EXISTING METHODS (Enhanced) =====

  /**
   * Get all available skills with validation
   */
  getAvailableSkills(): string[] {
    return [
      // Frontend
      'React', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Sass', 'Less', 'Tailwind CSS',
      'Bootstrap', 'Material-UI', 'Ant Design', 'Next.js', 'Nuxt.js', 'Gatsby', 'Redux', 'Vuex', 'Zustand',
      
      // Backend
      'Node.js', 'Express.js', 'NestJS', 'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring Boot',
      'C#', '.NET', 'ASP.NET Core', 'PHP', 'Laravel', 'Symfony', 'Ruby', 'Ruby on Rails', 'Go', 'Rust',
      
      // Database
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'DynamoDB', 'Firebase',
      'Prisma', 'TypeORM', 'Sequelize', 'Mongoose', 'Drizzle',
      
      // DevOps & Cloud
      'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'Terraform', 'Ansible', 'Jenkins', 'GitLab CI',
      'GitHub Actions', 'Nginx', 'Apache', 'Linux', 'Shell Scripting',
      
      // Mobile
      'React Native', 'Flutter', 'Swift', 'Kotlin', 'Xamarin', 'Ionic', 'Cordova', 'PhoneGap',
      
      // Testing
      'Jest', 'Mocha', 'Chai', 'Cypress', 'Playwright', 'Selenium', 'JUnit', 'PyTest', 'PHPUnit',
      
      // AI/ML
      'TensorFlow', 'PyTorch', 'Scikit-learn', 'OpenAI API', 'LangChain', 'Hugging Face',
      
      // Other
      'GraphQL', 'REST API', 'WebSocket', 'Microservices', 'Serverless', 'Blockchain', 'Web3', 'Unity', 'Unreal Engine'
    ];
  }

  /**
   * Search skills with enhanced validation
   */
  searchSkills(query: string, limit: number = 10): string[] {
    const validation = this.validateSkillName(query);
    if (!validation.isValid) {
      throw new BadRequestException(`Invalid search query: ${validation.errors.join(', ')}`);
    }

    const normalizedQuery = typeof validation.normalizedValue === 'string' ? validation.normalizedValue.toLowerCase() : '';
    const availableSkills = this.getAvailableSkills();
    
    return availableSkills
      .filter(skill => skill.toLowerCase().includes(normalizedQuery))
      .slice(0, limit);
  }

  /**
   * Get popular skills
   */
  getPopularSkills(limit: number = 10): string[] {
    // This would typically come from database analytics
    // For now, return a curated list of popular skills
    const popularSkills = [
      'React', 'Node.js', 'TypeScript', 'Python', 'JavaScript', 'Docker', 'AWS', 'PostgreSQL', 'Next.js', 'MongoDB'
    ];
    
    return popularSkills.slice(0, limit);
  }

  /**
   * Extract skills from job description with validation
   */
  extractSkillsFromDescription(description: string): string[] {
    if (!description || typeof description !== 'string') {
      throw new BadRequestException('Description must be a non-empty string');
    }

    const availableSkills = this.getAvailableSkills();
    const extractedSkills: string[] = [];
    
    // Simple keyword matching (in production, you'd use NLP)
    for (const skill of availableSkills) {
      if (description.toLowerCase().includes(skill.toLowerCase())) {
        extractedSkills.push(skill);
      }
    }

    // Remove duplicates and return
    return [...new Set(extractedSkills)];
  }

  /**
   * Get skill suggestions by project type
   */
  getSkillSuggestionsByProjectType(projectType: string): SkillSuggestionsDto {
    const projectTypeValidation = this.validateSkillCategory(projectType);
    if (!projectTypeValidation.isValid) {
      throw new BadRequestException(`Invalid project type: ${projectTypeValidation.errors.join(', ')}`);
    }

    const normalizedProjectType = typeof projectTypeValidation.normalizedValue === 'string' ? projectTypeValidation.normalizedValue : projectType;
    
    const suggestions: { [key: string]: { skills: string[], explanation: string } } = {
      'WEB_APP': {
        skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
        explanation: 'Full-stack web application development with modern technologies'
      },
      'MOBILE_APP': {
        skills: ['React Native', 'Flutter', 'TypeScript', 'Firebase', 'Redux'],
        explanation: 'Cross-platform mobile development with native performance'
      },
      'API': {
        skills: ['Node.js', 'Express.js', 'PostgreSQL', 'Docker', 'Jest'],
        explanation: 'Robust API development with testing and containerization'
      },
      'DESIGN': {
        skills: ['Figma', 'Adobe XD', 'Sketch', 'HTML5', 'CSS3'],
        explanation: 'UI/UX design with frontend implementation skills'
      },
      'DATABASE': {
        skills: ['PostgreSQL', 'MongoDB', 'Redis', 'Prisma', 'Docker'],
        explanation: 'Database design, optimization, and management'
      },
      'DEVOPS': {
        skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'Jenkins'],
        explanation: 'Infrastructure automation and cloud deployment'
      }
    };

    const defaultSuggestion = {
      skills: ['JavaScript', 'TypeScript', 'Git', 'Docker'],
      explanation: 'General development skills for various project types'
    };

    const suggestion = suggestions[normalizedProjectType] || defaultSuggestion;
    
    return {
      projectType: normalizedProjectType,
      skills: suggestion.skills,
      explanation: suggestion.explanation
    };
  }

  /**
   * Validate and normalize skill data for storage
   */
  validateAndNormalizeSkillData(skillData: CreateSkillDto | UpdateSkillDto): ValidationResult {
    const errors: string[] = [];
    
    // Validate name if provided
    if ('name' in skillData && skillData.name) {
      const nameValidation = this.validateSkillName(skillData.name);
      if (!nameValidation.isValid) {
        errors.push(...nameValidation.errors);
      }
    }
    
    // Validate category if provided
    if ('category' in skillData && skillData.category) {
      const categoryValidation = this.validateSkillCategory(skillData.category);
      if (!categoryValidation.isValid) {
        errors.push(...categoryValidation.errors);
      }
    }
    
    // Validate description if provided
    if ('description' in skillData && skillData.description) {
      if (typeof skillData.description !== 'string' || skillData.description.length > 1000) {
        errors.push('Description must be a string no longer than 1000 characters');
      }
    }

    const isValid = errors.length === 0;
    
    return {
      isValid,
      errors,
      normalizedValue: undefined
    };
  }
}

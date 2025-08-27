# Skills System for Job Creation and Developer Matching

This module provides a comprehensive skills management system for job creation and developer matching without requiring database schema changes.

## Overview

The skills system works with your existing Prisma schema:
- Uses existing `Job.requiredSkills` and `Job.preferredSkills` JSON fields
- Works with existing `Profile.skills` String[] field
- Implements matching algorithm based on your requirements
- **NEW**: Comprehensive validation and normalization rules
- **NEW**: Configurable matching algorithm parameters
- **NEW**: Professional DTOs with Swagger documentation

## Features

### 1. Skills Management
- **Available Skills**: Curated list of common development skills
- **Skill Validation**: Comprehensive validation with normalization rules
- **Skill Suggestions**: Recommends skills based on project type
- **Skill Extraction**: Extracts skills from job descriptions
- **Validation Rules**: Configurable rules for skill names, levels, and weights

### 2. Job Skills Management
- **Add/Remove Skills**: Manage required and preferred skills for jobs
- **Skill Statistics**: Track skill usage across all jobs
- **Format Validation**: Ensure proper skill data structure
- **Normalization**: Consistent skill naming and formatting

### 3. Developer Matching Algorithm
- **Priority Levels**: 
  - HIGH: 80%+ match (configurable)
  - MEDIUM: 50-79% match (configurable)
  - LOW: 30-49% match (configurable)
  - VERY_LOW: <30% match (configurable)
- **Configurable Weights**: Adjust required vs preferred skill importance
- **Skill Gap Analysis**: Identify missing skills and provide recommendations
- **Top Matches**: Find best developers for specific jobs
- **Advanced Filtering**: Custom search parameters and thresholds

## API Endpoints

### Skills
- `GET /skills` - Get all available skills
- `GET /skills/popular` - Get popular skills
- `GET /skills/search?q=query` - Search skills with validation
- `POST /skills/validate` - Validate job skills with detailed feedback
- `POST /skills/extract` - Extract skills from description
- `GET /skills/suggestions/:projectType` - Get skill suggestions by project type
- `POST /skills/create` - Create new skill (with validation)
- `POST /skills/update` - Update existing skill (with validation)
- `GET /skills/validation-rules` - Get validation rules and constraints

### Job Skills
- `GET /job-skills/job/:jobId` - Get skills for a job
- `PUT /job-skills/job/:jobId` - Update job skills
- `POST /job-skills/job/:jobId/add` - Add skills to job
- `DELETE /job-skills/job/:jobId/remove` - Remove skills from job
- `GET /job-skills/statistics` - Get skill statistics

### Matching
- `POST /matching/user/:userId/job/:jobId` - Match user to job
- `GET /matching/user/:userId/job/:jobId/gap-analysis` - Skill gap analysis
- `GET /matching/job/:jobId/developers` - Find matching developers
- `GET /matching/user/:userId/jobs` - Find matching jobs
- `GET /matching/job/:jobId/developers/top` - Top 3 matches
- `GET /matching/user/:userId/jobs/recommended` - Recommended jobs
- `GET /matching/config` - Get matching algorithm configuration
- `PUT /matching/config` - Update matching algorithm configuration
- `POST /matching/job/:jobId/developers/advanced` - Advanced developer search

## DTOs and Validation

### Skill DTOs
- `CreateSkillDto` - For creating new skills
- `UpdateSkillDto` - For updating existing skills
- `JobSkillRequirementDto` - For job skill requirements
- `CreateJobSkillsDto` - For job skills creation
- `UpdateJobSkillsDto` - For job skills updates
- `SkillValidationResponseDto` - Validation results with suggestions

### Matching DTOs
- `MatchingConfigDto` - Algorithm configuration
- `UpdateMatchingConfigDto` - Configuration updates
- `JobMatchResultDto` - Match results with priority
- `SkillMatchDto` - Individual skill match details
- `SkillGapAnalysisDto` - Skill gap analysis results
- `MatchingQueryDto` - Advanced search parameters

### Validation Rules
- **Skill Names**: 2-50 characters, alphanumeric + spaces/hyphens/dots/plus
- **Skill Levels**: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
- **Skill Weights**: 0.0 to 1.0 with 2 decimal precision
- **Spam Protection**: Blocks common invalid patterns
- **Normalization**: Consistent formatting and case handling

## Usage Examples

### Creating a Job with Validated Skills
```typescript
// Job creation with skills validation
const jobSkills = {
  requiredSkills: [
    { skill: "React", level: "EXPERT", weight: 1.0 },
    { skill: "TypeScript", level: "ADVANCED", weight: 0.8 }
  ],
  preferredSkills: [
    { skill: "Node.js", level: "INTERMEDIATE", weight: 0.5 }
  ]
};

// Validate before creating job
const validation = await skillsService.validateJobSkills(
  jobSkills.requiredSkills,
  jobSkills.preferredSkills
);

if (!validation.valid) {
  console.log('Validation errors:', validation.errors);
  console.log('Suggestions:', validation.suggestions);
}
```

### Configuring Matching Algorithm
```typescript
// Update matching thresholds
await matchingService.updateMatchingConfig({
  highPriorityThreshold: 0.85,    // 85%+ for HIGH priority
  mediumPriorityThreshold: 0.60,  // 60%+ for MEDIUM priority
  lowPriorityThreshold: 0.35,     // 35%+ for LOW priority
  requiredSkillsWeight: 0.75,     // 75% weight for required skills
  preferredSkillsWeight: 0.25     // 25% weight for preferred skills
});
```

### Advanced Developer Search
```typescript
// Advanced search with custom parameters
const searchParams = {
  limit: 15,
  minMatchPercentage: 0.6,        // Only 60%+ matches
  highPriorityOnly: false,        // Include all priority levels
  sortByMatch: true               // Sort by match percentage
};

const matches = await matchingService.advancedDeveloperSearch(jobId, searchParams);
```

## Integration with Existing Code

### 1. Add to Job Module
```typescript
// In your job.module.ts
import { SkillsModule } from './skills/skills.module';

@Module({
  imports: [SkillsModule],
  // ... rest of your module
})
export class JobModule {}
```

### 2. Use in Job Service
```typescript
// In your job.service.ts
import { SkillsService } from './skills/skills.service';
import { CreateJobSkillsDto } from './skills/dto';

@Injectable()
export class JobService {
  constructor(private readonly skillsService: SkillsService) {}

  async createJob(createJobDto: CreateJobDto) {
    // Validate skills before creating job
    const skillValidation = await this.skillsService.validateJobSkills(
      createJobDto.requiredSkills,
      createJobDto.preferredSkills
    );

    if (!skillValidation.valid) {
      throw new BadRequestException(`Skill validation failed: ${skillValidation.errors.join(', ')}`);
    }

    // Create job with validated skills
    return this.prisma.job.create({
      data: createJobDto
    });
  }
}
```

## Benefits

✅ **No Database Changes**: Works with existing schema  
✅ **Immediate Deployment**: No migrations required  
✅ **Professional DTOs**: Full Swagger documentation  
✅ **Comprehensive Validation**: Input sanitization and spam protection  
✅ **Configurable Algorithm**: Adjustable thresholds and weights  
✅ **Skill Normalization**: Consistent data formatting  
✅ **Advanced Search**: Custom filtering and sorting  
✅ **Production Ready**: Enterprise-grade validation and error handling  

## Configuration Options

### Matching Algorithm Parameters
- **Priority Thresholds**: Customize HIGH/MEDIUM/LOW priority cutoffs
- **Skill Weights**: Adjust required vs preferred skill importance
- **Minimum Threshold**: Set minimum match percentage for results
- **Bonus/Penalty**: Configure exact level matches and missing skill penalties

### Validation Rules
- **Character Limits**: Configurable min/max lengths
- **Allowed Characters**: Customizable character sets
- **Spam Patterns**: Configurable blocklist patterns
- **Normalization**: Case handling and formatting rules

## Future Enhancements

- **Skill Categories**: Organize skills by domain
- **Advanced Matching**: Include experience and confidence scores
- **Skill Assessments**: Verify developer skill levels
- **Learning Paths**: Suggest skill development roadmaps
- **Market Trends**: Track skill demand over time
- **AI-Powered Extraction**: Advanced NLP for skill detection
- **Skill Analytics**: Usage patterns and popularity metrics

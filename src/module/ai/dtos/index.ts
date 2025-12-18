import { PropertyDto } from 'src/decorator';

export class OptimizeTextBodyDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'I am a software developer with 5 years of experience in web development.',
  })
  text: string;
}

export class OptimizeTextResponseDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
  })
  optimizedText: string;
}

export class ScoreResumeByJDBodyDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'Full CV content as plain text...',
  })
  resumeText: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'Job description text...',
  })
  jdText: string;
}

export class ScoreResumeByJDResponseDto {
  @PropertyDto({
    type: Number,
    required: true,
    validated: true,
  })
  score: number;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    structure: 'array',
  })
  missingSkills: string[];

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    structure: 'array',
  })
  weakSections: string[];

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    structure: 'array',
  })
  suggestions: string[];

  @PropertyDto({
    type: String,
    required: false,
    validated: true,
  })
  matchedRole?: string;
}


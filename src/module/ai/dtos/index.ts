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

export class CoverLetterBodyDto {
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

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'normal',
  })
  type: 'normal' | 'friendly';
}

export class CoverLetterResponseDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
  })
  type: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
  })
  language: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
  })
  coverLetter: string;
}

export class GenerateInterviewQuestionsBodyDto {
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

export class InterviewQuestionDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'technical',
  })
  type: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'Can you explain how React hooks work internally?',
  })
  question: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'A good answer should mention useState/useEffect lifecycle, render cycle, and rules of hooks.',
  })
  expectedAnswer: string;
}

export class GenerateInterviewQuestionsResponseDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'vi',
  })
  language: string;

  @PropertyDto({
    type: String,
    required: false,
    validated: true,
    example: 'Senior Frontend Developer',
  })
  matchedPosition?: string;

  @PropertyDto({
    type: InterviewQuestionDto,
    required: true,
    validated: true,
    structure: 'dtoArray',
  })
  questions: InterviewQuestionDto[];
}


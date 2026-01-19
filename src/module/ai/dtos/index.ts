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

export class QaItemDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
  })
  question: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
  })
  answer: string;
}

export class ScoreInterviewAnswersBodyDto {
  @PropertyDto({
    type: QaItemDto,
    required: true,
    validated: true,
    structure: 'dtoArray',
  })
  qaList: QaItemDto[];
}

export class ScoreInterviewAnswerResultDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
  })
  question: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
  })
  answer: string;

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
  })
  comment: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    structure: 'array',
  })
  improvementSuggestions: string[];
}

export class ScoreInterviewAnswersResponseDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
  })
  language: string;

  @PropertyDto({
    type: Number,
    required: true,
    validated: true,
  })
  averageScore: number;

  @PropertyDto({
    type: ScoreInterviewAnswerResultDto,
    required: true,
    validated: true,
    structure: 'dtoArray',
  })
  results: ScoreInterviewAnswerResultDto[];

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
  })
  overallFeedback: string;
}

export class TailorResumeByJDBodyDto {
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

export class TailorSectionDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'experience',
  })
  section: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'Kinh nghiệm làm việc',
  })
  title: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
  })
  original: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
  })
  optimized: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    structure: 'array',
  })
  changes: string[];

  @PropertyDto({
    type: Boolean,
    required: false,
    validated: true,
    example: false,
  })
  isNew?: boolean;
}

export class TailorResumeByJDResponseDto {
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
    type: Object,
    required: true,
    validated: true,
  })
  summary: {
    original: string;
    optimized: string;
  };

  @PropertyDto({
    type: TailorSectionDto,
    required: true,
    validated: true,
    structure: 'dtoArray',
  })
  sections: TailorSectionDto[];

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    structure: 'array',
  })
  overallSuggestions: string[];
}

export class SuggestJobsBodyDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'Full CV content as plain text...',
  })
  resumeText: string;

  @PropertyDto({
    type: String,
    required: false,
    validated: true,
    example: 'Vietnam',
  })
  location?: string;
}

export class JobSuggestionDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'Senior Frontend Developer',
  })
  jobTitle: string;

  @PropertyDto({
    type: String,
    required: false,
    validated: true,
    example: 'Google',
  })
  companyName?: string;

  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'https://jobs.google.com/...',
  })
  jobUrl: string;

  @PropertyDto({
    type: String,
    required: false,
    validated: true,
    example: 'Job description...',
  })
  jobDescription?: string;

  @PropertyDto({
    type: String,
    required: false,
    validated: true,
    example: 'Ho Chi Minh City, Vietnam',
  })
  location?: string;

  @PropertyDto({
    type: String,
    required: false,
    validated: true,
    example: 'LinkedIn, Indeed, etc.',
  })
  source?: string;
}

export class SuggestJobsResponseDto {
  @PropertyDto({
    type: String,
    required: true,
    validated: true,
    example: 'vi',
  })
  language: string;

  @PropertyDto({
    type: JobSuggestionDto,
    required: true,
    validated: true,
    structure: 'dtoArray',
  })
  jobs: JobSuggestionDto[];
}


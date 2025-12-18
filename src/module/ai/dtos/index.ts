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


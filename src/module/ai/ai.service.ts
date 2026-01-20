import { GoogleGenAI } from '@google/genai';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { ServerConfig } from '@server/config';
import { ServerLogger } from '@server/logger';
import { ERROR_RESPONSE } from 'src/common/const';
import { ServerException } from 'src/exception';
import { DatabaseService } from 'src/module/base/database';
import {
  CoverLetterResponseDto,
  GenerateInterviewQuestionsResponseDto,
  OptimizeTextResponseDto,
  QaItemDto,
  ScoreInterviewAnswersResponseDto,
  ScoreResumeByJDResponseDto,
  SuggestJobsResponseDto,
  TailorResumeByJDResponseDto,
} from './dtos';

@Injectable({ scope: Scope.REQUEST })
export class AiService {
  private static aiClient?: GoogleGenAI;
  private readonly ai?: GoogleGenAI;

  constructor(
    private readonly databaseService: DatabaseService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    if (!AiService.aiClient) {
      const apiKey = ServerConfig.get().GEMINI_API_KEY;
      if (!apiKey) {
        ServerLogger.warn({
          message: 'GEMINI_API_KEY is not set. AI features will not work.',
          context: 'AiService.constructor',
        });
      } else {
        // SDK mới, dùng endpoint v1
        AiService.aiClient = new GoogleGenAI({ apiKey });
      }
    }

    this.ai = AiService.aiClient;
  }

  private getCurrentUserId(): number {
    const userId = (this.request as any)?.user?.id;
    if (!userId) {
      throw new ServerException(ERROR_RESPONSE.UNAUTHORIZED);
    }
    return Number(userId);
  }

  async optimizeText(text: string): Promise<OptimizeTextResponseDto> {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    try {
      const prompt = `
You are a professional resume writing assistant.

Task:
Improve and optimize the following text to make it more professional, concise, and impactful.

IMPORTANT:
- The output MUST be in the SAME LANGUAGE as the input text
- Do NOT translate unless the input itself is translated
- You CAN add relevant information, achievements, skills, or details that would make the text more impressive and professional
- Be creative and enhance the content to make it stand out

Guidelines:
- Use professional and formal language
- Be concise and clear
- Highlight achievements and skills (you can add realistic achievements if they fit the context)
- Use strong action verbs
- Enhance the content with relevant details that would strengthen the profile
- Add specific metrics, numbers, or accomplishments when appropriate
- Ensure correct grammar and structure
- Make the text more compelling and competitive

Original text:
"""
${text}
"""

Return ONLY the optimized text.
`;

      const result: any = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      // tuỳ SDK, response có thể nằm trực tiếp trên result hoặc trong result.response
      const response = result?.response ?? result;
      const rawText =
        typeof response?.text === 'function' ? response.text() : (response?.text ?? '');
      const optimizedText = String(rawText || '').trim();

      return { optimizedText };
    } catch (error: any) {
      if (error?.status === 503) {
        throw new Error('AI đang quá tải, vui lòng thử lại sau vài giây.');
      }
      if (error?.status === 429) {
        const errorMessage = error?.message || '';
        if (errorMessage.includes('quota') || errorMessage.includes('Quota exceeded')) {
          throw new Error(
            'Đã vượt quá giới hạn sử dụng AI miễn phí (20 requests/ngày). Vui lòng thử lại sau 24 giờ hoặc nâng cấp gói dịch vụ.',
          );
        }
        throw new Error('Quá nhiều yêu cầu, vui lòng thử lại sau vài phút.');
      }
      throw error;
    }
  }

  async scoreResumeByJD(
    resumeText: string,
    jdText: string,
  ): Promise<ScoreResumeByJDResponseDto> {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    try {
      const prompt = `
You are an expert technical recruiter and career coach.

LANGUAGE RULE (VERY IMPORTANT):
- Detect the language of the CV and Job Description.
- The output MUST be written in the SAME language as the input.
- Do NOT translate unless the input is translated.

TASK:
Evaluate how well the candidate's CV matches the given Job Description (JD).

SCORING CRITERIA (TOTAL 100 POINTS):
- Skills & Technologies match: 35 points
- Relevant work experience: 30 points
- Responsibilities & keyword alignment: 15 points
- Education & certifications: 20 points
  * Education background: 10 points
  * Professional certifications (industry credentials, technical certifications, licenses): 10 points

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "score": number,                // 0–100
  "missingSkills": string[],      // skills or technologies missing from CV
  "weakSections": string[],       // sections that are weak or unclear
  "suggestions": string[],        // clear, actionable improvement suggestions
  "matchedRole": string           // most suitable role based on JD (empty if unclear)
}

RULES:
- Do NOT include markdown, comments, or explanations outside JSON.
- Do NOT invent information not present in the CV.
- Base the evaluation ONLY on the provided CV and JD.
- Be professional, constructive, and realistic.

CANDIDATE CV:
"""
${resumeText}
"""

JOB DESCRIPTION:
"""
${jdText}
"""

Now return ONLY the JSON object.
`;
      const result: any = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = result?.response ?? result;
      const rawText =
        typeof response?.text === 'function' ? response.text() : (response?.text ?? '');
      const text = String(rawText || '').trim();

      let parsed: any;
      try {
        // cố gắng cắt ra block JSON đầu tiên nếu model trả kèm text/thẻ ```
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : text;
        parsed = JSON.parse(jsonText);
      } catch (e) {
        ServerLogger.error({
          message: 'Failed to parse AI scoreResumeByJD JSON',
          context: 'AiService.scoreResumeByJD',
          error: { rawText: text, parseError: (e as any)?.message },
        });
        parsed = {
          score: 60,
          missingSkills: [],
          weakSections: [],
          suggestions: ['Không thể phân tích đầy đủ JSON từ AI, vui lòng thử lại.'],
          matchedRole: '',
        };
      }

      const safe: ScoreResumeByJDResponseDto = {
        score: Number(parsed.score ?? 0),
        missingSkills: Array.isArray(parsed.missingSkills)
          ? parsed.missingSkills.map(String)
          : [],
        weakSections: Array.isArray(parsed.weakSections)
          ? parsed.weakSections.map(String)
          : [],
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions.map(String)
          : [],
        matchedRole: parsed.matchedRole ? String(parsed.matchedRole) : undefined,
      };

      return safe;
    } catch (error: any) {
      if (error?.status === 503) {
        throw new Error('AI đang quá tải, vui lòng thử lại sau vài giây.');
      }
      if (error?.status === 429) {
        const errorMessage = error?.message || '';
        if (errorMessage.includes('quota') || errorMessage.includes('Quota exceeded')) {
          throw new Error(
            'Đã vượt quá giới hạn sử dụng AI miễn phí (20 requests/ngày). Vui lòng thử lại sau 24 giờ hoặc nâng cấp gói dịch vụ.',
          );
        }
        throw new Error('Quá nhiều yêu cầu, vui lòng thử lại sau vài phút.');
      }
      throw error;
    }
  }

  async generateCoverLetter(
    resumeText: string,
    jdText: string,
    type: 'normal' | 'friendly',
  ): Promise<CoverLetterResponseDto> {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    try {
      const prompt = `You are an expert recruiter and professional career writer.

LANGUAGE RULE (VERY IMPORTANT):
- Detect the language of the CV and Job Description.
- The output MUST be written in the SAME language as the input.
- Do NOT translate unless the input is translated.

TASK:
Write a professional cover letter based on the candidate's CV and the Job Description (JD).

TONE TYPE:
- "normal": formal, professional, suitable for corporate or traditional companies.
- "friendly": warm, approachable, slightly conversational, suitable for startups or creative teams.

CONTENT RULES:
- Use ONLY information that appears in the CV.
- Align skills, experience, and certifications with the Job Description.
- Highlight relevant certifications and credentials that match the JD requirements.
- Do NOT invent achievements, companies, certifications, or years of experience.
- Keep the letter concise (3–5 short paragraphs).
- Avoid clichés and generic phrases.
- If the CV includes certifications relevant to the role, mention them to strengthen the candidate's profile.

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "type": "${type}",
  "language": "auto",
  "coverLetter": string
}

CV:
"""
${resumeText}
"""

JOB DESCRIPTION:
"""
${jdText}
"""

Now generate the cover letter and return ONLY the JSON object.`;

      const result: any = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = result?.response ?? result;
      const rawText =
        typeof response?.text === 'function' ? response.text() : (response?.text ?? '');
      const text = String(rawText || '').trim();

      let parsed: any;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : text;
        parsed = JSON.parse(jsonText);
      } catch (e) {
        ServerLogger.error({
          message: 'Failed to parse AI coverLetter JSON',
          context: 'AiService.generateCoverLetter',
          error: { rawText: text, parseError: (e as any)?.message },
        });
        parsed = {
          type,
          language: 'auto',
          coverLetter:
            'Không thể tạo thư xin việc từ AI, vui lòng thử lại hoặc soạn thủ công dựa trên CV và JD.',
        };
      }

      const coverLetter = String(parsed.coverLetter || '').trim();
      return {
        type: String(parsed.type || type),
        language: String(parsed.language || 'auto'),
        coverLetter,
      };
    } catch (error: any) {
      if (error?.status === 503) {
        throw new Error('AI đang quá tải, vui lòng thử lại sau vài giây.');
      }
      if (error?.status === 429) {
        const errorMessage = error?.message || '';
        if (errorMessage.includes('quota') || errorMessage.includes('Quota exceeded')) {
          throw new Error(
            'Đã vượt quá giới hạn sử dụng AI miễn phí (20 requests/ngày). Vui lòng thử lại sau 24 giờ hoặc nâng cấp gói dịch vụ.',
          );
        }
        throw new Error('Quá nhiều yêu cầu, vui lòng thử lại sau vài phút.');
      }
      throw error;
    }
  }

  async generateInterviewQuestions(
    resumeText: string,
    jdText: string,
  ): Promise<GenerateInterviewQuestionsResponseDto> {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const prompt = `You are a senior technical interviewer and hiring manager.

Your task is to generate realistic interview questions based on:
- The candidate's CV
- The provided Job Description (JD)

IMPORTANT – LANGUAGE RULE:
- Detect the language of the CV.
- If the CV is written in Vietnamese → respond in Vietnamese.
- If the CV is written in English → respond in English.
- If mixed → respond in the language used MOST in the CV.
- DO NOT translate unless required by this rule.

Generate interview questions that:
- Are highly relevant to the JD
- Are aligned with the candidate's experience level
- Help evaluate both technical and soft skills
- Consider the candidate's certifications and credentials (if mentioned in CV)
- Include questions about certifications when they are relevant to the role

Return the result STRICTLY as a JSON object (NO markdown, NO extra text):
{
  "language": "vi | en",
  "matchedPosition": string,
  "questions": [
    {
      "type": "technical | behavioral | experience | situational | soft-skill",
      "question": string,
      "expectedAnswer": string
    }
  ]
}

Guidelines:
- Generate 8–12 questions
- Prioritize skills mentioned in the JD
- Include at least:
  - 3 technical questions
  - 2 behavioral or soft-skill questions
  - 1 question about certifications/credentials (if the candidate has relevant certifications)
- expectedAnswer should be concise, practical, and explain what interviewers look for
- Tone: professional, realistic, interviewer-style
- If the CV mentions certifications relevant to the JD, include questions about how those certifications were obtained and how they apply to the role

CV:
"""
${resumeText}
"""

JOB_DESCRIPTION:
"""
${jdText}
"""

Now analyze and output ONLY the JSON object described above.
`;

    try {
      const result: any = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = result?.response ?? result;
      const rawText =
        typeof response?.text === 'function' ? response.text() : (response?.text ?? '');
      const text = String(rawText || '').trim();

      let parsed: any;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : text;
        parsed = JSON.parse(jsonText);
      } catch (e) {
        ServerLogger.error({
          message: 'Failed to parse AI interviewQuestions JSON',
          context: 'AiService.generateInterviewQuestions',
          error: { rawText: text, parseError: (e as any)?.message },
        });
        parsed = {
          language: 'vi',
          matchedPosition: '',
          questions: [],
        };
      }

      const questions = Array.isArray(parsed.questions) ? parsed.questions : [];

      const safe: GenerateInterviewQuestionsResponseDto = {
        language: String(parsed.language || 'vi'),
        matchedPosition: parsed.matchedPosition
          ? String(parsed.matchedPosition)
          : undefined,
        questions: questions
          .map((q: any) => ({
            type: String(q.type || 'technical'),
            question: String(q.question || '').trim(),
            expectedAnswer: String(q.expectedAnswer || '').trim(),
          }))
          .filter((q: any) => q.question),
      };

      return safe;
    } catch (error: any) {
      if (error?.status === 503) {
        throw new Error('AI đang quá tải, vui lòng thử lại sau vài giây.');
      }
      if (error?.status === 429) {
        const errorMessage = error?.message || '';
        if (errorMessage.includes('quota') || errorMessage.includes('Quota exceeded')) {
          throw new Error(
            'Đã vượt quá giới hạn sử dụng AI miễn phí (20 requests/ngày). Vui lòng thử lại sau 24 giờ hoặc nâng cấp gói dịch vụ.',
          );
        }
        throw new Error('Quá nhiều yêu cầu, vui lòng thử lại sau vài phút.');
      }
      throw error;
    }
  }

  async scoreInterviewAnswers(
    qaList: QaItemDto[],
  ): Promise<ScoreInterviewAnswersResponseDto> {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const qaText = qaList
      .map(
        (item, index) =>
          `Q${index + 1}: ${item.question}\nA${index + 1}: ${item.answer || ''}`,
      )
      .join('\n\n');

    const prompt = `You are a senior interviewer and career coach.

Your task is to evaluate a candidate’s interview answers.

IMPORTANT – LANGUAGE RULE:
- Detect the language of the user's answers.
- If the answers are written in Vietnamese → respond in Vietnamese.
- If the answers are written in English → respond in English.
- If mixed → respond in the language used MOST in the answers.
- DO NOT translate unless required by this rule.

Evaluation criteria:
- Relevance to the question
- Technical correctness (if applicable)
- Clarity and structure
- Practical examples and reasoning
- Communication quality

Return the result STRICTLY as a JSON object (NO markdown, NO extra text):
{
  "language": "vi | en",
  "averageScore": number,
  "results": [
    {
      "question": string,
      "answer": string,
      "score": number,
      "comment": string,
      "improvementSuggestions": string[]
    }
  ],
  "overallFeedback": string
}

Scoring rules:
- Each question is scored from 0 to 100
- averageScore is the average of all question scores (rounded to the nearest integer)
- Scores must reflect realistic interview standards

Tone & style:
- Professional, constructive, and supportive
- Be honest but encouraging
- Focus on how to improve to score higher in real interviews

QUESTIONS_AND_ANSWERS:
${qaText}

Now analyze and output ONLY the JSON object described above.
`;

    try {
      const result: any = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = result?.response ?? result;
      const rawText =
        typeof response?.text === 'function' ? response.text() : (response?.text ?? '');
      const text = String(rawText || '').trim();

      let parsed: any;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : text;
        parsed = JSON.parse(jsonText);
      } catch (e) {
        ServerLogger.error({
          message: 'Failed to parse AI scoreInterviewAnswers JSON',
          context: 'AiService.scoreInterviewAnswers',
          error: { rawText: text, parseError: (e as any)?.message },
        });
        parsed = {
          language: 'vi',
          averageScore: 60,
          results: qaList.map((item) => ({
            question: item.question,
            answer: item.answer,
            score: 60,
            comment: 'Không thể phân tích đầy đủ, vui lòng thử lại.',
            improvementSuggestions: [],
          })),
          overallFeedback:
            'Không thể phân tích đầy đủ câu trả lời, vui lòng thử lại sau hoặc cải thiện nội dung câu trả lời.',
        };
      }

      const results = Array.isArray(parsed.results) ? parsed.results : [];

      const safe: ScoreInterviewAnswersResponseDto = {
        language: String(parsed.language || 'vi'),
        averageScore: Number(parsed.averageScore ?? 0),
        results: results.map((r: any) => ({
          question: String(r.question || ''),
          answer: String(r.answer || ''),
          score: Number(r.score ?? 0),
          comment: String(r.comment || ''),
          improvementSuggestions: Array.isArray(r.improvementSuggestions)
            ? r.improvementSuggestions.map(String)
            : [],
        })),
        overallFeedback: String(parsed.overallFeedback || ''),
      };

      return safe;
    } catch (error: any) {
      if (error?.status === 503) {
        throw new Error('AI đang quá tải, vui lòng thử lại sau vài giây.');
      }
      if (error?.status === 429) {
        const errorMessage = error?.message || '';
        if (errorMessage.includes('quota') || errorMessage.includes('Quota exceeded')) {
          throw new Error(
            'Đã vượt quá giới hạn sử dụng AI miễn phí (20 requests/ngày). Vui lòng thử lại sau 24 giờ hoặc nâng cấp gói dịch vụ.',
          );
        }
        throw new Error('Quá nhiều yêu cầu, vui lòng thử lại sau vài phút.');
      }
      throw error;
    }
  }

  async tailorResumeByJD(
    resumeText: string,
    jdText: string,
  ): Promise<TailorResumeByJDResponseDto> {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const prompt = `You are a professional resume writer and technical recruiter.

Your task is to create a COMPLETE and COMPETITIVE CV that perfectly matches the given Job Description (JD).
You must build a full CV with ALL essential sections, even if they are missing from the original CV.

IMPORTANT – LANGUAGE RULE:
- Detect the language of the CV.
- If the CV is written in Vietnamese → respond in Vietnamese.
- If the CV is written in English → respond in English.
- If mixed → respond in the language used MOST in the CV.
- DO NOT translate unless required by this rule.

CRITICAL REQUIREMENTS:
- You MUST create a COMPLETE CV with all standard sections: summary, experience, skills, projects, education, certifications
- If a section is MISSING from the original CV, you MUST CREATE it from scratch based on the JD requirements
- If a section exists but is incomplete, you MUST FILL IN the missing parts
- You MUST add all skills, technologies, experiences, and certifications that are relevant to the JD
- If the JD mentions required certifications or credentials, you MUST include a certifications section with relevant certifications
- Create realistic, believable, and professional content that makes the candidate an ideal fit

Editing rules:
- For EXISTING sections: Improve, enhance, and optimize the content
- For MISSING sections: Create complete new sections with relevant content based on JD
- For certifications section: Include industry-standard certifications, technical credentials, and professional licenses that match the JD requirements
- Add specific metrics, numbers, and quantifiable achievements
- Include all keywords, responsibilities, and certifications mentioned in the JD
- Use professional, ATS-friendly language
- Make the CV competitive and attractive to recruiters
- Ensure the CV is complete and ready to use
- If the original CV has certifications, enhance and optimize them; if missing but JD requires them, create relevant certifications section

Return the result STRICTLY as a JSON object (NO markdown, NO extra text):
{
  "language": "vi | en",
  "matchedPosition": string,
  "summary": {
    "original": string,  // empty string "" if section was missing
    "optimized": string   // complete summary, created if missing
  },
  "sections": [
    {
      "section": "summary | experience | skills | projects | education | certifications | achievements | other",
      "title": string,     // e.g. "Professional Summary", "Work Experience", "Technical Skills"
      "original": string,  // original content or "" if section was missing
      "optimized": string, // complete optimized content, created if missing
      "changes": string[], // e.g. ["Created new section", "Added 5 relevant skills", "Enhanced with metrics"]
      "isNew": boolean     // true if this section was created (didn't exist in original)
    }
  ],
  "overallSuggestions": string[]
}

Guidelines:
- Include ALL standard CV sections (summary, experience, skills, projects, education, certifications)
- If original section is empty or missing, set "original" to "" and "isNew" to true
- \`changes\` should explain what was done (e.g. "Created new skills section with 10 relevant technologies", "Added 3 new projects matching JD requirements", "Created certifications section with 5 industry-relevant credentials")
- For certifications section: Format should include certification name, issuing organization, issue date, expiry date (if applicable), and credential ID/URL if available
- Optimized content should be complete and ready to paste into a real CV
- Ensure every section is fully filled with professional content
- Certifications section should list certifications in a clear, professional format matching industry standards

CV:
"""
${resumeText}
"""

JOB_DESCRIPTION:
"""
${jdText}
"""

Now analyze and output ONLY the JSON object described above.
`;

    try {
      const result: any = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = result?.response ?? result;
      const rawText =
        typeof response?.text === 'function' ? response.text() : (response?.text ?? '');
      const text = String(rawText || '').trim();

      let parsed: any;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : text;
        parsed = JSON.parse(jsonText);
      } catch (e) {
        ServerLogger.error({
          message: 'Failed to parse AI tailorResumeByJD JSON',
          context: 'AiService.tailorResumeByJD',
          error: { rawText: text, parseError: (e as any)?.message },
        });
        parsed = {
          language: 'vi',
          matchedPosition: '',
          summary: {
            original: resumeText,
            optimized: resumeText,
          },
          sections: [],
          overallSuggestions: [
            'Không thể phân tích đầy đủ CV/JD, vui lòng thử lại sau hoặc chỉnh sửa thủ công.',
          ],
        };
      }

      const sections = Array.isArray(parsed.sections) ? parsed.sections : [];

      const safe: TailorResumeByJDResponseDto = {
        language: String(parsed.language || 'vi'),
        matchedPosition: parsed.matchedPosition
          ? String(parsed.matchedPosition)
          : undefined,
        summary: {
          original: String(parsed.summary?.original || ''),
          optimized: String(parsed.summary?.optimized || ''),
        },
        sections: sections.map((s: any) => ({
          section: String(s.section || ''),
          title: String(s.title || ''),
          original: String(s.original || ''),
          optimized: String(s.optimized || ''),
          changes: Array.isArray(s.changes) ? s.changes.map(String) : [],
          isNew: Boolean(s.isNew ?? false),
        })),
        overallSuggestions: Array.isArray(parsed.overallSuggestions)
          ? parsed.overallSuggestions.map(String)
          : [],
      };

      return safe;
    } catch (error: any) {
      if (error?.status === 503) {
        throw new Error('AI đang quá tải, vui lòng thử lại sau vài giây.');
      }
      if (error?.status === 429) {
        const errorMessage = error?.message || '';
        if (errorMessage.includes('quota') || errorMessage.includes('Quota exceeded')) {
          throw new Error(
            'Đã vượt quá giới hạn sử dụng AI miễn phí (20 requests/ngày). Vui lòng thử lại sau 24 giờ hoặc nâng cấp gói dịch vụ.',
          );
        }
        throw new Error('Quá nhiều yêu cầu, vui lòng thử lại sau vài phút.');
      }
      throw error;
    }
  }

  private mapJobs(jobs: any[]): SuggestJobsResponseDto['jobs'] {
    const list = Array.isArray(jobs) ? jobs : [];
    return list.map((job: any) => ({
      jobTitle: String(job.jobTitle || ''),
      companyName: job.companyName ? String(job.companyName) : undefined,
      jobUrl: String(job.jobUrl || ''),
      jobDescription: job.jobDescription ? String(job.jobDescription) : undefined,
      location: job.location ? String(job.location) : undefined,
      source: job.source ? String(job.source) : undefined,
    }));
  }

  async getSavedJobSuggestions(resumeId: number): Promise<SuggestJobsResponseDto> {
    const userId = this.getCurrentUserId();

    const resume = await this.databaseService.resume.findFirst({
      where: { id: resumeId, userId, isDeleted: false },
    });

    if (!resume) {
      throw new ServerException(ERROR_RESPONSE.RESOURCE_NOT_FOUND);
    }

    const cache = await this.databaseService.jobSuggestionCache.findFirst({
      where: { resumeId, userId, isDeleted: false },
    });

    if (!cache) {
      throw new ServerException(ERROR_RESPONSE.RESOURCE_NOT_FOUND);
    }

    return {
      cacheId: cache.id,
      resumeId: cache.resumeId,
      language: String(cache.language || 'vi'),
      location: cache.location || undefined,
      cachedAt: cache.updatedAt.toISOString(),
      isFromCache: true,
      jobs: this.mapJobs(cache.jobs as any[]),
    };
  }

  async suggestJobs(
    resumeText: string,
    resumeId: number,
    location?: string,
    forceRefresh?: boolean,
  ): Promise<SuggestJobsResponseDto> {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    try {
      const userId = this.getCurrentUserId();
      const normalizedLocation = location?.trim();

      const resume = await this.databaseService.resume.findFirst({
        where: { id: resumeId, userId, isDeleted: false },
      });

      if (!resume) {
        throw new ServerException(ERROR_RESPONSE.RESOURCE_NOT_FOUND);
      }

      if (!forceRefresh) {
        const cached = await this.databaseService.jobSuggestionCache.findFirst({
          where: { resumeId, userId, isDeleted: false },
        });

        if (cached) {
          return {
            cacheId: cached.id,
            resumeId: cached.resumeId,
            language: String(cached.language || 'vi'),
            location: cached.location || undefined,
            cachedAt: cached.updatedAt.toISOString(),
            isFromCache: true,
            jobs: this.mapJobs(cached.jobs as any[]),
          };
        }
      }

      const prompt = `
You are an expert job search assistant. Your task is to find real, current job openings that match the candidate's CV.

LANGUAGE RULE (VERY IMPORTANT):
- Detect the language of the CV.
- The output MUST be written in the SAME language as the input.
- Do NOT translate unless the input is translated.

TASK:
Based on the candidate's CV, suggest 5-10 real job openings that are currently available online. 
You should search for jobs on popular job boards like:
- LinkedIn (linkedin.com/jobs)
- Indeed (indeed.com)
- VietnamWorks (vietnamworks.com)
- TopCV (topcv.vn)
- ITviec (itviec.com)
- CareerBuilder (careerbuilder.vn)
- Glassdoor (glassdoor.com)
- Monster (monster.com)
- And other relevant job sites

IMPORTANT:
- Provide REAL, ACTUAL job posting URLs that exist on the internet
- The jobs should match the candidate's skills, experience, and career level
- Include jobs from various sources (LinkedIn, Indeed, company websites, etc.)
- If location is specified, prioritize jobs in that location
- Each job must have a valid URL that users can click to apply

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "language": string,              // Language of the CV (e.g., "vi", "en")
  "jobs": [
    {
      "jobTitle": string,           // Job title
      "companyName": string?,       // Company name (optional)
      "jobUrl": string,             // Direct URL to the job posting (REQUIRED)
      "jobDescription": string?,   // Brief description (optional)
      "location": string?,          // Job location (optional)
      "source": string?             // Source platform (e.g., "LinkedIn", "Indeed") (optional)
    }
  ]
}

RULES:
- Do NOT include markdown, comments, or explanations outside JSON.
- Do NOT make up fake URLs - only provide URLs that you know exist or are likely to exist
- If you cannot find real URLs, you can provide search URLs to job boards with relevant search terms
- Focus on jobs that match the candidate's profile
- Prioritize quality over quantity

CANDIDATE CV:
"""
${resumeText}
"""

${location ? `PREFERRED LOCATION: ${location}` : ''}

Now return ONLY the JSON object with real job suggestions.
`;

      const result: any = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = result?.response ?? result;
      const rawText =
        typeof response?.text === 'function'
          ? response.text()
          : response?.text ?? '';
      const text = String(rawText || '').trim();

      let parsed: any;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : text;
        parsed = JSON.parse(jsonText);
      } catch (e) {
        ServerLogger.error({
          message: 'Failed to parse AI suggestJobs JSON',
          context: 'AiService.suggestJobs',
          error: { rawText: text, parseError: (e as any)?.message },
        });
        parsed = {
          language: 'vi',
          jobs: [],
        };
      }

      const jobs = Array.isArray(parsed.jobs) ? parsed.jobs : [];

      const safe: SuggestJobsResponseDto = {
        cacheId: 0,
        resumeId,
        language: String(parsed.language || 'vi'),
        location: normalizedLocation || undefined,
        jobs: this.mapJobs(jobs),
      };

      const stored = await this.databaseService.jobSuggestionCache.upsert({
        where: { resumeId },
        update: {
          userId,
          language: safe.language,
          location: normalizedLocation || null,
          jobs: safe.jobs,
          isDeleted: false,
        },
        create: {
          resumeId,
          userId,
          language: safe.language,
          location: normalizedLocation || null,
          jobs: safe.jobs,
        },
      });

      return {
        ...safe,
        cacheId: stored.id,
        cachedAt: stored.updatedAt.toISOString(),
        isFromCache: false,
      };
    } catch (error: any) {
      if (error?.status === 503) {
        throw new Error('AI đang quá tải, vui lòng thử lại sau vài giây.');
      }
      if (error?.status === 429) {
        const errorMessage = error?.message || '';
        if (errorMessage.includes('quota') || errorMessage.includes('Quota exceeded')) {
          throw new Error(
            'Đã vượt quá giới hạn sử dụng AI miễn phí (20 requests/ngày). Vui lòng thử lại sau 24 giờ hoặc nâng cấp gói dịch vụ.',
          );
        }
        throw new Error('Quá nhiều yêu cầu, vui lòng thử lại sau vài phút.');
      }
      throw error;
    }
  }
}

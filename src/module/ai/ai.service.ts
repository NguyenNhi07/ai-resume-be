import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ServerConfig } from '@server/config';
import { ServerLogger } from '@server/logger';
import {
  OptimizeTextResponseDto,
  ScoreResumeByJDResponseDto,
  CoverLetterResponseDto,
} from './dtos';

@Injectable()
export class AiService {
  private readonly ai?: GoogleGenAI;

  constructor() {
    const apiKey = ServerConfig.get().GEMINI_API_KEY;
    if (!apiKey) {
      ServerLogger.warn({
        message: 'GEMINI_API_KEY is not set. AI features will not work.',
        context: 'AiService.constructor',
      });
      return;
    }

    // SDK mới, dùng endpoint v1
    this.ai = new GoogleGenAI({ apiKey });
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
- Do NOT add new information

Guidelines:
- Use professional and formal language
- Be concise and clear
- Highlight achievements and skills
- Use strong action verbs
- Keep original meaning and key details
- Ensure correct grammar and structure

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
        typeof response?.text === 'function'
          ? response.text()
          : response?.text ?? '';
      const optimizedText = String(rawText || '').trim();

      return { optimizedText };
    } catch (error: any) {
      if (error?.status === 503) {
        throw new Error('AI đang quá tải, vui lòng thử lại sau vài giây.');
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
- Skills & Technologies match: 40 points
- Relevant work experience: 35 points
- Responsibilities & keyword alignment: 15 points
- Education & certifications: 10 points

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
        typeof response?.text === 'function'
          ? response.text()
          : response?.text ?? '';
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
- Align skills and experience with the Job Description.
- Do NOT invent achievements, companies, or years of experience.
- Keep the letter concise (3–5 short paragraphs).
- Avoid clichés and generic phrases.

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
      throw error;
    }
  }
}
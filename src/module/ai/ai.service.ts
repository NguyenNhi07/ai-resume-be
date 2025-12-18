import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ServerConfig } from '@server/config';
import { ServerLogger } from '@server/logger';
import {
  OptimizeTextResponseDto,
  ScoreResumeByJDResponseDto,
  CoverLetterResponseDto,
  GenerateInterviewQuestionsResponseDto,
  ScoreInterviewAnswersResponseDto,
  QaItemDto,
  TailorResumeByJDResponseDto,
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
- Are aligned with the candidate’s experience level
- Help evaluate both technical and soft skills

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
- expectedAnswer should be concise, practical, and explain what interviewers look for
- Tone: professional, realistic, interviewer-style

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
        typeof response?.text === 'function' ? response.text() : response?.text ?? '';
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
        matchedPosition: parsed.matchedPosition ? String(parsed.matchedPosition) : undefined,
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
        typeof response?.text === 'function' ? response.text() : response?.text ?? '';
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

Your task is to revise and improve a candidate's CV so that it matches the given Job Description (JD) as closely as possible,
while remaining truthful and consistent with the original CV.

IMPORTANT – LANGUAGE RULE:
- Detect the language of the CV.
- If the CV is written in Vietnamese → respond in Vietnamese.
- If the CV is written in English → respond in English.
- If mixed → respond in the language used MOST in the CV.
- DO NOT translate unless required by this rule.

Editing rules:
- DO NOT invent skills, experience, or companies that are not implied by the original CV
- You MAY rephrase, reorganize, and highlight relevant content
- Prioritize keywords and responsibilities mentioned in the JD
- Use professional, ATS-friendly language
- Keep the content concise and impactful

Return the result STRICTLY as a JSON object (NO markdown, NO extra text):
{
  "language": "vi | en",
  "matchedPosition": string,
  "summary": {
    "original": string,
    "optimized": string
  },
  "sections": [
    {
      "section": "summary | experience | skills | projects | education | other",
      "title": string,
      "original": string,
      "optimized": string,
      "changes": string[]
    }
  ],
  "overallSuggestions": string[]
}

Guidelines:
- Only include sections that exist in the original CV
- \`changes\` should briefly explain what was improved (e.g. "Added keywords from JD", "Clarified impact", "Improved action verbs")
- Optimized content should be ready to paste into a real CV

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
        typeof response?.text === 'function' ? response.text() : response?.text ?? '';
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
      throw error;
    }
  }
}
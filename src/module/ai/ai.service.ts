import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ServerConfig } from '@server/config';
import { ServerLogger } from '@server/logger';
import { OptimizeTextResponseDto } from './dtos';

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
}
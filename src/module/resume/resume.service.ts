import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ERROR_RESPONSE } from 'src/common/const';
import { parseOrderByFromQuery } from 'src/common/helpers/database';
import { validatePaginationQueryDto } from 'src/common/helpers/request';
import { PaginationResponseDto } from '@server/platform/dtos';
import { ServerException } from 'src/exception';
import { DatabaseService } from 'src/module/base/database';
import PDFDocument from 'pdfkit';
import {
  CreateResumeBodyDto,
  CreateResumeResponseDto,
  GetResumeDetailResponseDto,
  GetResumeListQueryDto,
  GetResumeListResponseDto,
  UpdateResumeBodyDto,
  UpdateResumeResponseDto,
} from './dtos';

@Injectable()
export class ResumeService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createResume(userId: number, body: CreateResumeBodyDto): Promise<CreateResumeResponseDto> {
    const { website, ...rest } = body as any;
    return this.databaseService.resume.create({
      data: {
        ...rest,
        ...(website ? { website: Array.isArray(website) ? website : [website] } : {}),
        userId,
      },
    });
  };

  async getResumeList(query: GetResumeListQueryDto): Promise<PaginationResponseDto<GetResumeListResponseDto>> {
    const { page, pageSize, take, skip } = validatePaginationQueryDto(query);
    
    const where: Prisma.ResumeWhereInput = {
      // ...(query.id && { id: query.id }),
      // ...(query.userId && { userId: query.userId }),
      // ...(query.avatar && { avatar: query.avatar }),
      // ...(query.name && { name: query.name }),
      // ...(query.dateOfBirth && { dateOfBirth: query.dateOfBirth }),
      // ...(query.gender && { gender: query.gender }),
      // ...(query.email && { email: query.email }),
      // ...(query.phoneNumber && { phoneNumber: query.phoneNumber }),
      // ...(query.address && { address: query.address }),
      // ...(query.profession && { profession: query.profession }),
      // ...(query.language && { language: query.language }),
      // // ...(query.website && { website: query.website }),
      // ...(query.professional && { professional: query.professional }),
      // ...(query.summary && { summary: query.summary }),
      // // ...(query.skills && { skills: query.skills }),
      // // ...(query.experiences && { experiences: query.experiences }),
      // // ...(query.educations && { educations: query.educations }),
      // // ...(query.projects && { projects: query.projects }),
      // ...(query.isPublic && { isPublic: query.isPublic }),
    };
    if (query.createdAtRangeStart || query.createdAtRangeEnd) {
      where.createdAt = {
        gte: query.createdAtRangeStart,
        lte: query.createdAtRangeEnd,
      };
    };

    const [data, total] = await Promise.all([
      this.databaseService.resume.findMany({
        where,
        take,
        skip,
        orderBy: parseOrderByFromQuery(query.orderBy),
        ...(query.lastItemId && { cursor: { id: query.lastItemId } }),
      }),
      this.databaseService.resume.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    return { data, pagination: { page, pageSize, total, totalPages } };
  }

  async getResumeDetail(id: number): Promise<GetResumeDetailResponseDto> {
    const resume = await this.databaseService.resume.findFirst({ where: { id } });
    if (!resume) {
      throw new ServerException(ERROR_RESPONSE.RESOURCE_NOT_FOUND);
    }
    return resume;
  }

  async updateResume(id: number, body: UpdateResumeBodyDto): Promise<UpdateResumeResponseDto> {
    const resume = await this.databaseService.resume.findFirst({ where: { id } });
    if (!resume) {
      throw new ServerException(ERROR_RESPONSE.RESOURCE_NOT_FOUND);
    }
    const { website, ...rest } = body as any;
    return this.databaseService.resume.update({
      where: { id },
      data: {
        ...rest,
        ...(website !== undefined
          ? { website: Array.isArray(website) ? website : [website] }
          : {}),
      },
    });
  }

  async deleteResume(id: number) {
    const resume = await this.databaseService.resume.findFirst({ where: { id } });
    if (!resume) {
      throw new ServerException(ERROR_RESPONSE.RESOURCE_NOT_FOUND);
    }
    return this.databaseService.resume.delete({ where: { id } });
  }

  async exportResumePdf(id: number): Promise<Buffer> {
    const resume = await this.databaseService.resume.findFirst({ where: { id } });
    if (!resume) {
      throw new ServerException(ERROR_RESPONSE.RESOURCE_NOT_FOUND);
    }

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#4F46E5';
      const textGray = '#374151';

      // Header: Name & Title
      doc
        .fontSize(22)
        .fillColor(primaryColor)
        .text(resume.name || 'Unnamed Candidate', { align: 'left' });

      if (resume.profession) {
        doc
          .moveDown(0.2)
          .fontSize(12)
          .fillColor(textGray)
          .text(resume.profession, { align: 'left' });
      }

      // Contact line
      const contactParts: string[] = [];
      if (resume.email) contactParts.push(resume.email);
      if (resume.phoneNumber) contactParts.push(resume.phoneNumber);
      if (resume.address) contactParts.push(resume.address);
      if (resume.website && resume.website.length > 0)
        contactParts.push(resume.website.join(' | '));

      if (contactParts.length) {
        doc
          .moveDown(0.4)
          .fontSize(10)
          .fillColor('#6B7280')
          .text(contactParts.join(' • '), { align: 'left' });
      }

      doc.moveDown(0.8);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E5E7EB').stroke();
      doc.moveDown(0.6);

      const drawSectionTitle = (title: string) => {
        doc
          .fontSize(12)
          .fillColor(primaryColor)
          .text(title.toUpperCase(), { align: 'left' });
        doc.moveDown(0.2);
        doc
          .moveTo(50, doc.y)
          .lineTo(150, doc.y)
          .strokeColor(primaryColor)
          .stroke();
        doc.moveDown(0.4);
        doc.fillColor(textGray).fontSize(10);
      };

      // Summary
      const summary = resume.summary || resume.professional;
      if (summary) {
        drawSectionTitle('Professional Summary');
        doc.text(summary, { align: 'left' });
        doc.moveDown(0.8);
      }

      // Skills
      if (resume.skills && resume.skills.length) {
        drawSectionTitle('Skills');
        doc.text(resume.skills.join(' • '), { align: 'left' });
        doc.moveDown(0.8);
      }

      // Experiences
      const experiences = (resume.experiences as any[]) || [];
      if (experiences.length) {
        drawSectionTitle('Experience');
        experiences.forEach((exp) => {
          const line1Parts: string[] = [];
          if (exp.jobTitle) line1Parts.push(exp.jobTitle);
          if (exp.companyName) line1Parts.push(exp.companyName);
          doc.fontSize(10).fillColor(textGray).text(line1Parts.join(' — '), {
            align: 'left',
          });

          if (exp.startDate || exp.endDate) {
            const dateStr = `${exp.startDate || ''}${
              exp.endDate ? ` - ${exp.endDate}` : ''
            }`;
            doc
              .fontSize(9)
              .fillColor('#6B7280')
              .text(dateStr, { align: 'left' });
          }

          if (exp.jobDescription) {
            doc.moveDown(0.1);
            doc
              .fontSize(9)
              .fillColor('#4B5563')
              .text(`• ${exp.jobDescription}`, {
                width: 500,
                align: 'left',
              });
          }

          doc.moveDown(0.6);
        });
      }

      // Education
      const educations = (resume.educations as any[]) || [];
      if (educations.length) {
        drawSectionTitle('Education');
        educations.forEach((edu) => {
          const line1Parts: string[] = [];
          if (edu.degree) line1Parts.push(edu.degree);
          if (edu.institutionName) line1Parts.push(edu.institutionName);
          doc.fontSize(10).fillColor(textGray).text(line1Parts.join(' — '), {
            align: 'left',
          });

          if (edu.graduationDate) {
            doc
              .fontSize(9)
              .fillColor('#6B7280')
              .text(String(edu.graduationDate), { align: 'left' });
          }

          doc.moveDown(0.6);
        });
      }

      // Projects
      const projects = (resume.projects as any[]) || [];
      if (projects.length) {
        drawSectionTitle('Projects');
        projects.forEach((proj) => {
          if (proj.projectName) {
            doc.fontSize(10).fillColor(textGray).text(proj.projectName, {
              align: 'left',
            });
          }
          if (proj.description) {
            doc
              .fontSize(9)
              .fillColor('#4B5563')
              .text(`• ${proj.description}`, {
                width: 500,
                align: 'left',
              });
          }
          if (proj.technologies && proj.technologies.length) {
            doc
              .fontSize(9)
              .fillColor('#6B7280')
              .text(`Tech: ${proj.technologies.join(', ')}`, {
                align: 'left',
              });
          }
          doc.moveDown(0.6);
        });
      }

      doc.end();
    });
  }
}

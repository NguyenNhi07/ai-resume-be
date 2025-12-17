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
    const { website, template, accentColor, fontFamily, ...rest } = body as any;
    const created = await this.databaseService.resume.create({
      data: {
        ...rest,
        ...(website ? { website: Array.isArray(website) ? website : [website] } : {}),
        template: template || 'classic',
        accentColor: accentColor || '#3B82F6',
        fontFamily: fontFamily || 'inter',
        userId,
      },
    });
    return {
      ...created,
      template: (created as any).template || 'classic',
      accentColor: (created as any).accentColor || '#3B82F6',
      fontFamily: (created as any).fontFamily || 'inter',
    } as CreateResumeResponseDto;
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
    return { 
      data: data.map((item: any) => ({
        ...item,
        template: item.template || 'classic',
        accentColor: item.accentColor || '#3B82F6',
        fontFamily: item.fontFamily || 'inter',
      })),
      pagination: { page, pageSize, total, totalPages } 
    };
  }

  async getResumeDetail(id: number): Promise<GetResumeDetailResponseDto> {
    const resume = await this.databaseService.resume.findFirst({ where: { id } });
    if (!resume) {
      throw new ServerException(ERROR_RESPONSE.RESOURCE_NOT_FOUND);
    }
    return {
      ...resume,
      template: (resume as any).template || 'classic',
      accentColor: (resume as any).accentColor || '#3B82F6',
      fontFamily: (resume as any).fontFamily || 'inter',
    } as GetResumeDetailResponseDto;
  }

  async getPublicResume(id: number): Promise<GetResumeDetailResponseDto> {
    const resume = await this.databaseService.resume.findFirst({
      where: { id, isPublic: true, isDeleted: false },
    });
    if (!resume) {
      throw new ServerException(ERROR_RESPONSE.RESOURCE_NOT_FOUND);
    }
    return {
      ...resume,
      template: (resume as any).template || 'classic',
      accentColor: (resume as any).accentColor || '#3B82F6',
      fontFamily: (resume as any).fontFamily || 'inter',
    } as GetResumeDetailResponseDto;
  }

  async updateResume(id: number, body: UpdateResumeBodyDto): Promise<UpdateResumeResponseDto> {
    const resume = await this.databaseService.resume.findFirst({ where: { id } });
    if (!resume) {
      throw new ServerException(ERROR_RESPONSE.RESOURCE_NOT_FOUND);
    }
    const { website, template, accentColor, fontFamily, ...rest } = body as any;
    const updated = await this.databaseService.resume.update({
      where: { id },
      data: {
        ...rest,
        ...(website !== undefined
          ? { website: Array.isArray(website) ? website : [website] }
          : {}),
        ...(template !== undefined ? { template } : {}),
        ...(accentColor !== undefined ? { accentColor } : {}),
        ...(fontFamily !== undefined ? { fontFamily } : {}),
      },
    });
    return {
      ...updated,
      template: (updated as any).template || 'classic',
      accentColor: (updated as any).accentColor || '#3B82F6',
      fontFamily: (updated as any).fontFamily || 'inter',
    } as UpdateResumeResponseDto;
  }

  async setResumeVisibility(id: number, isPublic: boolean): Promise<UpdateResumeResponseDto> {
    const resume = await this.databaseService.resume.findFirst({ where: { id } });
    if (!resume) {
      throw new ServerException(ERROR_RESPONSE.RESOURCE_NOT_FOUND);
    }
    const updated = await this.databaseService.resume.update({
      where: { id },
      data: { isPublic },
    });
    return {
      ...updated,
      template: (updated as any).template || 'classic',
      accentColor: (updated as any).accentColor || '#3B82F6',
      fontFamily: (updated as any).fontFamily || 'inter',
    } as UpdateResumeResponseDto;
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

      // Get template, accent color and font from resume
      const template = (resume as any).template || 'classic';
      const accentColor = (resume as any).accentColor || '#3B82F6';
      const fontFamilyKey = (resume as any).fontFamily || 'inter';
      const textGray = '#374151';
      const textLightGray = '#6B7280';
      const borderGray = '#E5E7EB';

      // Map frontend font keys to PDF base fonts
      const resolvePdfFont = (key: string): string => {
        const normalized = (key || '').toLowerCase();
        if (['times', 'georgia', 'garamond', 'cambria'].includes(normalized)) {
          return 'Times-Roman';
        }
        if (['arial', 'inter', 'roboto', 'poppins', 'mulish', 'helvetica', 'calibri', 'nunito', 'montserrat'].includes(normalized)) {
          return 'Helvetica';
        }
        return 'Helvetica';
      };

      const baseFont = resolvePdfFont(fontFamilyKey);
      doc.font(baseFont);

      // Helper to format date (MM/YYYY -> MMM YYYY)
      const formatDate = (dateStr: string): string => {
        if (!dateStr) return '';
        // Try MM/YYYY format first
        const parts = dateStr.split('/');
        if (parts.length === 2) {
          const month = parseInt(parts[0], 10);
          const year = parts[1];
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          if (month >= 1 && month <= 12) {
            return `${monthNames[month - 1]} ${year}`;
          }
        }
        return dateStr;
      };

      // Render PDF based on template
      // Currently supports: classic, modern, minimal, minimal-image, bold, professional
      // Default to classic if template not recognized
      const renderTemplate = () => {
        switch (template) {
          case 'modern':
            return this.renderModernTemplate(doc, resume, accentColor, formatDate);
          case 'minimal':
          case 'minimal-image':
            return this.renderMinimalTemplate(doc, resume, accentColor, formatDate);
          case 'bold':
            return this.renderBoldTemplate(doc, resume, accentColor, formatDate);
          case 'professional':
            return this.renderProfessionalTemplate(doc, resume, accentColor, formatDate);
          case 'classic':
          default:
            return this.renderClassicTemplate(doc, resume, accentColor, formatDate);
        }
      };

      renderTemplate();
      doc.end();
    });
  }

  // Classic Template (default) - Centered header with border-bottom, left border sections
  private renderClassicTemplate(
    doc: PDFKit.PDFDocument,
    resume: any,
    accentColor: string,
    formatDate: (dateStr: string) => string,
  ): void {
    const textGray = '#374151';
    const textLightGray = '#6B7280';

    // Header Section - Centered with border-bottom (matching ClassicTemplate)
      const headerY = doc.y;
      doc.fontSize(24).fillColor('#111827').text(resume.name || 'Unnamed Candidate', {
        align: 'center',
      });

      if (resume.profession) {
        doc
          .moveDown(0.3)
          .fontSize(14)
          .fillColor(textGray)
          .text(resume.profession, { align: 'center' });
      }

      // Contact info - centered
      const contactParts: string[] = [];
      if (resume.email) contactParts.push(resume.email);
      if (resume.phoneNumber) contactParts.push(resume.phoneNumber);
      if (resume.address) contactParts.push(resume.address);
      if (resume.website && resume.website.length > 0) {
        const websiteStr = Array.isArray(resume.website) ? resume.website[0] : resume.website;
        if (websiteStr) contactParts.push(websiteStr);
      }

      if (contactParts.length) {
        doc
          .moveDown(0.5)
          .fontSize(10)
          .fillColor(textLightGray)
          .text(contactParts.join(' • '), { align: 'center' });
      }

      // Border line below header (matching ClassicTemplate border-b-2)
      doc.moveDown(0.8);
      const borderY = doc.y;
      doc
        .moveTo(50, borderY)
        .lineTo(545, borderY)
        .lineWidth(2)
        .strokeColor(accentColor)
        .stroke();
      doc.moveDown(0.8);

      // Section title helper (matching ClassicTemplate style)
      const drawSectionTitle = (title: string) => {
        doc
          .fontSize(16)
          .fillColor(accentColor)
          .text(title, { align: 'left' });
        doc.moveDown(0.4);
        doc.fillColor(textGray).fontSize(11);
      };

      // Professional Summary
      const summary = resume.summary || resume.professional;
      if (summary) {
        drawSectionTitle('Professional Summary');
        doc.text(summary, { align: 'left', lineGap: 2 });
        doc.moveDown(0.8);
      }

      // Experience Section (matching ClassicTemplate with border-l-4)
      const experiences = (resume.experiences as any[]) || [];
      if (experiences.length) {
        drawSectionTitle('Professional Experience');
        doc.moveDown(0.2);
        experiences.forEach((exp) => {
          const startY = doc.y;
          
          // Left border (matching border-l-4)
          doc
            .moveTo(50, startY)
            .lineTo(50, startY + 40)
            .lineWidth(4)
            .strokeColor(accentColor)
            .stroke();

          // Content with left padding
          doc.x = 62; // 50 + 12 (padding)

          // Position and Company
          const position = exp.position || exp.jobTitle || '';
          const company = exp.company || exp.companyName || '';
          if (position || company) {
            doc
              .fontSize(12)
              .fillColor('#111827')
              .font('Helvetica-Bold')
              .text(position || company, { continued: position && company ? true : false });
            if (position && company) {
              doc.font('Helvetica').text(` — ${company}`);
            }
            doc.moveDown(0.2);
          }

          // Date range (right aligned)
          const startDate = exp.start_date || exp.startDate || '';
          const endDate = exp.end_date || exp.endDate || '';
          if (startDate || endDate) {
            const dateStr = `${formatDate(startDate)}${endDate ? ` - ${formatDate(endDate)}` : ''}`;
            doc
              .fontSize(10)
              .fillColor(textLightGray)
              .text(dateStr, { align: 'right', width: 450 });
            doc.moveDown(0.2);
          }

          // Description
          if (exp.description || exp.jobDescription) {
            doc
              .fontSize(10)
              .fillColor(textGray)
              .font('Helvetica')
              .text(exp.description || exp.jobDescription || '', {
                width: 450,
                lineGap: 2,
              });
          }

          doc.x = 50; // Reset x position
          doc.moveDown(0.6);
        });
      }

      // Education Section (matching ClassicTemplate with border-l-4)
      const educations = (resume.educations as any[]) || [];
      if (educations.length) {
        drawSectionTitle('Education');
        doc.moveDown(0.2);
        educations.forEach((edu) => {
          const startY = doc.y;

          // Left border
          doc
            .moveTo(50, startY)
            .lineTo(50, startY + 35)
            .lineWidth(4)
            .strokeColor(accentColor)
            .stroke();

          doc.x = 62;

          // Degree
          const degree = edu.degree || '';
          if (degree) {
            doc
              .fontSize(12)
              .fillColor('#111827')
              .font('Helvetica-Bold')
              .text(degree);
            doc.moveDown(0.2);
          }

          // Institution
          const institution = edu.institution || edu.institutionName || '';
          const field = edu.field || edu.fieldOfStudy || '';
          if (institution) {
            doc
              .fontSize(11)
              .fillColor(textGray)
              .font('Helvetica')
              .text(institution + (field ? ` - ${field}` : ''));
            doc.moveDown(0.2);
          }

          // GPA and Graduation Date
          const gpa = edu.gpa || '';
          const gradDate = edu.graduation_date || edu.graduationDate || '';
          if (gpa || gradDate) {
            doc.fontSize(10).fillColor(textLightGray);
            if (gpa) {
              doc.text(`GPA: ${gpa}`, { continued: !!gradDate });
            }
            if (gradDate) {
              doc.text(gpa ? ` • ${formatDate(String(gradDate))}` : formatDate(String(gradDate)), {
                align: 'right',
                width: 450,
              });
            }
          }

          doc.x = 50;
          doc.moveDown(0.6);
        });
      }

      // Projects Section (matching ClassicTemplate with border-l-4)
      const projects = (resume.projects as any[]) || [];
      if (projects.length) {
        drawSectionTitle('Projects');
        doc.moveDown(0.2);
        projects.forEach((proj) => {
          const startY = doc.y;

          // Left border
          doc
            .moveTo(50, startY)
            .lineTo(50, startY + 40)
            .lineWidth(4)
            .strokeColor(accentColor)
            .stroke();

          doc.x = 62;

          // Project name
          const name = proj.name || proj.projectName || '';
          if (name) {
            doc
              .fontSize(12)
              .fillColor('#111827')
              .font('Helvetica-Bold')
              .text(name);
            doc.moveDown(0.2);
          }

          // Description
          if (proj.description) {
            doc
              .fontSize(10)
              .fillColor(textGray)
              .font('Helvetica')
              .text(proj.description, { width: 450, lineGap: 2 });
            doc.moveDown(0.2);
          }

          // Technologies as tags (matching ClassicTemplate style)
          const technologies = proj.technologies || [];
          if (Array.isArray(technologies) && technologies.length > 0) {
            const techText = technologies.filter(Boolean).join(' • ');
            doc
              .fontSize(9)
              .fillColor(accentColor)
              .text(techText, { width: 450 });
          }

          doc.x = 50;
          doc.moveDown(0.6);
        });
      }

      // Skills Section (matching ClassicTemplate with tags)
      if (resume.skills && Array.isArray(resume.skills) && resume.skills.length > 0) {
        drawSectionTitle('Skills');
        doc.moveDown(0.2);
        // Display skills as comma-separated with accent color (matching tag style)
        const skillsText = resume.skills.filter(Boolean).join(' • ');
        doc
          .fontSize(10)
          .fillColor(textGray)
          .text(skillsText, { width: 495, lineGap: 2 });
        doc.moveDown(0.8);
      }
  }

  // Modern Template - Gradient header, two-column layout
  private renderModernTemplate(
    doc: PDFKit.PDFDocument,
    resume: any,
    accentColor: string,
    formatDate: (dateStr: string) => string,
  ): void {
    const textGray = '#374151';
    const textLightGray = '#6B7280';
    const white = '#FFFFFF';

    // Helper to convert hex to RGB
    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16),
          ]
        : [59, 130, 246]; // Default blue
    };

    const [r, g, b] = hexToRgb(accentColor);

    // Gradient Header Background (simulate with solid color + rectangle)
    const headerHeight = 120;
    doc
      .rect(0, 0, 595, headerHeight)
      .fillColor(`rgb(${r}, ${g}, ${b})`)
      .fill();

    // Header Content - White text on gradient background
    doc.y = 30;
    doc.x = 50;
    doc.fontSize(28).fillColor(white).font('Helvetica-Bold');
    doc.text(resume.name || 'Unnamed Candidate', { width: 495 });

    if (resume.profession) {
      doc
        .moveDown(0.3)
        .fontSize(14)
        .fillColor(white)
        .font('Helvetica')
        .opacity(0.9)
        .text(resume.profession, { width: 495 });
    }

    // Contact info in header
    const contactParts: string[] = [];
    if (resume.email) contactParts.push(resume.email);
    if (resume.phoneNumber) contactParts.push(resume.phoneNumber);
    if (resume.address) contactParts.push(resume.address);
    if (resume.website && resume.website.length > 0) {
      const websiteStr = Array.isArray(resume.website) ? resume.website[0] : resume.website;
      if (websiteStr) contactParts.push(websiteStr);
    }

    if (contactParts.length) {
      doc
        .moveDown(0.5)
        .fontSize(9)
        .fillColor(white)
        .opacity(0.9)
        .text(contactParts.join(' • '), { width: 495 });
    }

    // Main content area
    doc.y = headerHeight + 30;
    doc.x = 50;
    doc.opacity(1);

    // Two-column layout: Left (60%) and Right (35%)
    const leftColumnX = 50;
    const rightColumnX = 350;
    const leftColumnWidth = 280;
    const rightColumnWidth = 195;

    // Section title helper with vertical bar
    const drawSectionTitle = (title: string, x: number, width: number) => {
      const startY = doc.y;
      // Vertical bar (accent color)
      doc
        .rect(x, startY, 3, 20)
        .fillColor(accentColor)
        .fill();
      
      doc.x = x + 10;
      doc
        .fontSize(14)
        .fillColor('#111827')
        .font('Helvetica-Bold')
        .text(title, { width: width - 10 });
      doc.moveDown(0.4);
      doc.fillColor(textGray).fontSize(10).font('Helvetica');
    };

    // Left Column Content
    let leftY = doc.y;

    // Professional Summary (About Me)
    const summary = resume.summary || resume.professional;
    if (summary) {
      doc.x = leftColumnX;
      doc.y = leftY;
      drawSectionTitle('About Me', leftColumnX, leftColumnWidth);
      doc
        .fontSize(10)
        .fillColor(textGray)
        .text(summary, { width: leftColumnWidth, lineGap: 2 });
      doc.moveDown(0.8);
      leftY = doc.y;
    }

    // Experience
    const experiences = (resume.experiences as any[]) || [];
    if (experiences.length) {
      doc.x = leftColumnX;
      doc.y = leftY;
      drawSectionTitle('Experience', leftColumnX, leftColumnWidth);
      doc.moveDown(0.2);
      experiences.forEach((exp) => {
        const startY = doc.y;
        doc.x = leftColumnX + 10;

        // Position and Company
        const position = exp.position || exp.jobTitle || '';
        const company = exp.company || exp.companyName || '';
        if (position || company) {
          doc
            .fontSize(11)
            .fillColor('#111827')
            .font('Helvetica-Bold')
            .text(position || company, { width: leftColumnWidth - 10 });
          if (position && company) {
            doc
              .fontSize(10)
              .fillColor(accentColor)
              .font('Helvetica')
              .text(company, { width: leftColumnWidth - 10 });
          }
          doc.moveDown(0.2);
        }

        // Date range
        const startDate = exp.start_date || exp.startDate || '';
        const endDate = exp.end_date || exp.endDate || '';
        if (startDate || endDate) {
          const dateStr = `${formatDate(startDate)}${endDate ? ` - ${formatDate(endDate)}` : ''}`;
          doc
            .fontSize(9)
            .fillColor(textLightGray)
            .text(dateStr, { width: leftColumnWidth - 10 });
          doc.moveDown(0.2);
        }

        // Description
        if (exp.description || exp.jobDescription) {
          doc
            .fontSize(9)
            .fillColor(textGray)
            .font('Helvetica')
            .text(exp.description || exp.jobDescription || '', {
              width: leftColumnWidth - 10,
              lineGap: 2,
            });
        }

        doc.moveDown(0.6);
      });
      leftY = doc.y;
    }

    // Projects
    const projects = (resume.projects as any[]) || [];
    if (projects.length) {
      doc.x = leftColumnX;
      doc.y = leftY;
      drawSectionTitle('Projects', leftColumnX, leftColumnWidth);
      doc.moveDown(0.2);
      projects.forEach((proj) => {
        doc.x = leftColumnX + 10;

        const name = proj.name || proj.projectName || '';
        if (name) {
          doc
            .fontSize(11)
            .fillColor('#111827')
            .font('Helvetica-Bold')
            .text(name, { width: leftColumnWidth - 10 });
          doc.moveDown(0.2);
        }

        if (proj.description) {
          doc
            .fontSize(9)
            .fillColor(textGray)
            .font('Helvetica')
            .text(proj.description, { width: leftColumnWidth - 10, lineGap: 2 });
          doc.moveDown(0.2);
        }

        const technologies = proj.technologies || [];
        if (Array.isArray(technologies) && technologies.length > 0) {
          const techText = technologies.filter(Boolean).join(' • ');
          doc
            .fontSize(8)
            .fillColor(accentColor)
            .text(techText, { width: leftColumnWidth - 10 });
        }

        doc.moveDown(0.6);
      });
    }

    // Right Column Content
    let rightY = headerHeight + 30;
    if (summary) {
      rightY += 60; // Adjust based on summary height
    }

    // Education
    const educations = (resume.educations as any[]) || [];
    if (educations.length) {
      doc.x = rightColumnX;
      doc.y = rightY;
      drawSectionTitle('Education', rightColumnX, rightColumnWidth);
      doc.moveDown(0.2);
      educations.forEach((edu) => {
        doc.x = rightColumnX + 10;

        const degree = edu.degree || '';
        if (degree) {
          doc
            .fontSize(10)
            .fillColor('#111827')
            .font('Helvetica-Bold')
            .text(degree, { width: rightColumnWidth - 10 });
          doc.moveDown(0.2);
        }

        const institution = edu.institution || edu.institutionName || '';
        const field = edu.field || edu.fieldOfStudy || '';
        if (institution) {
          doc
            .fontSize(9)
            .fillColor(textGray)
            .font('Helvetica')
            .text(institution + (field ? ` - ${field}` : ''), {
              width: rightColumnWidth - 10,
            });
          doc.moveDown(0.2);
        }

        const gpa = edu.gpa || '';
        const gradDate = edu.graduation_date || edu.graduationDate || '';
        if (gpa || gradDate) {
          doc.fontSize(8).fillColor(textLightGray);
          if (gpa) {
            doc.text(`GPA: ${gpa}`, { width: rightColumnWidth - 10 });
          }
          if (gradDate) {
            doc.text(formatDate(String(gradDate)), { width: rightColumnWidth - 10 });
          }
        }

        doc.moveDown(0.6);
        rightY = doc.y;
      });
    }

    // Skills
    if (resume.skills && Array.isArray(resume.skills) && resume.skills.length > 0) {
      doc.x = rightColumnX;
      doc.y = rightY;
      drawSectionTitle('Skills', rightColumnX, rightColumnWidth);
      doc.moveDown(0.2);
      doc.x = rightColumnX + 10;
      resume.skills.forEach((skill: string) => {
        if (skill) {
          doc
            .fontSize(9)
            .fillColor(textGray)
            .font('Helvetica')
            .text(skill, { width: rightColumnWidth - 10 });
          doc.moveDown(0.2);
        }
      });
    }
  }

  // Minimal Template - Clean, simple layout with two-column
  private renderMinimalTemplate(
    doc: PDFKit.PDFDocument,
    resume: any,
    accentColor: string,
    formatDate: (dateStr: string) => string,
  ): void {
    const textGray = '#374151';
    const textLightGray = '#6B7280';

    // Header - Centered with avatar
    doc.fontSize(24).fillColor('#111827').font('Helvetica');
    doc.text(resume.name || 'Unnamed Candidate', { align: 'center' });

    if (resume.profession) {
      doc
        .moveDown(0.3)
        .fontSize(14)
        .fillColor(textGray)
        .font('Helvetica')
        .text(resume.profession, { align: 'center' });
    }

    // Contact info - centered
    const contactParts: string[] = [];
    if (resume.email) contactParts.push(resume.email);
    if (resume.phoneNumber) contactParts.push(resume.phoneNumber);
    if (resume.address) contactParts.push(resume.address);
    if (resume.website && resume.website.length > 0) {
      const websiteStr = Array.isArray(resume.website) ? resume.website[0] : resume.website;
      if (websiteStr) contactParts.push(websiteStr);
    }

    if (contactParts.length) {
      doc
        .moveDown(0.6)
        .fontSize(9)
        .fillColor(textLightGray)
        .text(contactParts.join(' • '), { align: 'center' });
    }

    doc.moveDown(1.2);

    // Professional Summary with horizontal line
    const summary = resume.summary || resume.professional;
    if (summary) {
      // Horizontal accent line
      const lineY = doc.y;
      doc
        .moveTo(50, lineY)
        .lineTo(62, lineY)
        .lineWidth(1)
        .strokeColor(accentColor)
        .stroke();
      
      doc.moveDown(0.4);
      doc
        .fontSize(11)
        .fillColor(textGray)
        .font('Helvetica')
        .text(summary, { width: 495, lineGap: 2 });
      doc.moveDown(1.0);
    }

    // Two-column layout
    const leftColumnX = 50;
    const rightColumnX = 320;
    const leftColumnWidth = 250;
    const rightColumnWidth = 225;

    // Section title helper
    const drawSectionTitle = (title: string, x: number, width: number) => {
      doc.x = x;
      doc
        .fontSize(12)
        .fillColor(accentColor)
        .font('Helvetica-Bold')
        .text(title.toUpperCase(), { width, characterSpacing: 1 });
      doc.moveDown(0.6);
      doc.fillColor(textGray).fontSize(10).font('Helvetica');
    };

    // Left Column
    let leftY = doc.y;

    // Experience
    const experiences = (resume.experiences as any[]) || [];
    if (experiences.length) {
      doc.x = leftColumnX;
      doc.y = leftY;
      drawSectionTitle('Experience', leftColumnX, leftColumnWidth);
      experiences.forEach((exp) => {
        doc.x = leftColumnX;

        const position = exp.position || exp.jobTitle || '';
        const company = exp.company || exp.companyName || '';
        if (position) {
          doc
            .fontSize(10)
            .fillColor('#111827')
            .font('Helvetica-Bold')
            .text(position, { width: leftColumnWidth });
          doc.moveDown(0.2);
        }
        if (company) {
          doc
            .fontSize(9)
            .fillColor(textGray)
            .text(company, { width: leftColumnWidth });
          doc.moveDown(0.2);
        }

        const startDate = exp.start_date || exp.startDate || '';
        const endDate = exp.end_date || exp.endDate || '';
        if (startDate || endDate) {
          const dateStr = `${formatDate(startDate)}${endDate ? ` - ${formatDate(endDate)}` : ''}`;
          doc
            .fontSize(8)
            .fillColor(textLightGray)
            .text(dateStr, { width: leftColumnWidth });
          doc.moveDown(0.2);
        }

        if (exp.description || exp.jobDescription) {
          doc
            .fontSize(9)
            .fillColor(textGray)
            .font('Helvetica')
            .text(exp.description || exp.jobDescription || '', {
              width: leftColumnWidth,
              lineGap: 2,
            });
        }

        doc.moveDown(0.6);
      });
      leftY = doc.y;
    }

    // Education
    const educations = (resume.educations as any[]) || [];
    if (educations.length) {
      doc.x = leftColumnX;
      doc.y = leftY;
      drawSectionTitle('Education', leftColumnX, leftColumnWidth);
      educations.forEach((edu) => {
        doc.x = leftColumnX;

        const degree = edu.degree || '';
        if (degree) {
          doc
            .fontSize(10)
            .fillColor('#111827')
            .font('Helvetica-Bold')
            .text(degree, { width: leftColumnWidth });
          doc.moveDown(0.2);
        }

        const institution = edu.institution || edu.institutionName || '';
        const field = edu.field || edu.fieldOfStudy || '';
        if (institution) {
          doc
            .fontSize(9)
            .fillColor(textGray)
            .text(institution + (field ? ` - ${field}` : ''), {
              width: leftColumnWidth,
            });
          doc.moveDown(0.2);
        }

        const gpa = edu.gpa || '';
        const gradDate = edu.graduation_date || edu.graduationDate || '';
        if (gpa || gradDate) {
          doc.fontSize(8).fillColor(textLightGray);
          if (gpa) {
            doc.text(`GPA: ${gpa}`, { width: leftColumnWidth });
          }
          if (gradDate) {
            doc.text(formatDate(String(gradDate)), { width: leftColumnWidth });
          }
        }

        doc.moveDown(0.6);
      });
    }

    // Right Column
    let rightY = summary ? doc.y - 100 : doc.y; // Adjust based on summary

    // Skills
    if (resume.skills && Array.isArray(resume.skills) && resume.skills.length > 0) {
      doc.x = rightColumnX;
      doc.y = rightY;
      drawSectionTitle('Skills', rightColumnX, rightColumnWidth);
      doc.x = rightColumnX;
      resume.skills.forEach((skill: string) => {
        if (skill) {
          doc
            .fontSize(9)
            .fillColor(textGray)
            .font('Helvetica')
            .text(skill, { width: rightColumnWidth });
          doc.moveDown(0.3);
        }
      });
      rightY = doc.y;
    }

    // Projects
    const projects = (resume.projects as any[]) || [];
    if (projects.length) {
      doc.x = rightColumnX;
      doc.y = rightY;
      drawSectionTitle('Projects', rightColumnX, rightColumnWidth);
      projects.forEach((proj) => {
        doc.x = rightColumnX;

        const name = proj.name || proj.projectName || '';
        if (name) {
          doc
            .fontSize(10)
            .fillColor('#111827')
            .font('Helvetica-Bold')
            .text(name, { width: rightColumnWidth });
          doc.moveDown(0.2);
        }

        if (proj.description) {
          doc
            .fontSize(9)
            .fillColor(textGray)
            .font('Helvetica')
            .text(proj.description, { width: rightColumnWidth, lineGap: 2 });
          doc.moveDown(0.2);
        }

        const technologies = proj.technologies || [];
        if (Array.isArray(technologies) && technologies.length > 0) {
          const techText = technologies.filter(Boolean).join(' • ');
          doc
            .fontSize(8)
            .fillColor(accentColor)
            .text(techText, { width: rightColumnWidth });
        }

        doc.moveDown(0.6);
      });
    }
  }

  // Bold Template - Dark background, bold headers, two-column (2/3 main, 1/3 sidebar)
  private renderBoldTemplate(
    doc: PDFKit.PDFDocument,
    resume: any,
    accentColor: string,
    formatDate: (dateStr: string) => string,
  ): void {
    const darkBg = '#111827'; // gray-900
    const darkText = '#F3F4F6'; // gray-100
    const lightGray = '#9CA3AF'; // gray-400
    const darkerGray = '#6B7280'; // gray-500

    // Dark background for entire page
    doc.rect(0, 0, 595, 842).fillColor(darkBg).fill();

    // Header Section
    doc.y = 40;
    doc.x = 50;
    doc.fillColor(accentColor).fontSize(10).font('Helvetica-Bold');
    doc.text((resume.profession || '').toUpperCase(), { width: 495, characterSpacing: 2 });

    doc.moveDown(0.3);
    doc.fillColor(darkText).fontSize(36).font('Helvetica-Bold');
    doc.text(resume.name || 'Unnamed Candidate', { width: 495 });

    // Contact info box (simulated with background)
    const contactParts: string[] = [];
    if (resume.email) contactParts.push(resume.email);
    if (resume.phoneNumber) contactParts.push(resume.phoneNumber);
    if (resume.address) contactParts.push(resume.address);
    if (resume.website && resume.website.length > 0) {
      const websiteStr = Array.isArray(resume.website) ? resume.website[0] : resume.website;
      if (websiteStr) contactParts.push(websiteStr);
    }

    if (contactParts.length) {
      doc.moveDown(0.5);
      doc.fillColor(lightGray).fontSize(9).font('Helvetica');
      doc.text(contactParts.join(' • '), { width: 495 });
    }

    // Summary
    const summary = resume.summary || resume.professional;
    if (summary) {
      doc.moveDown(0.8);
      doc.fillColor(lightGray).fontSize(11).font('Helvetica');
      doc.text(summary, { width: 495, lineGap: 2 });
    }

    doc.moveDown(1.0);

    // Two-column layout: Main (2/3) and Sidebar (1/3)
    const mainColumnX = 50;
    const sidebarColumnX = 400;
    const mainColumnWidth = 320;
    const sidebarColumnWidth = 145;

    // Section title helper with bullet
    const drawSectionTitle = (title: string, x: number, width: number) => {
      doc.x = x;
      doc.fillColor(accentColor).fontSize(10).font('Helvetica-Bold');
      doc.text('●', { continued: true });
      doc.fillColor(darkText).fontSize(18).font('Helvetica-Bold');
      doc.text(` ${title.toUpperCase()}`, { width: width - 10, characterSpacing: 1 });
      doc.moveDown(0.6);
    };

    // Main Column
    let mainY = doc.y;

    // Experience
    const experiences = (resume.experiences as any[]) || [];
    if (experiences.length) {
      doc.x = mainColumnX;
      doc.y = mainY;
      drawSectionTitle('Experience', mainColumnX, mainColumnWidth);
      experiences.forEach((exp) => {
        const startY = doc.y;
        // Left border
        doc
          .moveTo(mainColumnX, startY)
          .lineTo(mainColumnX, startY + 50)
          .lineWidth(4)
          .strokeColor(accentColor)
          .stroke();

        doc.x = mainColumnX + 15;

        const position = exp.position || exp.jobTitle || '';
        const company = exp.company || exp.companyName || '';
        if (position) {
          doc
            .fontSize(14)
            .fillColor(darkText)
            .font('Helvetica-Bold')
            .text(position, { width: mainColumnWidth - 15 });
          doc.moveDown(0.2);
        }
        if (company) {
          doc
            .fontSize(10)
            .fillColor(lightGray)
            .text(company, { width: mainColumnWidth - 15 });
          doc.moveDown(0.2);
        }

        const startDate = exp.start_date || exp.startDate || '';
        const endDate = exp.end_date || exp.endDate || '';
        if (startDate || endDate) {
          const dateStr = `${formatDate(startDate)}${endDate ? ` - ${formatDate(endDate)}` : ''}`;
          doc
            .fontSize(8)
            .fillColor(darkerGray)
            .text(dateStr, { width: mainColumnWidth - 15 });
          doc.moveDown(0.2);
        }

        if (exp.description || exp.jobDescription) {
          doc
            .fontSize(9)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(exp.description || exp.jobDescription || '', {
              width: mainColumnWidth - 15,
              lineGap: 2,
            });
        }

        doc.moveDown(0.8);
        mainY = doc.y;
      });
    }

    // Projects
    const projects = (resume.projects as any[]) || [];
    if (projects.length) {
      doc.x = mainColumnX;
      doc.y = mainY;
      drawSectionTitle('Projects', mainColumnX, mainColumnWidth);
      projects.forEach((proj) => {
        const startY = doc.y;
        // Left border
        doc
          .moveTo(mainColumnX, startY)
          .lineTo(mainColumnX, startY + 40)
          .lineWidth(4)
          .strokeColor(accentColor)
          .stroke();

        doc.x = mainColumnX + 15;

        const name = proj.name || proj.projectName || '';
        if (name) {
          doc
            .fontSize(12)
            .fillColor(darkText)
            .font('Helvetica-Bold')
            .text(name, { width: mainColumnWidth - 15 });
          doc.moveDown(0.2);
        }

        if (proj.description) {
          doc
            .fontSize(9)
            .fillColor(lightGray)
            .font('Helvetica')
            .text(proj.description, { width: mainColumnWidth - 15, lineGap: 2 });
          doc.moveDown(0.2);
        }

        const technologies = proj.technologies || [];
        if (Array.isArray(technologies) && technologies.length > 0) {
          technologies.forEach((tech: string) => {
            if (tech) {
              // Simulate tag with background
              doc
                .fontSize(7)
                .fillColor(accentColor)
                .font('Helvetica-Bold')
                .text(tech, { width: mainColumnWidth - 15 });
              doc.moveDown(0.15);
            }
          });
        }

        doc.moveDown(0.6);
      });
    }

    // Sidebar Column
    let sidebarY = summary ? 200 : 150;

    // Skills
    if (resume.skills && Array.isArray(resume.skills) && resume.skills.length > 0) {
      doc.x = sidebarColumnX;
      doc.y = sidebarY;
      doc.fillColor(darkText).fontSize(12).font('Helvetica-Bold');
      doc.text('SKILLS', { width: sidebarColumnWidth, characterSpacing: 1 });
      doc.moveDown(0.4);
      doc.x = sidebarColumnX;
      resume.skills.forEach((skill: string) => {
        if (skill) {
          // Simulate tag with background (accent color with opacity)
          doc
            .fontSize(9)
            .fillColor(accentColor)
            .font('Helvetica-Bold')
            .text(skill, { width: sidebarColumnWidth });
          doc.moveDown(0.3);
        }
      });
      sidebarY = doc.y;
    }

    // Education
    const educations = (resume.educations as any[]) || [];
    if (educations.length) {
      doc.x = sidebarColumnX;
      doc.y = sidebarY + 20;
      doc.fillColor(darkText).fontSize(12).font('Helvetica-Bold');
      doc.text('EDUCATION', { width: sidebarColumnWidth, characterSpacing: 1 });
      doc.moveDown(0.4);
      educations.forEach((edu) => {
        doc.x = sidebarColumnX;

        const degree = edu.degree || '';
        if (degree) {
          doc
            .fontSize(11)
            .fillColor(darkText)
            .font('Helvetica-Bold')
            .text(degree, { width: sidebarColumnWidth });
          doc.moveDown(0.2);
        }

        const institution = edu.institution || edu.institutionName || '';
        if (institution) {
          doc
            .fontSize(9)
            .fillColor(lightGray)
            .text(institution, { width: sidebarColumnWidth });
        }

        doc.moveDown(0.5);
      });
    }
  }

  // Professional Template - Corporate style, formal layout with accent header
  private renderProfessionalTemplate(
    doc: PDFKit.PDFDocument,
    resume: any,
    accentColor: string,
    formatDate: (dateStr: string) => string,
  ): void {
    const textGray = '#374151';
    const textLightGray = '#6B7280';
    const white = '#FFFFFF';

    // Helper to convert hex to RGB
    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16),
          ]
        : [59, 130, 246];
    };

    const [r, g, b] = hexToRgb(accentColor);

    // Header with accent color background
    const headerHeight = 80;
    doc
      .rect(0, 0, 595, headerHeight)
      .fillColor(`rgb(${r}, ${g}, ${b})`)
      .fill();

    // Header Content - White text
    doc.y = 25;
    doc.x = 50;
    doc.fontSize(28).fillColor(white).font('Helvetica-Bold');
    doc.text(resume.name || 'Unnamed Candidate', { width: 400 });

    if (resume.profession) {
      doc
        .moveDown(0.2)
        .fontSize(14)
        .fillColor(white)
        .font('Helvetica')
        .opacity(0.95)
        .text(resume.profession, { width: 400 });
    }

    // Contact info bar below header
    doc.y = headerHeight + 20;
    doc.x = 50;
    doc.opacity(1);

    const contactParts: string[] = [];
    if (resume.email) contactParts.push(resume.email);
    if (resume.phoneNumber) contactParts.push(resume.phoneNumber);
    if (resume.address) contactParts.push(resume.address);
    if (resume.website && resume.website.length > 0) {
      const websiteStr = Array.isArray(resume.website) ? resume.website[0] : resume.website;
      if (websiteStr) contactParts.push(websiteStr);
    }

    if (contactParts.length) {
      doc
        .fontSize(9)
        .fillColor(textGray)
        .font('Helvetica')
        .text(contactParts.join(' • '), { width: 495 });
    }

    // Border line
    doc.moveDown(0.6);
    const borderY = doc.y;
    doc
      .moveTo(50, borderY)
      .lineTo(545, borderY)
      .lineWidth(2)
      .strokeColor(accentColor + '40')
      .stroke();
    doc.moveDown(0.8);

    // Section title helper
    const drawSectionTitle = (title: string) => {
      doc
        .fontSize(9)
        .fillColor(accentColor)
        .font('Helvetica-Bold')
        .text(title.toUpperCase(), { width: 495, characterSpacing: 2 });
      doc.moveDown(0.4);
      doc.fillColor(textGray).fontSize(10).font('Helvetica');
    };

    // Professional Summary
    const summary = resume.summary || resume.professional;
    if (summary) {
      drawSectionTitle('Professional Summary');
      doc
        .fontSize(10)
        .fillColor(textGray)
        .text(summary, { width: 495, lineGap: 2 });
      doc.moveDown(0.8);
    }

    // Experience
    const experiences = (resume.experiences as any[]) || [];
    if (experiences.length) {
      drawSectionTitle('Professional Experience');
      experiences.forEach((exp) => {
        doc.x = 50;

        // Position and Company
        const position = exp.position || exp.jobTitle || '';
        const company = exp.company || exp.companyName || '';
        if (position || company) {
          doc
            .fontSize(12)
            .fillColor('#111827')
            .font('Helvetica-Bold')
            .text(position || company, { width: 400 });
          if (position && company) {
            doc
              .fontSize(10)
              .fillColor(textGray)
              .font('Helvetica-Bold')
              .text(company, { width: 400 });
          }
          doc.moveDown(0.2);
        }

        // Date range (right aligned)
        const startDate = exp.start_date || exp.startDate || '';
        const endDate = exp.end_date || exp.endDate || '';
        if (startDate || endDate) {
          const dateStr = `${formatDate(startDate)}${endDate ? ` - ${formatDate(endDate)}` : ''}`;
          doc
            .fontSize(8)
            .fillColor(textLightGray)
            .text(dateStr, { align: 'right', width: 495 });
          doc.moveDown(0.2);
        }

        // Description
        if (exp.description || exp.jobDescription) {
          doc
            .fontSize(9)
            .fillColor(textGray)
            .font('Helvetica')
            .text(exp.description || exp.jobDescription || '', {
              width: 495,
              lineGap: 2,
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
        doc.x = 50;

        const degree = edu.degree || '';
        if (degree) {
          doc
            .fontSize(12)
            .fillColor('#111827')
            .font('Helvetica-Bold')
            .text(degree, { width: 495 });
          doc.moveDown(0.2);
        }

        const institution = edu.institution || edu.institutionName || '';
        const field = edu.field || edu.fieldOfStudy || '';
        if (institution) {
          doc
            .fontSize(10)
            .fillColor(textGray)
            .text(institution + (field ? ` - ${field}` : ''), { width: 495 });
          doc.moveDown(0.2);
        }

        const gpa = edu.gpa || '';
        const gradDate = edu.graduation_date || edu.graduationDate || '';
        if (gpa || gradDate) {
          doc.fontSize(9).fillColor(textLightGray);
          let gradText = '';
          if (gradDate) gradText = `Graduated: ${formatDate(String(gradDate))}`;
          if (gpa) {
            gradText += gradText ? ` • GPA: ${gpa}` : `GPA: ${gpa}`;
          }
          doc.text(gradText, { width: 495 });
        }

        doc.moveDown(0.6);
      });
    }

    // Projects
    const projects = (resume.projects as any[]) || [];
    if (projects.length) {
      drawSectionTitle('Projects');
      projects.forEach((proj) => {
        const startY = doc.y;
        // Left border
        doc
          .moveTo(50, startY)
          .lineTo(50, startY + 40)
          .lineWidth(4)
          .strokeColor(accentColor + '80')
          .stroke();

        doc.x = 62;

        const name = proj.name || proj.projectName || '';
        if (name) {
          doc
            .fontSize(12)
            .fillColor('#111827')
            .font('Helvetica-Bold')
            .text(name, { width: 433 });
          doc.moveDown(0.2);
        }

        if (proj.description) {
          doc
            .fontSize(9)
            .fillColor(textGray)
            .font('Helvetica')
            .text(proj.description, { width: 433, lineGap: 2 });
          doc.moveDown(0.2);
        }

        const technologies = proj.technologies || [];
        if (Array.isArray(technologies) && technologies.length > 0) {
          technologies.forEach((tech: string) => {
            if (tech) {
              doc
                .fontSize(8)
                .fillColor(accentColor)
                .text(tech, { width: 433 });
              doc.moveDown(0.1);
            }
          });
        }

        doc.x = 50;
        doc.moveDown(0.6);
      });
    }

    // Skills
    if (resume.skills && Array.isArray(resume.skills) && resume.skills.length > 0) {
      drawSectionTitle('Technical Skills');
      doc.x = 50;
      // Skills as tags
      resume.skills.forEach((skill: string) => {
        if (skill) {
          doc
            .fontSize(9)
            .fillColor(accentColor)
            .text(skill, { width: 495 });
          doc.moveDown(0.2);
        }
      });
    }
  }
}

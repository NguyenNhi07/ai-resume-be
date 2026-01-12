/**
 * HTML Renderer for Resume PDF Export using Puppeteer
 * Converts resume data to HTML that matches frontend templates
 */

interface ResumeData {
  name?: string;
  title?: string;
  avatar?: string;
  dateOfBirth?: Date | string;
  gender?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  profession?: string;
  language?: string;
  website?: string[];
  professional?: string;
  summary?: string;
  skills?: string[];
  experiences?: any[];
  educations?: any[];
  projects?: any[];
  certifications?: any[];
  template?: string;
  accentColor?: string;
  fontFamily?: string;
}

export function renderResumeToHtml(resume: ResumeData): string {
  const template = resume.template || 'classic';
  const accentColor = resume.accentColor || '#3B82F6';
  const fontFamily = getFontFamily(resume.fontFamily || 'inter');

  // Convert backend format to frontend format
  const frontendResume = convertToFrontendFormat(resume);

  // Render based on template
  switch (template) {
    case 'modern':
      return renderModernTemplate(frontendResume, accentColor, fontFamily);
    case 'minimal':
    case 'minimal-image':
      return renderMinimalTemplate(frontendResume, accentColor, fontFamily);
    case 'bold':
      return renderBoldTemplate(frontendResume, accentColor, fontFamily);
    case 'professional':
      return renderProfessionalTemplate(frontendResume, accentColor, fontFamily);
    case 'classic':
    default:
      return renderClassicTemplate(frontendResume, accentColor, fontFamily);
  }
}

function getFontFamily(key: string): string {
  const fontMap: Record<string, string> = {
    times: 'Times New Roman, serif',
    inter: 'Inter, system-ui, sans-serif',
    georgia: 'Georgia, serif',
    arial: 'Arial, Helvetica, sans-serif',
    roboto: 'Roboto, sans-serif',
    poppins: 'Poppins, sans-serif',
    mulish: 'Mulish, sans-serif',
    helvetica: 'Helvetica Neue, Helvetica, Arial, sans-serif',
    calibri: 'Calibri, Candara, Segoe, Segoe UI, Optima, Arial, sans-serif',
    garamond:
      'Garamond, Baskerville, Baskerville Old Face, Hoefler Text, Times New Roman, serif',
    cambria: 'Cambria, Georgia, serif',
    nunito: 'Nunito, sans-serif',
    montserrat: 'Montserrat, sans-serif',
  };
  return fontMap[key.toLowerCase()] || fontMap.inter;
}

function convertToFrontendFormat(resume: ResumeData): any {
  return {
    personal_info: {
      full_name: resume.name || '',
      birthDate: formatDateForDisplay(resume.dateOfBirth),
      gender: resume.gender || '',
      email: resume.email || '',
      phone: resume.phoneNumber || '',
      location: resume.address || '',
      website: Array.isArray(resume.website) ? resume.website[0] : resume.website || '',
      language: resume.language || '',
      image: resume.avatar || '',
      profession: resume.profession || '',
    },
    professional_summary: resume.summary || resume.professional || '',
    experience: Array.isArray(resume.experiences)
      ? resume.experiences.map((e: any) => ({
          company: e.companyName || e.company || '',
          position: e.jobTitle || e.position || '',
          description: e.jobDescription || e.description || '',
          is_current: e.isCurrent || e.is_current || false,
          start_date: formatDateForDisplay(e.startDate || e.start_date, 'MM/YYYY'),
          end_date:
            e.isCurrent || e.is_current
              ? ''
              : formatDateForDisplay(e.endDate || e.end_date, 'MM/YYYY'),
        }))
      : [],
    education: Array.isArray(resume.educations)
      ? resume.educations.map((edu: any) => ({
          institution: edu.institutionName || edu.institution || '',
          degree: edu.degree || '',
          field: edu.fieldOfStudy || edu.field || '',
          graduation_date: formatDateForDisplay(
            edu.graduationDate || edu.graduation_date,
            'MM/YYYY',
          ),
          gpa: edu.gpa || '',
        }))
      : [],
    project: Array.isArray(resume.projects)
      ? resume.projects.map((p: any) => ({
          name: p.projectName || p.name || '',
          description: p.description || '',
          technologies: Array.isArray(p.technologies)
            ? p.technologies.filter(Boolean)
            : [],
        }))
      : [],
    certifications: Array.isArray(resume.certifications)
      ? resume.certifications.map((cert: any) => ({
          name: cert.name || '',
          issuer: cert.issuer || '',
          issueDate: formatDateForDisplay(cert.issueDate || cert.issue_date, 'MM/YYYY'),
          expiryDate: formatDateForDisplay(
            cert.expiryDate || cert.expiry_date,
            'MM/YYYY',
          ),
          credentialId: cert.credentialId || cert.credential_id || '',
          credentialUrl: cert.credentialUrl || cert.credential_url || '',
        }))
      : [],
    skills: Array.isArray(resume.skills) ? resume.skills : [],
  };
}

function formatDateForDisplay(
  date: Date | string | undefined,
  format: 'DD/MM/YYYY' | 'MM/YYYY' = 'DD/MM/YYYY',
): string {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    if (format === 'MM/YYYY') {
      return `${month}/${year}`;
    }
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

function formatDateForDisplayShort(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 2) {
    const month = parseInt(parts[0], 10);
    const year = parts[1];
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    if (month >= 1 && month <= 12) {
      return `${monthNames[month - 1]} ${year}`;
    }
  }
  return dateStr;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTextWithLineBreaks(text: string): string {
  if (!text) return '';
  return escapeHtml(text).replace(/\n/g, '<br>');
}

function renderClassicTemplate(
  resume: any,
  accentColor: string,
  fontFamily: string,
): string {
  const {
    personal_info,
    professional_summary,
    experience,
    education,
    project,
    certifications,
    skills,
  } = resume;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: ${fontFamily};
      background-color: #ffffff;
      color: #111827;
      line-height: 1.6;
      padding: 32px;
      max-width: 210mm;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid ${accentColor};
    }
    .avatar {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid ${accentColor};
      margin-bottom: 16px;
    }
    h1 {
      font-size: 24px;
      font-weight: bold;
      color: #111827;
      margin-bottom: 8px;
    }
    .profession {
      font-size: 18px;
      color: #374151;
      margin-bottom: 16px;
    }
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 16px;
      font-size: 14px;
      color: #6B7280;
    }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    h2 {
      font-size: 20px;
      font-weight: bold;
      color: ${accentColor};
      margin-bottom: 16px;
    }
    .section {
      margin-bottom: 24px;
    }
    .section-item {
      border-left: 4px solid ${accentColor};
      padding-left: 16px;
      margin-bottom: 16px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }
    .section-subtitle {
      font-size: 16px;
      font-weight: 500;
      color: #374151;
    }
    .section-date {
      font-size: 14px;
      color: #6B7280;
    }
    .section-content {
      color: #374151;
      line-height: 1.8;
      white-space: pre-line;
    }
    .skills-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .skill-tag {
      padding: 6px 12px;
      font-size: 14px;
      border-radius: 4px;
      background-color: ${accentColor}33;
      color: ${accentColor};
    }
    .tech-tag {
      padding: 4px 8px;
      font-size: 12px;
      border-radius: 4px;
      background-color: ${accentColor}33;
      color: ${accentColor};
    }
    .gpa {
      font-size: 14px;
      color: #6B7280;
      margin-top: 4px;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    @media print {
      body {
        padding: 0;
      }
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    ${personal_info?.image ? `<img src="${escapeHtml(personal_info.image)}" alt="${escapeHtml(personal_info.full_name || '')}" class="avatar">` : ''}
    <h1>${escapeHtml(personal_info?.full_name || '')}</h1>
    ${personal_info?.profession ? `<p class="profession">${escapeHtml(personal_info.profession)}</p>` : ''}
    <div class="contact-info">
      ${personal_info?.birthDate ? `<div class="contact-item">${formatDateForDisplayShort(personal_info.birthDate)}</div>` : ''}
      ${personal_info?.gender ? `<div class="contact-item">${escapeHtml(personal_info.gender)}</div>` : ''}
      ${personal_info?.email ? `<div class="contact-item">${escapeHtml(personal_info.email)}</div>` : ''}
      ${personal_info?.phone ? `<div class="contact-item">${escapeHtml(personal_info.phone)}</div>` : ''}
      ${personal_info?.location ? `<div class="contact-item">${escapeHtml(personal_info.location)}</div>` : ''}
      ${personal_info?.website ? `<div class="contact-item"><a href="${escapeHtml(personal_info.website)}">${escapeHtml(personal_info.website)}</a></div>` : ''}
      ${personal_info?.language ? `<div class="contact-item">${escapeHtml(personal_info.language)}</div>` : ''}
    </div>
  </div>

  <!-- Professional Summary -->
  ${
    professional_summary
      ? `
  <div class="section">
    <h2>Professional Summary</h2>
    <div class="section-content">${formatTextWithLineBreaks(professional_summary)}</div>
  </div>
  `
      : ''
  }

  <!-- Experience -->
  ${
    experience && experience.length > 0
      ? `
  <div class="section">
    <h2>Professional Experience</h2>
    ${experience
      .map(
        (exp: any) => `
      <div class="section-item">
        <div class="section-header">
          <div>
            <div class="section-title">${escapeHtml(exp.position || '')}</div>
            <div class="section-subtitle">${escapeHtml(exp.company || '')}</div>
          </div>
          <div class="section-date">
            ${exp.start_date ? formatDateForDisplayShort(exp.start_date) : ''} - ${exp.is_current ? 'Present' : exp.end_date ? formatDateForDisplayShort(exp.end_date) : ''}
          </div>
        </div>
        ${exp.description ? `<div class="section-content">${formatTextWithLineBreaks(exp.description)}</div>` : ''}
      </div>
    `,
      )
      .join('')}
  </div>
  `
      : ''
  }

  <!-- Education -->
  ${
    education && education.length > 0
      ? `
  <div class="section">
    <h2>Education</h2>
    ${education
      .map(
        (edu: any) => `
      <div class="section-item">
        <div class="section-header">
          <div>
            <div class="section-title">${escapeHtml(edu.degree || '')}</div>
            <div class="section-subtitle">${escapeHtml(edu.institution || '')}${edu.field ? ` - ${escapeHtml(edu.field)}` : ''}</div>
            ${edu.gpa ? `<div class="gpa">GPA: ${escapeHtml(edu.gpa)}</div>` : ''}
          </div>
          <div class="section-date">
            ${edu.graduation_date ? formatDateForDisplayShort(edu.graduation_date) : ''}
          </div>
        </div>
      </div>
    `,
      )
      .join('')}
  </div>
  `
      : ''
  }

  <!-- Certifications -->
  ${
    certifications && certifications.length > 0
      ? `
  <div class="section">
    <h2>Certifications</h2>
    ${certifications
      .map(
        (cert: any) => `
      <div class="section-item">
        <div class="section-header">
          <div>
            <div class="section-title">${escapeHtml(cert.name || '')}</div>
            ${cert.issuer ? `<div class="section-subtitle">${escapeHtml(cert.issuer)}</div>` : ''}
            ${cert.credentialId ? `<div class="gpa">ID: ${escapeHtml(cert.credentialId)}</div>` : ''}
            ${cert.credentialUrl ? `<div><a href="${escapeHtml(cert.credentialUrl)}" target="_blank">View Credential</a></div>` : ''}
          </div>
          <div class="section-date">
            ${cert.issueDate ? formatDateForDisplayShort(cert.issueDate) : ''}
            ${cert.expiryDate ? ` - ${formatDateForDisplayShort(cert.expiryDate)}` : ''}
          </div>
        </div>
      </div>
    `,
      )
      .join('')}
  </div>
  `
      : ''
  }

  <!-- Projects -->
  ${
    project && project.length > 0
      ? `
  <div class="section">
    <h2>Projects</h2>
    ${project
      .map(
        (proj: any) => `
      <div class="section-item">
        <div class="section-title">${escapeHtml(proj.name || '')}</div>
        ${proj.description ? `<div class="section-content">${formatTextWithLineBreaks(proj.description)}</div>` : ''}
        ${
          proj.technologies && proj.technologies.length > 0
            ? `
          <div class="skills-container" style="margin-top: 8px;">
            ${proj.technologies.map((tech: string) => `<span class="tech-tag">${escapeHtml(tech)}</span>`).join('')}
          </div>
        `
            : ''
        }
      </div>
    `,
      )
      .join('')}
  </div>
  `
      : ''
  }

  <!-- Skills -->
  ${
    skills && skills.length > 0
      ? `
  <div class="section">
    <h2>Skills</h2>
    <div class="skills-container">
      ${skills.map((skill: string) => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}
    </div>
  </div>
  `
      : ''
  }
</body>
</html>
  `;
}

// Modern Template - Gradient header, two-column layout
function renderModernTemplate(
  resume: any,
  accentColor: string,
  fontFamily: string,
): string {
  const {
    personal_info,
    professional_summary,
    experience,
    education,
    project,
    certifications,
    skills,
  } = resume;
  const accentColorLight = accentColor + 'dd';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${fontFamily};
      background-color: #ffffff;
      color: #111827;
      line-height: 1.6;
    }
    .header-gradient {
      background: linear-gradient(135deg, ${accentColor} 0%, ${accentColorLight} 100%);
      color: white;
      padding: 32px;
    }
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header-flex {
      display: flex;
      align-items: flex-start;
      gap: 24px;
      margin-bottom: 24px;
    }
    .avatar-modern {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      flex-shrink: 0;
    }
    .header-text h1 {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .header-text p {
      font-size: 20px;
      opacity: 0.9;
    }
    .contact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      font-size: 14px;
    }
    .content-wrapper {
      padding: 32px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .main-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 32px;
    }
    h2 {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
    }
    .section-bar {
      width: 4px;
      height: 32px;
      background-color: ${accentColor};
      margin-right: 12px;
      border-radius: 2px;
    }
    .experience-item {
      margin-bottom: 24px;
      position: relative;
      padding-left: 20px;
    }
    .experience-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: ${accentColor};
      position: absolute;
      left: 0;
      top: 8px;
    }
    .experience-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .experience-title {
      font-size: 20px;
      font-weight: bold;
      color: #111827;
    }
    .experience-company {
      font-size: 18px;
      font-weight: 600;
      color: ${accentColor};
    }
    .experience-date {
      font-size: 14px;
      color: #6B7280;
      font-weight: 500;
    }
    .experience-desc {
      color: #374151;
      line-height: 1.8;
      white-space: pre-line;
    }
    .project-card {
      border: 1px solid ${accentColor}30;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .project-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 12px;
    }
    .tech-tag {
      padding: 6px 12px;
      font-size: 12px;
      border-radius: 999px;
      font-weight: 500;
      display: inline-block;
      margin: 4px 4px 4px 0;
      background-color: ${accentColor}20;
      color: ${accentColor};
    }
    .sidebar-section {
      margin-bottom: 32px;
    }
    .education-item, .cert-item {
      border-left: 4px solid ${accentColor};
      padding-left: 16px;
      margin-bottom: 16px;
    }
    .education-title, .cert-title {
      font-size: 18px;
      font-weight: bold;
      color: #111827;
    }
    .education-subtitle, .cert-subtitle {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      margin-top: 4px;
    }
    .skill-tag-modern {
      padding: 8px 16px;
      font-size: 14px;
      border-radius: 999px;
      font-weight: 500;
      display: inline-block;
      margin: 4px 4px 4px 0;
      background-color: ${accentColor}20;
      color: ${accentColor};
    }
    @media print {
      body { padding: 0; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header-gradient">
    <div class="header-content">
      <div class="header-flex">
        ${personal_info?.image ? `<img src="${escapeHtml(personal_info.image)}" alt="${escapeHtml(personal_info.full_name || '')}" class="avatar-modern">` : ''}
        <div class="header-text">
          <h1>${escapeHtml(personal_info?.full_name || '')}</h1>
          <p>${escapeHtml(personal_info?.profession || '')}</p>
        </div>
      </div>
      <div class="contact-grid">
        ${personal_info?.birthDate ? `<div>${formatDateForDisplayShort(personal_info.birthDate)}</div>` : ''}
        ${personal_info?.gender ? `<div>${escapeHtml(personal_info.gender)}</div>` : ''}
        ${personal_info?.email ? `<div>${escapeHtml(personal_info.email)}</div>` : ''}
        ${personal_info?.phone ? `<div>${escapeHtml(personal_info.phone)}</div>` : ''}
        ${personal_info?.location ? `<div>${escapeHtml(personal_info.location)}</div>` : ''}
        ${personal_info?.website ? `<div><a href="${escapeHtml(personal_info.website)}" style="color: white; text-decoration: underline;">${escapeHtml(personal_info.website)}</a></div>` : ''}
        ${personal_info?.language ? `<div>${escapeHtml(personal_info.language)}</div>` : ''}
      </div>
    </div>
  </div>

  <div class="content-wrapper">
    <div class="main-grid">
      <div>
        ${
          professional_summary
            ? `
        <div style="margin-bottom: 32px;">
          <h2><span class="section-bar"></span>About Me</h2>
          <p style="color: #374151; line-height: 1.8; font-size: 18px;">${formatTextWithLineBreaks(professional_summary)}</p>
        </div>
        `
            : ''
        }

        ${
          experience && experience.length > 0
            ? `
        <div style="margin-bottom: 32px;">
          <h2><span class="section-bar"></span>Experience</h2>
          ${experience
            .map(
              (exp: any) => `
            <div class="experience-item">
              <div class="experience-dot"></div>
              <div class="experience-header">
                <div>
                  <div class="experience-title">${escapeHtml(exp.position || '')}</div>
                  <div class="experience-company">${escapeHtml(exp.company || '')}</div>
                </div>
                <div class="experience-date">
                  ${exp.start_date ? formatDateForDisplayShort(exp.start_date) : ''} - ${exp.is_current ? 'Present' : exp.end_date ? formatDateForDisplayShort(exp.end_date) : ''}
                </div>
              </div>
              ${exp.description ? `<div class="experience-desc">${formatTextWithLineBreaks(exp.description)}</div>` : ''}
            </div>
          `,
            )
            .join('')}
        </div>
        `
            : ''
        }

        ${
          project && project.length > 0
            ? `
        <div style="margin-bottom: 32px;">
          <h2><span class="section-bar"></span>Projects</h2>
          ${project
            .map(
              (proj: any) => `
            <div class="project-card">
              <div class="project-title">${escapeHtml(proj.name || '')}</div>
              ${proj.description ? `<div style="color: #374151; line-height: 1.8; margin-bottom: 16px; white-space: pre-line;">${formatTextWithLineBreaks(proj.description)}</div>` : ''}
              ${
                proj.technologies && proj.technologies.length > 0
                  ? `
                <div>
                  ${proj.technologies.map((tech: string) => `<span class="tech-tag">${escapeHtml(tech)}</span>`).join('')}
                </div>
              `
                  : ''
              }
            </div>
          `,
            )
            .join('')}
        </div>
        `
            : ''
        }
      </div>

      <div>
        ${
          education && education.length > 0
            ? `
        <div class="sidebar-section">
          <h2><span class="section-bar"></span>Education</h2>
          ${education
            .map(
              (edu: any) => `
            <div class="education-item">
              <div class="education-title">${escapeHtml(edu.degree || '')}</div>
              <div class="education-subtitle">${escapeHtml(edu.institution || '')}${edu.field ? ` - ${escapeHtml(edu.field)}` : ''}</div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                <span style="font-size: 14px; color: #6B7280;">${edu.graduation_date ? formatDateForDisplayShort(edu.graduation_date) : ''}</span>
                ${edu.gpa ? `<span style="font-size: 14px; font-weight: 500; color: ${accentColor};">GPA: ${escapeHtml(edu.gpa)}</span>` : ''}
              </div>
            </div>
          `,
            )
            .join('')}
        </div>
        `
            : ''
        }

        ${
          certifications && certifications.length > 0
            ? `
        <div class="sidebar-section">
          <h2><span class="section-bar"></span>Certifications</h2>
          ${certifications
            .map(
              (cert: any) => `
            <div class="cert-item">
              <div class="cert-title">${escapeHtml(cert.name || '')}</div>
              ${cert.issuer ? `<div class="cert-subtitle">${escapeHtml(cert.issuer)}</div>` : ''}
              <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                <span style="font-size: 14px; color: #6B7280;">
                  ${cert.issueDate ? formatDateForDisplayShort(cert.issueDate) : ''}
                  ${cert.expiryDate ? ` - ${formatDateForDisplayShort(cert.expiryDate)}` : ''}
                </span>
                ${cert.credentialId ? `<span style="font-size: 14px; color: #6B7280;">ID: ${escapeHtml(cert.credentialId)}</span>` : ''}
              </div>
              ${cert.credentialUrl ? `<div style="margin-top: 8px;"><a href="${escapeHtml(cert.credentialUrl)}" style="font-size: 14px; color: ${accentColor};">View Credential →</a></div>` : ''}
            </div>
          `,
            )
            .join('')}
        </div>
        `
            : ''
        }

        ${
          skills && skills.length > 0
            ? `
        <div class="sidebar-section">
          <h2><span class="section-bar"></span>Skills</h2>
          <div>
            ${skills.map((skill: string) => `<span class="skill-tag-modern">${escapeHtml(skill)}</span>`).join('')}
          </div>
        </div>
        `
            : ''
        }
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Minimal Template - Clean, simple design
function renderMinimalTemplate(
  resume: any,
  accentColor: string,
  fontFamily: string,
): string {
  const {
    personal_info,
    professional_summary,
    experience,
    education,
    project,
    certifications,
    skills,
  } = resume;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${fontFamily};
      background-color: #ffffff;
      color: #111827;
      line-height: 1.6;
      padding: 32px;
      max-width: 210mm;
      margin: 0 auto;
    }
    .header-minimal {
      text-align: center;
      margin-bottom: 48px;
    }
    .avatar-minimal {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid ${accentColor};
      margin-bottom: 24px;
    }
    h1 {
      font-size: 30px;
      font-weight: 300;
      color: #111827;
      margin-bottom: 8px;
    }
    .profession-minimal {
      font-size: 18px;
      font-weight: 300;
      color: #6B7280;
      margin-bottom: 24px;
    }
    .contact-minimal {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 24px;
      font-size: 14px;
      color: #6B7280;
    }
    .divider {
      width: 48px;
      height: 1px;
      background-color: ${accentColor};
      margin: 0 auto 40px;
    }
    .summary-text {
      color: #374151;
      line-height: 1.8;
      font-size: 18px;
      font-weight: 300;
      margin-bottom: 40px;
    }
    .two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
    }
    h2 {
      font-size: 18px;
      font-weight: 500;
      color: ${accentColor};
      margin-bottom: 24px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .item-minimal {
      margin-bottom: 24px;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .item-title {
      font-size: 16px;
      font-weight: 500;
      color: #111827;
    }
    .item-subtitle {
      font-size: 14px;
      color: #6B7280;
    }
    .item-date {
      font-size: 12px;
      color: #9CA3AF;
      font-weight: 300;
    }
    .item-desc {
      font-size: 14px;
      color: #374151;
      line-height: 1.8;
      font-weight: 300;
      white-space: pre-line;
    }
    .skill-item {
      font-size: 14px;
      color: #374151;
      font-weight: 300;
      margin-bottom: 8px;
    }
    .tech-minimal {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;
      display: inline-block;
      margin: 2px 2px 2px 0;
      background-color: ${accentColor}10;
      color: ${accentColor};
    }
    @media print {
      body { padding: 0; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header-minimal">
    ${personal_info?.image ? `<img src="${escapeHtml(personal_info.image)}" alt="${escapeHtml(personal_info.full_name || '')}" class="avatar-minimal">` : ''}
    <h1>${escapeHtml(personal_info?.full_name || '')}</h1>
    <p class="profession-minimal">${escapeHtml(personal_info?.profession || '')}</p>
    <div class="contact-minimal">
      ${personal_info?.birthDate ? `<div>${formatDateForDisplayShort(personal_info.birthDate)}</div>` : ''}
      ${personal_info?.gender ? `<div>${escapeHtml(personal_info.gender)}</div>` : ''}
      ${personal_info?.email ? `<div>${escapeHtml(personal_info.email)}</div>` : ''}
      ${personal_info?.phone ? `<div>${escapeHtml(personal_info.phone)}</div>` : ''}
      ${personal_info?.location ? `<div>${escapeHtml(personal_info.location)}</div>` : ''}
      ${personal_info?.website ? `<div><a href="${escapeHtml(personal_info.website)}" style="color: #6B7280;">${escapeHtml(personal_info.website)}</a></div>` : ''}
      ${personal_info?.language ? `<div>${escapeHtml(personal_info.language)}</div>` : ''}
    </div>
  </div>

  ${
    professional_summary
      ? `
  <div>
    <div class="divider"></div>
    <p class="summary-text">${formatTextWithLineBreaks(professional_summary)}</p>
  </div>
  `
      : ''
  }

  <div class="two-column">
    <div>
      ${
        experience && experience.length > 0
          ? `
      <div style="margin-bottom: 40px;">
        <h2>Experience</h2>
        ${experience
          .map(
            (exp: any) => `
          <div class="item-minimal">
            <div class="item-header">
              <div>
                <div class="item-title">${escapeHtml(exp.position || '')}</div>
                <div class="item-subtitle">${escapeHtml(exp.company || '')}</div>
              </div>
              <div class="item-date">
                ${exp.start_date ? formatDateForDisplayShort(exp.start_date) : ''} - ${exp.is_current ? 'Present' : exp.end_date ? formatDateForDisplayShort(exp.end_date) : ''}
              </div>
            </div>
            ${exp.description ? `<div class="item-desc">${formatTextWithLineBreaks(exp.description)}</div>` : ''}
          </div>
        `,
          )
          .join('')}
      </div>
      `
          : ''
      }

      ${
        education && education.length > 0
          ? `
      <div style="margin-bottom: 40px;">
        <h2>Education</h2>
        ${education
          .map(
            (edu: any) => `
          <div class="item-minimal">
            <div class="item-title">${escapeHtml(edu.degree || '')}</div>
            <div class="item-subtitle">${escapeHtml(edu.institution || '')}${edu.field ? ` - ${escapeHtml(edu.field)}` : ''}</div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px;">
              <span class="item-date">${edu.graduation_date ? formatDateForDisplayShort(edu.graduation_date) : ''}</span>
              ${edu.gpa ? `<span style="font-size: 12px; font-weight: 500; color: ${accentColor};">GPA: ${escapeHtml(edu.gpa)}</span>` : ''}
            </div>
          </div>
        `,
          )
          .join('')}
      </div>
      `
          : ''
      }

      ${
        certifications && certifications.length > 0
          ? `
      <div style="margin-bottom: 40px;">
        <h2>Certifications</h2>
        ${certifications
          .map(
            (cert: any) => `
          <div class="item-minimal">
            <div class="item-title">${escapeHtml(cert.name || '')}</div>
            ${cert.issuer ? `<div class="item-subtitle">${escapeHtml(cert.issuer)}</div>` : ''}
            <div style="display: flex; justify-content: space-between; margin-top: 4px;">
              <span class="item-date">
                ${cert.issueDate ? formatDateForDisplayShort(cert.issueDate) : ''}
                ${cert.expiryDate ? ` - ${formatDateForDisplayShort(cert.expiryDate)}` : ''}
              </span>
              ${cert.credentialId ? `<span class="item-date">ID: ${escapeHtml(cert.credentialId)}</span>` : ''}
            </div>
            ${cert.credentialUrl ? `<div style="margin-top: 4px;"><a href="${escapeHtml(cert.credentialUrl)}" style="font-size: 12px; color: #6B7280;">View Credential</a></div>` : ''}
          </div>
        `,
          )
          .join('')}
      </div>
      `
          : ''
      }
    </div>

    <div>
      ${
        skills && skills.length > 0
          ? `
      <div style="margin-bottom: 40px;">
        <h2>Skills</h2>
        ${skills.map((skill: string) => `<div class="skill-item">${escapeHtml(skill)}</div>`).join('')}
      </div>
      `
          : ''
      }

      ${
        project && project.length > 0
          ? `
      <div style="margin-bottom: 40px;">
        <h2>Projects</h2>
        ${project
          .map(
            (proj: any) => `
          <div class="item-minimal">
            <div class="item-title">${escapeHtml(proj.name || '')}</div>
            ${proj.description ? `<div class="item-desc">${formatTextWithLineBreaks(proj.description)}</div>` : ''}
            ${
              proj.technologies && proj.technologies.length > 0
                ? `
              <div style="margin-top: 8px;">
                ${proj.technologies.map((tech: string) => `<span class="tech-minimal">${escapeHtml(tech)}</span>`).join('')}
              </div>
            `
                : ''
            }
          </div>
        `,
          )
          .join('')}
      </div>
      `
          : ''
      }
    </div>
  </div>
</body>
</html>
  `;
}

// Bold Template - Dark background, bold design
function renderBoldTemplate(
  resume: any,
  accentColor: string,
  fontFamily: string,
): string {
  const {
    personal_info,
    professional_summary,
    experience,
    education,
    project,
    certifications,
    skills,
  } = resume;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${fontFamily};
      background-color: #111827;
      color: white;
      line-height: 1.6;
      padding: 40px;
      max-width: 210mm;
      margin: 0 auto;
    }
    .hero {
      margin-bottom: 48px;
    }
    .hero-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .hero-text {
      flex: 1;
    }
    .profession-label {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: ${accentColor};
      margin-bottom: 8px;
    }
    h1 {
      font-size: 72px;
      font-weight: 900;
      line-height: 1.1;
    }
    .avatar-bold {
      width: 192px;
      height: 192px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid ${accentColor};
      box-shadow: 0 8px 16px rgba(0,0,0,0.3);
    }
    .contact-bar {
      background-color: rgba(31, 41, 55, 0.8);
      border: 1px solid #374151;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      font-size: 14px;
      color: #D1D5DB;
    }
    .contact-item-bold {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .summary-bold {
      font-size: 18px;
      line-height: 1.8;
      color: #D1D5DB;
      max-width: 800px;
    }
    .main-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 48px;
    }
    h2 {
      font-size: 32px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 32px;
    }
    .section-dot {
      color: ${accentColor};
      margin-right: 8px;
    }
    .experience-item-bold {
      border-left: 4px solid ${accentColor};
      padding-left: 24px;
      margin-bottom: 32px;
    }
    .exp-title-bold {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .exp-company-bold {
      color: #9CA3AF;
      margin-bottom: 8px;
    }
    .exp-date-bold {
      font-size: 14px;
      color: #6B7280;
      margin-bottom: 8px;
    }
    .exp-desc-bold {
      color: #D1D5DB;
      line-height: 1.8;
      white-space: pre-line;
      margin-left: 32px;
    }
    .project-item-bold {
      border-left: 4px solid ${accentColor};
      padding-left: 24px;
      margin-bottom: 24px;
    }
    .project-title-bold {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .tech-bold {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 999px;
      font-weight: bold;
      display: inline-block;
      margin: 4px 4px 4px 0;
      background-color: ${accentColor}20;
      color: ${accentColor};
    }
    .skill-box {
      padding: 12px;
      border-radius: 8px;
      font-weight: bold;
      margin-bottom: 8px;
      background-color: ${accentColor}20;
      color: ${accentColor};
    }
    .edu-item-bold, .cert-item-bold {
      margin-bottom: 16px;
    }
    .edu-title-bold, .cert-title-bold {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .edu-subtitle-bold, .cert-subtitle-bold {
      color: #9CA3AF;
      font-size: 14px;
    }
    @media print {
      body { padding: 0; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="hero">
    <div class="hero-header">
      <div class="hero-text">
        <div class="profession-label">${escapeHtml(personal_info?.profession || '')}</div>
        <h1>${escapeHtml(personal_info?.full_name || '')}</h1>
      </div>
      ${personal_info?.image ? `<img src="${escapeHtml(personal_info.image)}" alt="${escapeHtml(personal_info.full_name || '')}" class="avatar-bold">` : ''}
    </div>

    <div class="contact-bar">
      ${personal_info?.birthDate ? `<div class="contact-item-bold">${formatDateForDisplayShort(personal_info.birthDate)}</div>` : ''}
      ${personal_info?.gender ? `<div class="contact-item-bold">${escapeHtml(personal_info.gender)}</div>` : ''}
      ${personal_info?.email ? `<div class="contact-item-bold">${escapeHtml(personal_info.email)}</div>` : ''}
      ${personal_info?.phone ? `<div class="contact-item-bold">${escapeHtml(personal_info.phone)}</div>` : ''}
      ${personal_info?.location ? `<div class="contact-item-bold">${escapeHtml(personal_info.location)}</div>` : ''}
      ${personal_info?.website ? `<div class="contact-item-bold"><a href="${escapeHtml(personal_info.website)}" style="color: #D1D5DB;">${escapeHtml(personal_info.website)}</a></div>` : ''}
      ${personal_info?.language ? `<div class="contact-item-bold">${escapeHtml(personal_info.language)}</div>` : ''}
    </div>

    ${professional_summary ? `<p class="summary-bold">${formatTextWithLineBreaks(professional_summary)}</p>` : ''}
  </div>

  <div class="main-grid">
    <div>
      ${
        experience && experience.length > 0
          ? `
      <div style="margin-bottom: 48px;">
        <h2><span class="section-dot">●</span>Experience</h2>
        ${experience
          .map(
            (exp: any) => `
          <div class="experience-item-bold">
            <div class="exp-title-bold">${escapeHtml(exp.position || '')}</div>
            <div class="exp-company-bold">${escapeHtml(exp.company || '')}</div>
            <div class="exp-date-bold">
              ${exp.start_date ? formatDateForDisplayShort(exp.start_date) : ''} - ${exp.is_current ? 'Present' : exp.end_date ? formatDateForDisplayShort(exp.end_date) : ''}
            </div>
            ${exp.description ? `<div class="exp-desc-bold">${formatTextWithLineBreaks(exp.description)}</div>` : ''}
          </div>
        `,
          )
          .join('')}
      </div>
      `
          : ''
      }

      ${
        project && project.length > 0
          ? `
      <div style="margin-bottom: 48px;">
        <h2><span class="section-dot">●</span>Projects</h2>
        ${project
          .map(
            (proj: any) => `
          <div class="project-item-bold">
            <div class="project-title-bold">${escapeHtml(proj.name || '')}</div>
            ${proj.description ? `<div style="color: #D1D5DB; margin-bottom: 12px; white-space: pre-line;">${formatTextWithLineBreaks(proj.description)}</div>` : ''}
            ${
              proj.technologies && proj.technologies.length > 0
                ? `
              <div>
                ${proj.technologies.map((tech: string) => `<span class="tech-bold">${escapeHtml(tech)}</span>`).join('')}
              </div>
            `
                : ''
            }
          </div>
        `,
          )
          .join('')}
      </div>
      `
          : ''
      }
    </div>

    <div>
      ${
        skills && skills.length > 0
          ? `
      <div style="margin-bottom: 32px;">
        <h3 style="font-size: 20px; font-weight: 900; text-transform: uppercase; margin-bottom: 16px;">Skills</h3>
        ${skills.map((skill: string) => `<div class="skill-box">${escapeHtml(skill)}</div>`).join('')}
      </div>
      `
          : ''
      }

      ${
        education && education.length > 0
          ? `
      <div style="margin-bottom: 32px;">
        <h3 style="font-size: 20px; font-weight: 900; text-transform: uppercase; margin-bottom: 16px;">Education</h3>
        ${education
          .map(
            (edu: any) => `
          <div class="edu-item-bold">
            <div class="edu-title-bold">${escapeHtml(edu.degree || '')}</div>
            <div class="edu-subtitle-bold">${escapeHtml(edu.institution || '')}</div>
          </div>
        `,
          )
          .join('')}
      </div>
      `
          : ''
      }

      ${
        certifications && certifications.length > 0
          ? `
      <div style="margin-bottom: 32px;">
        <h3 style="font-size: 20px; font-weight: 900; text-transform: uppercase; margin-bottom: 16px;">Certifications</h3>
        ${certifications
          .map(
            (cert: any) => `
          <div class="cert-item-bold">
            <div class="cert-title-bold">${escapeHtml(cert.name || '')}</div>
            ${cert.issuer ? `<div class="cert-subtitle-bold">${escapeHtml(cert.issuer)}</div>` : ''}
            ${
              cert.issueDate || cert.credentialId
                ? `
              <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">
                ${cert.issueDate ? formatDateForDisplayShort(cert.issueDate) : ''}
                ${cert.credentialId ? ` • ID: ${escapeHtml(cert.credentialId)}` : ''}
              </div>
            `
                : ''
            }
            ${cert.credentialUrl ? `<div style="margin-top: 4px;"><a href="${escapeHtml(cert.credentialUrl)}" style="font-size: 12px; color: ${accentColor};">View Credential →</a></div>` : ''}
          </div>
        `,
          )
          .join('')}
      </div>
      `
          : ''
      }
    </div>
  </div>
</body>
</html>
  `;
}

// Professional Template - Clean header with accent bar
function renderProfessionalTemplate(
  resume: any,
  accentColor: string,
  fontFamily: string,
): string {
  const {
    personal_info,
    professional_summary,
    experience,
    education,
    project,
    certifications,
    skills,
  } = resume;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${fontFamily};
      background-color: #ffffff;
      color: #111827;
      line-height: 1.6;
      padding: 40px;
      max-width: 210mm;
      margin: 0 auto;
    }
    .header-professional {
      background-color: ${accentColor};
      color: white;
      padding: 32px;
      margin: -40px -40px 32px -40px;
    }
    .header-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-text h1 {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .header-text p {
      font-size: 18px;
      font-weight: 300;
      opacity: 0.95;
    }
    .avatar-professional {
      width: 128px;
      height: 128px;
      border-radius: 8px;
      object-fit: cover;
      border: 4px solid white;
    }
    .contact-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      font-size: 14px;
      padding: 32px 0;
      border-bottom: 2px solid ${accentColor}40;
      margin-bottom: 32px;
    }
    .contact-item-professional {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h2 {
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: ${accentColor};
      margin-bottom: 16px;
    }
    .section-professional {
      margin-bottom: 32px;
    }
    .exp-item-professional {
      margin-bottom: 24px;
    }
    .exp-header-professional {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .exp-title-professional {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }
    .exp-company-professional {
      color: #374151;
      font-weight: 500;
    }
    .exp-date-professional {
      font-size: 12px;
      color: #6B7280;
    }
    .exp-desc-professional {
      color: #374151;
      font-size: 14px;
      line-height: 1.8;
      white-space: pre-line;
    }
    .edu-item-professional, .cert-item-professional {
      margin-bottom: 16px;
    }
    .edu-title-professional, .cert-title-professional {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }
    .edu-subtitle-professional, .cert-subtitle-professional {
      color: #374151;
    }
    .project-item-professional {
      border-left: 4px solid ${accentColor}80;
      padding-left: 16px;
      margin-bottom: 16px;
    }
    .project-title-professional {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }
    .tech-professional {
      font-size: 12px;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid ${accentColor}80;
      color: ${accentColor};
      display: inline-block;
      margin: 4px 4px 4px 0;
    }
    .skill-professional {
      font-size: 14px;
      padding: 6px 12px;
      border-radius: 4px;
      border: 1px solid ${accentColor};
      color: ${accentColor};
      display: inline-block;
      margin: 4px 4px 4px 0;
    }
    @media print {
      body { padding: 0; }
      .header-professional { margin: 0 0 32px 0; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header-professional">
    <div class="header-flex">
      <div class="header-text">
        <h1>${escapeHtml(personal_info?.full_name || '')}</h1>
        <p>${escapeHtml(personal_info?.profession || '')}</p>
      </div>
      ${personal_info?.image ? `<img src="${escapeHtml(personal_info.image)}" alt="${escapeHtml(personal_info.full_name || '')}" class="avatar-professional">` : ''}
    </div>
  </div>

  <div class="contact-bar">
    ${personal_info?.birthDate ? `<div class="contact-item-professional">${formatDateForDisplayShort(personal_info.birthDate)}</div>` : ''}
    ${personal_info?.gender ? `<div class="contact-item-professional">${escapeHtml(personal_info.gender)}</div>` : ''}
    ${personal_info?.email ? `<div class="contact-item-professional">${escapeHtml(personal_info.email)}</div>` : ''}
    ${personal_info?.phone ? `<div class="contact-item-professional">${escapeHtml(personal_info.phone)}</div>` : ''}
    ${personal_info?.location ? `<div class="contact-item-professional">${escapeHtml(personal_info.location)}</div>` : ''}
    ${personal_info?.website ? `<div class="contact-item-professional"><a href="${escapeHtml(personal_info.website)}" style="color: #111827;">${escapeHtml(personal_info.website)}</a></div>` : ''}
    ${personal_info?.language ? `<div class="contact-item-professional">${escapeHtml(personal_info.language)}</div>` : ''}
  </div>

  ${
    professional_summary
      ? `
  <div class="section-professional">
    <h2>Professional Summary</h2>
    <p style="color: #374151; line-height: 1.8;">${formatTextWithLineBreaks(professional_summary)}</p>
  </div>
  `
      : ''
  }

  ${
    experience && experience.length > 0
      ? `
  <div class="section-professional">
    <h2>Professional Experience</h2>
    ${experience
      .map(
        (exp: any) => `
      <div class="exp-item-professional">
        <div class="exp-header-professional">
          <div>
            <div class="exp-title-professional">${escapeHtml(exp.position || '')}</div>
            <div class="exp-company-professional">${escapeHtml(exp.company || '')}</div>
          </div>
          <span class="exp-date-professional">
            ${exp.start_date ? formatDateForDisplayShort(exp.start_date) : ''} - ${exp.is_current ? 'Present' : exp.end_date ? formatDateForDisplayShort(exp.end_date) : ''}
          </span>
        </div>
        ${exp.description ? `<div class="exp-desc-professional">${formatTextWithLineBreaks(exp.description)}</div>` : ''}
      </div>
    `,
      )
      .join('')}
  </div>
  `
      : ''
  }

  ${
    education && education.length > 0
      ? `
  <div class="section-professional">
    <h2>Education</h2>
    ${education
      .map(
        (edu: any) => `
      <div class="edu-item-professional">
        <div class="edu-title-professional">${escapeHtml(edu.degree || '')}</div>
        <div class="edu-subtitle-professional">
          ${escapeHtml(edu.institution || '')}${edu.field ? ` - ${escapeHtml(edu.field)}` : ''}
        </div>
        ${
          edu.graduation_date || edu.gpa
            ? `
          <div style="font-size: 14px; color: #6B7280; margin-top: 4px;">
            ${edu.graduation_date ? `Graduated: ${formatDateForDisplayShort(edu.graduation_date)}` : ''}
            ${edu.graduation_date && edu.gpa ? ' • ' : ''}
            ${edu.gpa ? `GPA: ${escapeHtml(edu.gpa)}` : ''}
          </div>
        `
            : ''
        }
      </div>
    `,
      )
      .join('')}
  </div>
  `
      : ''
  }

  ${
    certifications && certifications.length > 0
      ? `
  <div class="section-professional">
    <h2>Certifications</h2>
    ${certifications
      .map(
        (cert: any) => `
      <div class="cert-item-professional">
        <div class="cert-title-professional">${escapeHtml(cert.name || '')}</div>
        ${cert.issuer ? `<div class="cert-subtitle-professional">${escapeHtml(cert.issuer)}</div>` : ''}
        ${
          cert.issueDate || cert.expiryDate || cert.credentialId
            ? `
          <div style="font-size: 14px; color: #6B7280; margin-top: 4px;">
            ${cert.issueDate ? `Issued: ${formatDateForDisplayShort(cert.issueDate)}` : ''}
            ${cert.issueDate && cert.expiryDate ? ' • ' : ''}
            ${cert.expiryDate ? `Expires: ${formatDateForDisplayShort(cert.expiryDate)}` : ''}
            ${cert.credentialId ? ` • ID: ${escapeHtml(cert.credentialId)}` : ''}
          </div>
        `
            : ''
        }
        ${
          cert.credentialUrl
            ? `
          <div style="margin-top: 4px;">
            <a href="${escapeHtml(cert.credentialUrl)}" style="font-size: 14px; color: #2563eb;">View Credential</a>
          </div>
        `
            : ''
        }
      </div>
    `,
      )
      .join('')}
  </div>
  `
      : ''
  }

  ${
    project && project.length > 0
      ? `
  <div class="section-professional">
    <h2>Projects</h2>
    ${project
      .map(
        (proj: any) => `
      <div class="project-item-professional">
        <div class="project-title-professional">${escapeHtml(proj.name || '')}</div>
        ${proj.description ? `<div style="color: #374151; font-size: 14px; line-height: 1.8; margin-bottom: 8px; white-space: pre-line;">${formatTextWithLineBreaks(proj.description)}</div>` : ''}
        ${
          proj.technologies && proj.technologies.length > 0
            ? `
          <div>
            ${proj.technologies.map((tech: string) => `<span class="tech-professional">${escapeHtml(tech)}</span>`).join('')}
          </div>
        `
            : ''
        }
      </div>
    `,
      )
      .join('')}
  </div>
  `
      : ''
  }

  ${
    skills && skills.length > 0
      ? `
  <div class="section-professional">
    <h2>Technical Skills</h2>
    <div>
      ${skills.map((skill: string) => `<span class="skill-professional">${escapeHtml(skill)}</span>`).join('')}
    </div>
  </div>
  `
      : ''
  }
</body>
</html>
  `;
}

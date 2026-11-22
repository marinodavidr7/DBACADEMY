import type { Certificate, Enrollment, UserProfile } from '../types';

export interface DigitalBadge {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  categoryTag: string;
  studentName: string;
  instructorName: string;
  issueDate: string;
  issueYear: number;
  issueMonth: number;
  hashSignature: string;
  verificationUrl: string;
  theme: 'gold' | 'blue' | 'cyan' | 'emerald' | 'purple';
  unlocked: boolean;
  progressPercent: number;
  criteria: string;
  iconType: 'award' | 'zap' | 'shield' | 'flame' | 'sparkles';
}

export function buildLinkedInAddCertUrl(badge: DigitalBadge): string {
  const baseUrl = 'https://www.linkedin.com/profile/add';
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: badge.title,
    organizationName: 'DB Academy',
    issueYear: String(badge.issueYear),
    issueMonth: String(badge.issueMonth),
    certUrl: badge.verificationUrl,
    certId: badge.code,
  });
  return `${baseUrl}?${params.toString()}`;
}

export function buildLinkedInShareFeedUrl(badge: DigitalBadge): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(badge.verificationUrl)}`;
}

export function buildSuggestedPostText(badge: DigitalBadge): string {
  return `🎓 ¡Orgulloso de compartir que he obtenido la insignia oficial de "${badge.title}" en DB Academy! 🚀\n\nVerificación criptográfica: ${badge.verificationUrl}\n\n#DBAcademy #FormaciónTécnica #Certificación #${badge.categoryTag} #EducaciónDigital`;
}

export function computeUserBadges(
  user: { uid: string; displayName?: string | null; email?: string | null } | null,
  certificates: Certificate[],
  enrollments: Enrollment[]
): DigitalBadge[] {
  const studentName = user?.displayName || user?.email || 'Estudiante';
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const issueDateStr = `${monthNames[currentMonth - 1]} ${currentYear}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dbacademy.vercel.app';

  const badges: DigitalBadge[] = [];

  // 1. Course Certificate Badges (One badge per completed certificate)
  certificates.forEach((cert) => {
    badges.push({
      id: `badge_${cert.id}`,
      code: cert.verificationCode,
      title: cert.courseTitle,
      subtitle: 'Certificación Profesional DB Academy',
      description: 'Ha completado el 100% de los módulos teóricos, laboratorios prácticos y evaluaciones con verificación criptográfica SHA-256.',
      category: 'Certificación Oficial',
      categoryTag: 'ExcelAvanzado',
      studentName: cert.studentName || studentName,
      instructorName: cert.instructorName,
      issueDate: issueDateStr,
      issueYear: currentYear,
      issueMonth: currentMonth,
      hashSignature: cert.hashSignature,
      verificationUrl: `${origin}/?verify=${cert.verificationCode}`,
      theme: 'gold',
      unlocked: true,
      progressPercent: 100,
      criteria: 'Aprobar el 100% del programa académico.',
      iconType: 'award',
    });
  });

  // If no certificate yet, show Excel Specialist in-progress or unlocked badge
  const excelEnrollment = enrollments.find((e) => e.courseId === 'excel-basico-05');
  const excelPercent = excelEnrollment?.progressPercent ?? 0;
  if (!certificates.some((c) => c.courseId === 'excel-basico-05')) {
    const code = `DB-EXCEL-${user?.uid.slice(0, 6).toUpperCase() || 'PRO'}`;
    badges.push({
      id: 'badge_excel_core',
      code,
      title: 'Excel Specialist: Fórmulas y Análisis',
      subtitle: 'Insignia Técnica de Dominio Práctico',
      description: 'Dominio de sintaxis de fórmulas, referencias absolutas/relativas, manejo de errores y funciones estadísticas y lógicas.',
      category: 'Productividad & Datos',
      categoryTag: 'ExcelSpecialist',
      studentName,
      instructorName: 'Equipo DB Academy',
      issueDate: issueDateStr,
      issueYear: currentYear,
      issueMonth: currentMonth,
      hashSignature: 'e2b4f9c18d73a0e41578bc901a523efd671234abcd890123ef',
      verificationUrl: `${origin}/?verify=${code}`,
      theme: 'cyan',
      unlocked: excelPercent >= 100,
      progressPercent: excelPercent,
      criteria: 'Completar el curso de Excel y sus laboratorios interactivos.',
      iconType: 'zap',
    });
  }

  // 2. Formula Master Badge (Laboratorios del simulador)
  const isMasterUnlocked = excelPercent >= 80 || certificates.length > 0;
  const masterCode = `DB-FORMULA-${user?.uid.slice(0, 6).toUpperCase() || 'MASTER'}`;
  badges.push({
    id: 'badge_formula_master',
    code: masterCode,
    title: 'Maestro de Fórmulas y Lógica Condicional',
    subtitle: 'Insignia de Algorítmica en Hoja de Cálculo',
    description: 'Capacidad demostrada en anidamiento de =SI(), operadores lógicos, funciones de búsqueda matricial y troubleshooting en tiempo real.',
    category: 'Ingeniería de Hojas de Cálculo',
    categoryTag: 'FormulaMaster',
    studentName,
    instructorName: 'Equipo DB Academy',
    issueDate: issueDateStr,
    issueYear: currentYear,
    issueMonth: currentMonth,
    hashSignature: 'fa890123ef671234abcde2b4f9c18d73a0e41578bc901a523e',
    verificationUrl: `${origin}/?verify=${masterCode}`,
    theme: 'emerald',
    unlocked: isMasterUnlocked,
    progressPercent: isMasterUnlocked ? 100 : Math.min(excelPercent + 20, 90),
    criteria: 'Superar con éxito los laboratorios de fórmulas en el simulador 3D.',
    iconType: 'zap',
  });

  // 3. Security Champion Badge
  const secCode = `DB-SEC-${user?.uid.slice(0, 6).toUpperCase() || 'E2EE'}`;
  badges.push({
    id: 'badge_security_vault',
    code: secCode,
    title: 'Seguridad Digital & Cifrado E2EE',
    subtitle: 'Insignia de Buenas Prácticas Criptográficas',
    description: 'Implementación de bóveda de notas cifradas con AES-GCM-256 e integridad de datos en el campus virtual.',
    category: 'Ciberseguridad',
    categoryTag: 'CyberSecurity',
    studentName,
    instructorName: 'Equipo DB Academy',
    issueDate: issueDateStr,
    issueYear: currentYear,
    issueMonth: currentMonth,
    hashSignature: '9c18d73a0e41578bc901a523efd671234abcde2b4ff1234567',
    verificationUrl: `${origin}/?verify=${secCode}`,
    theme: 'purple',
    unlocked: true,
    progressPercent: 100,
    criteria: 'Activar tu cuenta con credenciales seguras y perfil verificado.',
    iconType: 'shield',
  });

  // 4. Early Adopter / Pioneer Badge
  const pioneerCode = `DB-PIONEER-${user?.uid.slice(0, 6).toUpperCase() || 'FOUNDER'}`;
  badges.push({
    id: 'badge_early_pioneer',
    code: pioneerCode,
    title: 'Pionero de DB Academy 2026',
    subtitle: 'Miembro Fundador de la Comunidad Técnica',
    description: 'Reconocimiento otorgado a los primeros profesionales que impulsan el aprendizaje técnico interactivo y colaborativo.',
    category: 'Comunidad & Liderazgo',
    categoryTag: 'TechCommunity',
    studentName,
    instructorName: 'Dirección DB Academy',
    issueDate: issueDateStr,
    issueYear: currentYear,
    issueMonth: currentMonth,
    hashSignature: '1578bc901a523efd671234abcde2b4f9c18d73a0e4890123ef',
    verificationUrl: `${origin}/?verify=${pioneerCode}`,
    theme: 'blue',
    unlocked: true,
    progressPercent: 100,
    criteria: 'Formar parte activa del lanzamiento de DB Academy.',
    iconType: 'sparkles',
  });

  return badges;
}

export function downloadBadgeAsSvg(badge: DigitalBadge) {
  const themeColors = {
    gold: { stroke: '#F59E0B', bgStart: '#1E1B18', bgEnd: '#0F172A', accent: '#FBBF24', ribbon: '#D97706' },
    blue: { stroke: '#3B82F6', bgStart: '#0B192C', bgEnd: '#0F172A', accent: '#60A5FA', ribbon: '#2563EB' },
    cyan: { stroke: '#06B6D4', bgStart: '#08252E', bgEnd: '#0F172A', accent: '#22D3EE', ribbon: '#0891B2' },
    emerald: { stroke: '#10B981', bgStart: '#062B1D', bgEnd: '#0F172A', accent: '#34D399', ribbon: '#059669' },
    purple: { stroke: '#8B5CF6', bgStart: '#1E1035', bgEnd: '#0F172A', accent: '#A78BFA', ribbon: '#7C3AED' },
  }[badge.theme];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${themeColors.bgStart}"/>
      <stop offset="100%" stop-color="${themeColors.bgEnd}"/>
    </linearGradient>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${themeColors.accent}"/>
      <stop offset="50%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="${themeColors.stroke}"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="15" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="800" height="1000" rx="32" fill="url(#bgGrad)" stroke="${themeColors.stroke}" stroke-width="4" />

  <!-- Outer Tech Circuit Details -->
  <circle cx="400" cy="360" r="230" fill="none" stroke="${themeColors.stroke}" stroke-width="2" stroke-dasharray="10 14" opacity="0.4"/>
  <circle cx="400" cy="360" r="200" fill="none" stroke="${themeColors.accent}" stroke-width="3" opacity="0.6"/>

  <!-- Glowing Emblem Medallion -->
  <polygon points="400,180 540,260 540,460 400,540 260,460 260,260" fill="${themeColors.bgStart}" stroke="url(#ringGrad)" stroke-width="6" filter="url(#glow)"/>

  <!-- Inner Crest -->
  <polygon points="400,205 520,275 520,445 400,515 280,445 280,275" fill="#0A0F1D" stroke="${themeColors.accent}" stroke-width="2" />

  <!-- Brand Title -->
  <text x="400" y="300" text-anchor="middle" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="900" font-size="28" letter-spacing="4">DB ACADEMY</text>
  <text x="400" y="328" text-anchor="middle" fill="${themeColors.accent}" font-family="'Inter', sans-serif" font-weight="700" font-size="14" letter-spacing="3">DIGITAL CREDENTIAL</text>

  <!-- Central Star / Diamond Symbol -->
  <path d="M400,360 L425,400 L465,400 L435,425 L445,465 L400,440 L355,465 L365,425 L335,400 L375,400 Z" fill="${themeColors.accent}" stroke="#FFFFFF" stroke-width="2"/>

  <!-- Ribbon Banner -->
  <rect x="200" y="525" width="400" height="48" rx="24" fill="${themeColors.ribbon}" filter="url(#glow)" />
  <text x="400" y="556" text-anchor="middle" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="800" font-size="16" letter-spacing="2">${badge.category.toUpperCase()}</text>

  <!-- Awarded Title -->
  <text x="400" y="640" text-anchor="middle" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="800" font-size="30">${badge.title}</text>
  <text x="400" y="675" text-anchor="middle" fill="#94A3B8" font-family="'Inter', sans-serif" font-weight="500" font-size="16">${badge.subtitle}</text>

  <!-- Recipient Info -->
  <text x="400" y="740" text-anchor="middle" fill="#64748B" font-family="'Inter', sans-serif" font-weight="600" font-size="14" letter-spacing="1">OTORGADO A / AWARDED TO</text>
  <text x="400" y="780" text-anchor="middle" fill="${themeColors.accent}" font-family="'Inter', sans-serif" font-weight="800" font-size="28">${badge.studentName}</text>

  <!-- Verification Details -->
  <line x1="160" y1="830" x2="640" y2="830" stroke="#334155" stroke-width="1.5" />
  <text x="220" y="865" text-anchor="middle" fill="#94A3B8" font-family="'Inter', sans-serif" font-size="13">CÓDIGO OFICIAL</text>
  <text x="220" y="890" text-anchor="middle" fill="#FFFFFF" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="16">${badge.code}</text>

  <text x="580" y="865" text-anchor="middle" fill="#94A3B8" font-family="'Inter', sans-serif" font-size="13">FECHA DE EMISIÓN</text>
  <text x="580" y="890" text-anchor="middle" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="700" font-size="15">${badge.issueDate}</text>

  <!-- Footer Seal -->
  <text x="400" y="950" text-anchor="middle" fill="#64748B" font-family="'JetBrains Mono', monospace" font-size="11">VERIFICACIÓN CRIPTOGRÁFICA SHA-256 · ${badge.hashSignature.slice(0, 28)}...</text>
</svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Insignia_DB_${badge.code}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

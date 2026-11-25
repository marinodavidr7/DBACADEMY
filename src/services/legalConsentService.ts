/**
 * legalConsentService.ts
 * Servicio integral de trazabilidad legal, consentimientos informados (Ley 126-02 y Ley 172-13),
 * gestión de solicitudes de Derechos ARCO y configuración granular de cookies en República Dominicana.
 */

export type LegalDocType = 
  | 'terminos'
  | 'privacidad'
  | 'cookies'
  | 'reembolsos'
  | 'uso-aceptable'
  | 'dpa';

export type ArcoRequestType = 'acceso' | 'rectificacion' | 'cancelacion' | 'oposicion';

export type ArcoRequestStatus = 'recibida' | 'en_analisis' | 'atendida' | 'rechazada';

export interface LegalConsentRecord {
  id: string;
  userId?: string;
  userEmail?: string;
  docType: LegalDocType;
  docVersion: string;
  docHash: string;
  acceptedAt: string; // ISO 8601
  /** Solo puede incorporarse de forma fiable desde el servidor; el navegador no expone su IP pública. */
  ipAddress?: string;
  userAgent: string;
  marketingOptIn?: boolean;
}

export interface ArcoRequestRecord {
  radicado: string; // ej. ARCO-2026-8492
  tipo: ArcoRequestType;
  nombreCompleto: string;
  tipoDocumento: 'cedula' | 'pasaporte' | 'rnc';
  numeroDocumento: string;
  email: string;
  telefono?: string;
  descripcion: string;
  fechaRadicacion: string; // ISO 8601
  fechaLimiteRespuesta: string; // 10 días laborables hábiles
  estado: ArcoRequestStatus;
  observaciones?: string;
}

export interface CookiePreferences {
  strictlyNecessary: boolean; // Siempre true
  performanceAnalytics: boolean;
  functionalPersonalization: boolean;
  marketingCookies: boolean;
  updatedAt: string;
  version: string;
}

export interface ContentReportRecord {
  id: string;
  nombreReportante: string;
  email: string;
  tipoInfraccion: 'derechos_autor' | 'contenido_ilicitio' | 'suplantacion' | 'otro';
  urlOModulo: string;
  descripcion: string;
  fecha: string;
  estado: 'pendiente' | 'revisado';
}

const STORAGE_KEYS = {
  CONSENTS: 'dba_legal_consents_log',
  ARCO_REQUESTS: 'dba_arco_requests_log',
  COOKIES: 'dba_cookie_preferences_v2',
  REPORTS: 'dba_content_reports_log',
};

/**
 * Versiones vigentes de los documentos publicados en `/legal/*.md`.
 * El hash es el SHA-256 real del archivo Markdown publicado y se registra en cada
 * consentimiento como evidencia de qué texto exacto fue aceptado (Ley 126-02).
 * Debe actualizarse junto con cualquier cambio de redacción o versión.
 */
export const CURRENT_DOC_VERSIONS: Record<LegalDocType, { version: string; hash: string; title: string }> = {
  terminos: {
    version: '1.2-2026',
    hash: 'sha256:93733fcbdfa87daee6abd5d36f60b1b3852ed415cbef1a77e04a648b5b8f6eba',
    title: 'Términos y Condiciones de Uso',
  },
  privacidad: {
    version: '1.2-2026',
    hash: 'sha256:fd64d395aec57607c662799ea2dc9da358f43d2d646bfcd87820df1a56fa6f64',
    title: 'Política de Privacidad y Protección de Datos',
  },
  cookies: {
    version: '1.1-2026',
    hash: 'sha256:470cf8432c7202f352bd8587ff4d138f09b7ea93b03f05f198927b4bcd8718f2',
    title: 'Política de Cookies y Tecnologías de Rastreo',
  },
  reembolsos: {
    version: '1.1-2026',
    hash: 'sha256:4a02e651eaee8f63e27c08d3f61456006a4c40c8488ade5fb4b0b58944faffd6',
    title: 'Política de Cancelación, Reembolsos y Garantía',
  },
  'uso-aceptable': {
    version: '1.0-2026',
    hash: 'sha256:a65685898c92d119ad17825ed6149a537b537573a53d880e09c5f4bfa8e3803d',
    title: 'Política de Uso Aceptable y Retiro de Contenido',
  },
  dpa: {
    version: '1.0-2026',
    hash: 'sha256:ac09cc473c66b69ed7f4b20867525c1a87c1308788709ffb85cae7d4d367e3b1',
    title: 'Acuerdo de Tratamiento de Datos (DPA B2B)',
  },
};

/** Cuenta días laborables (lunes a viernes) sin festivos; la fecha exacta se confirma al tramitar la solicitud. */
const addBusinessDays = (from: Date, days: number): Date => {
  const result = new Date(from.getTime());
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const weekday = result.getDay();
    if (weekday !== 0 && weekday !== 6) remaining -= 1;
  }
  return result;
};

export const legalConsentService = {
  /**
   * Registra un consentimiento expreso e informado con metadatos técnicos probatorios (Ley 126-02).
   */
  recordConsent(params: {
    docType: LegalDocType;
    userId?: string;
    userEmail?: string;
    marketingOptIn?: boolean;
  }): LegalConsentRecord {
    const docMeta = CURRENT_DOC_VERSIONS[params.docType];
    const record: LegalConsentRecord = {
      id: `CNS-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      userId: params.userId,
      userEmail: params.userEmail,
      docType: params.docType,
      docVersion: docMeta.version,
      docHash: docMeta.hash,
      acceptedAt: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node/Unknown',
      marketingOptIn: Boolean(params.marketingOptIn),
    };

    try {
      const stored = this.getAllConsents();
      stored.unshift(record);
      // Guardar últimos 100 registros
      localStorage.setItem(STORAGE_KEYS.CONSENTS, JSON.stringify(stored.slice(0, 100)));
    } catch (e) {
      console.warn('[legalConsentService] No se pudo persistir el consentimiento:', e);
    }

    return record;
  },

  getAllConsents(): LegalConsentRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONSENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Radica una solicitud formal de ejercicio de Derechos ARCO (Ley 172-13).
   * Genera número de radicado y fecha límite legal (10 días laborables).
   */
  submitArcoRequest(data: {
    tipo: ArcoRequestType;
    nombreCompleto: string;
    tipoDocumento: 'cedula' | 'pasaporte' | 'rnc';
    numeroDocumento: string;
    email: string;
    telefono?: string;
    descripcion: string;
  }): ArcoRequestRecord {
    const now = new Date();
    const limitDate = addBusinessDays(now, 10);

    const radicado = `ARCO-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRequest: ArcoRequestRecord = {
      radicado,
      tipo: data.tipo,
      nombreCompleto: data.nombreCompleto.trim(),
      tipoDocumento: data.tipoDocumento,
      numeroDocumento: data.numeroDocumento.trim(),
      email: data.email.trim().toLowerCase(),
      telefono: data.telefono?.trim(),
      descripcion: data.descripcion.trim(),
      fechaRadicacion: now.toISOString(),
      fechaLimiteRespuesta: limitDate.toISOString().split('T')[0],
      estado: 'recibida',
      observaciones: 'Solicitud registrada satisfactoriamente bajo amparo de la Ley 172-13.',
    };

    try {
      const current = this.getArcoRequests();
      current.unshift(newRequest);
      localStorage.setItem(STORAGE_KEYS.ARCO_REQUESTS, JSON.stringify(current));
    } catch (e) {
      console.error('[legalConsentService] Error al guardar radicado ARCO:', e);
    }

    return newRequest;
  },

  getArcoRequests(): ArcoRequestRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ARCO_REQUESTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Gestión de preferencias de cookies. Las categorías opcionales se mantienen
   * desactivadas hasta que el usuario emita una decisión expresa (Ley 172-13).
   */
  getCookiePreferences(): CookiePreferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COOKIES);
      if (raw) return JSON.parse(raw);
    } catch {}

    return {
      strictlyNecessary: true,
      performanceAnalytics: false,
      functionalPersonalization: false,
      marketingCookies: false,
      updatedAt: new Date().toISOString(),
      version: CURRENT_DOC_VERSIONS.cookies.version,
    };
  },

  /** Indica si ya existe una decisión de cookies registrada en este dispositivo. */
  hasCookieDecision(): boolean {
    try {
      return (
        Boolean(localStorage.getItem(STORAGE_KEYS.COOKIES)) ||
        Boolean(localStorage.getItem('dba_cookie_consent_v1'))
      );
    } catch {
      return false;
    }
  },

  saveCookiePreferences(prefs: Partial<CookiePreferences>): CookiePreferences {
    const full: CookiePreferences = {
      strictlyNecessary: true, // Siempre obligatoria
      performanceAnalytics: Boolean(prefs.performanceAnalytics),
      functionalPersonalization: Boolean(prefs.functionalPersonalization),
      marketingCookies: Boolean(prefs.marketingCookies),
      updatedAt: new Date().toISOString(),
      version: CURRENT_DOC_VERSIONS.cookies.version,
    };

    try {
      localStorage.setItem(STORAGE_KEYS.COOKIES, JSON.stringify(full));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dba_cookie_preferences_updated', { detail: full }));
      }
    } catch (e) {
      console.warn('[legalConsentService] Error al guardar cookies:', e);
    }

    return full;
  },

  /**
   * Radicar reporte de infracción de propiedad intelectual o takedown (Ley 65-00)
   */
  submitContentReport(data: {
    nombreReportante: string;
    email: string;
    tipoInfraccion: 'derechos_autor' | 'contenido_ilicitio' | 'suplantacion' | 'otro';
    urlOModulo: string;
    descripcion: string;
  }): ContentReportRecord {
    const record: ContentReportRecord = {
      id: `REP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      nombreReportante: data.nombreReportante.trim(),
      email: data.email.trim(),
      tipoInfraccion: data.tipoInfraccion,
      urlOModulo: data.urlOModulo.trim(),
      descripcion: data.descripcion.trim(),
      fecha: new Date().toISOString(),
      estado: 'pendiente',
    };

    try {
      const reports = this.getContentReports();
      reports.unshift(record);
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    } catch (e) {
      console.warn('[legalConsentService] Error al guardar reporte:', e);
    }

    return record;
  },

  getContentReports(): ContentReportRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Exporta en formato estructurado la información legal generada en este dispositivo,
   * como soporte del derecho de acceso (Art. 44 de la Constitución y Ley 172-13).
   * El expediente completo de la cuenta se entrega por el canal ARCO.
   */
  exportLegalData(): string {
    return JSON.stringify(
      {
        exportadoEn: new Date().toISOString(),
        responsable: 'DB Academy, S.R.L. / David Batista — RNC 1-32-84920-1',
        referencia: 'Derecho de acceso, Ley 172-13 y Art. 44 de la Constitución',
        documentosVigentes: CURRENT_DOC_VERSIONS,
        consentimientos: this.getAllConsents(),
        solicitudesArco: this.getArcoRequests(),
        preferenciasCookies: this.getCookiePreferences(),
        reportesContenido: this.getContentReports(),
      },
      null,
      2
    );
  },
};

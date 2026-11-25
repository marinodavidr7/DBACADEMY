import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Cookie,
  Download,
  ExternalLink,
  FileText,
  Flag,
  History,
  Lock,
  Scale,
  Send,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { legalDocumentPath } from '../services/legalDocuments';
import {
  CURRENT_DOC_VERSIONS,
  legalConsentService,
  type ArcoRequestRecord,
  type ArcoRequestType,
  type ContentReportRecord,
  type CookiePreferences,
  type LegalConsentRecord,
  type LegalDocType,
} from '../services/legalConsentService';

type LegalTab = 'docs' | 'arco' | 'cookies' | 'takedown' | 'consents';

interface LegalDocCard {
  docType?: LegalDocType;
  title: string;
  file: string;
  desc: string;
  lawRef: string;
}

const DOCS: LegalDocCard[] = [
  {
    docType: 'terminos',
    title: 'Términos y Condiciones de Uso',
    file: 'TERMINOS-Y-CONDICIONES.md',
    desc: 'Contrato de adhesión, reglas de uso, pagos, propiedad intelectual y jurisdicción en RD.',
    lawRef: 'Ley 358-05 · Ley 126-02',
  },
  {
    docType: 'privacidad',
    title: 'Política de Privacidad',
    file: 'POLITICA-DE-PRIVACIDAD.md',
    desc: 'Datos tratados, finalidades, transferencias internacionales, retención y derechos ARCO.',
    lawRef: 'Const. art. 44 · Ley 172-13',
  },
  {
    docType: 'cookies',
    title: 'Política de Cookies',
    file: 'POLITICA-DE-COOKIES.md',
    desc: 'Uso de cookies, almacenamiento local, tecnologías de terceros y preferencias.',
    lawRef: 'Ley 172-13 · Ley 53-07',
  },
  {
    docType: 'reembolsos',
    title: 'Cancelación y Reembolsos',
    file: 'POLITICA-CANCELACION-REEMBOLSOS.md',
    desc: 'Condiciones de compra, desistimiento, cancelación y devoluciones.',
    lawRef: 'Ley 358-05',
  },
  {
    docType: 'uso-aceptable',
    title: 'Uso Aceptable y Retiro de Contenido',
    file: 'POLITICA-USO-ACEPTABLE.md',
    desc: 'Conducta en foros/tareas y procedimiento de notificación y retiro (takedown).',
    lawRef: 'Ley 65-00 · Ley 53-07',
  },
  {
    docType: 'dpa',
    title: 'Acuerdo Encargado de Tratamiento (DPA)',
    file: 'ACUERDO-ENCARGADO-TRATAMIENTO.md',
    desc: 'Anexo B2B/institucional de confidencialidad, subencargados y seguridad.',
    lawRef: 'Ley 172-13',
  },
  {
    title: 'Informe de Auditoría Legal-Técnica',
    file: 'INFORME-AUDITORIA.md',
    desc: 'Hallazgos técnicos-legales, matriz de riesgos y puntos de revisión.',
    lawRef: 'Auditoría interna',
  },
];

export const LegalCenterView: React.FC = () => {
  const { user } = usePlatform();
  const [activeTab, setActiveTab] = useState<LegalTab>('docs');

  // Consentimientos
  const [consents, setConsents] = useState<LegalConsentRecord[]>(() =>
    legalConsentService.getAllConsents()
  );
  const [acceptDocsChecked, setAcceptDocsChecked] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [consentSavedBanner, setConsentSavedBanner] = useState<string | null>(null);

  // Derechos ARCO
  const [arcoRequests, setArcoRequests] = useState<ArcoRequestRecord[]>(() =>
    legalConsentService.getArcoRequests()
  );
  const [arcoTipo, setArcoTipo] = useState<ArcoRequestType>('acceso');
  const [arcoNombre, setArcoNombre] = useState(user?.displayName || '');
  const [arcoTipoDoc, setArcoTipoDoc] = useState<'cedula' | 'pasaporte' | 'rnc'>('cedula');
  const [arcoNumDoc, setArcoNumDoc] = useState('');
  const [arcoEmail, setArcoEmail] = useState(user?.email || '');
  const [arcoTelefono, setArcoTelefono] = useState('');
  const [arcoDesc, setArcoDesc] = useState('');
  const [arcoResult, setArcoResult] = useState<ArcoRequestRecord | null>(null);
  const [arcoError, setArcoError] = useState('');

  // Preferencias de Cookies
  const [cookiePrefs, setCookiePrefs] = useState<CookiePreferences>(() =>
    legalConsentService.getCookiePreferences()
  );
  const [cookieSavedMsg, setCookieSavedMsg] = useState('');

  // Reporte de Contenido / Takedown
  const [reports, setReports] = useState<ContentReportRecord[]>(() =>
    legalConsentService.getContentReports()
  );
  const [repNombre, setRepNombre] = useState(user?.displayName || '');
  const [repEmail, setRepEmail] = useState(user?.email || '');
  const [repTipo, setRepTipo] = useState<ContentReportRecord['tipoInfraccion']>('derechos_autor');
  const [repUrl, setRepUrl] = useState('');
  const [repDesc, setRepDesc] = useState('');
  const [repSaved, setRepSaved] = useState<ContentReportRecord | null>(null);
  const [repError, setRepError] = useState('');

  useEffect(() => {
    const syncCookies = () => {
      setCookiePrefs(legalConsentService.getCookiePreferences());
    };
    window.addEventListener('dba_cookie_preferences_updated', syncCookies);
    return () => window.removeEventListener('dba_cookie_preferences_updated', syncCookies);
  }, []);

  const handleRecordAcceptance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptDocsChecked) return;

    const docsToRecord: LegalDocType[] = ['terminos', 'privacidad', 'cookies', 'reembolsos'];
    docsToRecord.forEach((docType) => {
      legalConsentService.recordConsent({
        docType,
        userId: user?.uid,
        userEmail: user?.email || undefined,
        marketingOptIn,
      });
    });

    setConsents(legalConsentService.getAllConsents());
    setAcceptDocsChecked(false);
    setConsentSavedBanner(
      `Aceptación registrada con trazabilidad (${CURRENT_DOC_VERSIONS.terminos.version}) el ${new Date().toLocaleString('es-DO')}.`
    );
  };

  const handleArcoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setArcoError('');
    setArcoResult(null);

    if (!arcoNombre.trim() || !arcoNumDoc.trim() || !arcoEmail.trim() || !arcoDesc.trim()) {
      setArcoError('Completa todos los campos obligatorios para radicar tu solicitud ARCO.');
      return;
    }

    const created = legalConsentService.submitArcoRequest({
      tipo: arcoTipo,
      nombreCompleto: arcoNombre,
      tipoDocumento: arcoTipoDoc,
      numeroDocumento: arcoNumDoc,
      email: arcoEmail,
      telefono: arcoTelefono || undefined,
      descripcion: arcoDesc,
    });

    setArcoRequests(legalConsentService.getArcoRequests());
    setArcoResult(created);
    setArcoNumDoc('');
    setArcoDesc('');
  };

  const handleExportData = () => {
    const blob = new Blob([legalConsentService.exportLegalData()], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dbacademy-datos-legales-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleSaveCookies = (nextPrefs: Partial<CookiePreferences>) => {
    const saved = legalConsentService.saveCookiePreferences(nextPrefs);
    setCookiePrefs(saved);
    setCookieSavedMsg('Preferencias de cookies actualizadas y registradas correctamente.');
    window.setTimeout(() => setCookieSavedMsg(''), 3500);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRepError('');
    setRepSaved(null);

    if (!repNombre.trim() || !repEmail.trim() || !repUrl.trim() || !repDesc.trim()) {
      setRepError('Completa todos los campos requeridos para radicar el reporte.');
      return;
    }

    const created = legalConsentService.submitContentReport({
      nombreReportante: repNombre,
      email: repEmail,
      tipoInfraccion: repTipo,
      urlOModulo: repUrl,
      descripcion: repDesc,
    });

    setReports(legalConsentService.getContentReports());
    setRepSaved(created);
    setRepUrl('');
    setRepDesc('');
  };

  const tabs: Array<{ id: LegalTab; label: string; icon: React.ReactNode }> = [
    { id: 'docs', label: 'Documentos Legales', icon: <FileText className="w-4 h-4" /> },
    { id: 'arco', label: 'Derechos ARCO (Ley 172-13)', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'cookies', label: 'Cookies y Privacidad', icon: <Cookie className="w-4 h-4" /> },
    { id: 'takedown', label: 'Retiro / Propiedad Intelectual', icon: <Flag className="w-4 h-4" /> },
    { id: 'consents', label: `Bitácora (${consents.length})`, icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <Scale className="w-8 h-8 text-blue-600 shrink-0" />
          Centro Legal y Cumplimiento (RD)
        </h1>
        <p className="text-sm 2xl:text-base text-slate-600 dark:text-slate-300">
          Marco normativo de República Dominicana: Ley 172-13 (Protección de Datos), Ley 358-05 (Consumidor), Ley 126-02 (Comercio Electrónico), Ley 310-14 (Mensajes Comerciales), Ley 65-00 (Derecho de Autor) y Ley 53-07 (Delitos de Alta Tecnología).
        </p>
      </div>

      {/* Aviso de revisión profesional */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-900 dark:text-amber-200 flex gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Aviso de rigor legal</p>
          <p>
            Estos textos y flujos constituyen una implementación técnico-legal basada en la normativa dominicana vigente, pero <strong>no sustituyen asesoría legal personalizada</strong>. Antes del lanzamiento comercial o litigio, valida los datos societarios (RNC, domicilio) y cláusulas con un abogado dominicano colegiado y tu contador (Ley 32-23 e-CF).
          </p>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[40px] ${
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DOCUMENTOS LEGALES + ACEPTACIÓN CON EVIDENCIA */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DOCS.map((doc) => {
              const meta = doc.docType ? CURRENT_DOC_VERSIONS[doc.docType] : null;
              return (
                <a
                  key={doc.file}
                  href={legalDocumentPath(doc.docType ?? 'auditoria', { from: 'legal' })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 hover:border-blue-400 dark:hover:border-blue-600 transition-colors flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {meta ? `v${meta.version}` : 'Auditoría'}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {doc.title}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      {doc.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                    <span>{doc.lawRef}</span>
                    <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                      Leer <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Módulo de Aceptación Expresa (Ley 126-02) */}
          <form
            onSubmit={handleRecordAcceptance}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                Registro de Consentimiento Informado (Ley 126-02 y Ley 172-13)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Registra tu aceptación expresa de las versiones vigentes con sello de tiempo, hash documental y agente de usuario. Las casillas nunca están premarcadas.
            </p>

            <div className="space-y-3">
              <label className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptDocsChecked}
                  onChange={(e) => setAcceptDocsChecked(e.target.checked)}
                  className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  He leído y acepto expresamente los{' '}
                  <a href={legalDocumentPath('terminos', { from: 'legal' })} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 dark:text-blue-400">
                    Términos y Condiciones ({CURRENT_DOC_VERSIONS.terminos.version})
                  </a>
                  , la{' '}
                  <a href={legalDocumentPath('privacidad', { from: 'legal' })} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 dark:text-blue-400">
                    Política de Privacidad ({CURRENT_DOC_VERSIONS.privacidad.version})
                  </a>{' '}
                  y la{' '}
                  <a href={legalDocumentPath('reembolsos', { from: 'legal' })} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 dark:text-blue-400">
                    Política de Cancelación y Reembolsos
                  </a>
                  .
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                  className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  (Opcional) Autorizo recibir comunicaciones educativas y promocionales identificadas como &ldquo;Publicidad&rdquo; conforme a la Ley 310-14, pudiendo darme de baja en cualquier momento.
                </span>
              </label>
            </div>

            {consentSavedBanner && (
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{consentSavedBanner}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!acceptDocsChecked}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium min-h-[40px]"
              >
                <ShieldCheck className="w-4 h-4" />
                Registrar aceptación electrónica
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: DERECHOS ARCO */}
      {activeTab === 'arco' && (
        <div className="grid gap-6 lg:grid-cols-5">
          <form
            onSubmit={handleArcoSubmit}
            className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4"
          >
            <div>
              <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                Radicar Solicitud de Derechos ARCO
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                Ejerce gratuitamente tus derechos constitucionales (Art. 44) y de la Ley 172-13 de Acceso, Rectificación, Cancelación u Oposición. También puedes escribir a <code>privacidad@dbacademy.edu.do</code>.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                Tipo de derecho *
                <select
                  value={arcoTipo}
                  onChange={(e) => setArcoTipo(e.target.value as ArcoRequestType)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value="acceso">Acceso (copia de datos)</option>
                  <option value="rectificacion">Rectificación (corregir datos)</option>
                  <option value="cancelacion">Cancelación / Supresión</option>
                  <option value="oposicion">Oposición al tratamiento</option>
                </select>
              </label>

              <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                Nombre completo del titular *
                <input
                  type="text"
                  value={arcoNombre}
                  onChange={(e) => setArcoNombre(e.target.value)}
                  placeholder="Ej. María Rodríguez"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                />
              </label>

              <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                Tipo de documento *
                <select
                  value={arcoTipoDoc}
                  onChange={(e) => setArcoTipoDoc(e.target.value as 'cedula' | 'pasaporte' | 'rnc')}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value="cedula">Cédula de Identidad</option>
                  <option value="pasaporte">Pasaporte</option>
                  <option value="rnc">RNC</option>
                </select>
              </label>

              <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                Número de documento *
                <input
                  type="text"
                  value={arcoNumDoc}
                  onChange={(e) => setArcoNumDoc(e.target.value)}
                  placeholder="001-0000000-0"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                />
              </label>

              <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                Correo electrónico de respuesta *
                <input
                  type="email"
                  value={arcoEmail}
                  onChange={(e) => setArcoEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                />
              </label>

              <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                Teléfono (opcional)
                <input
                  type="tel"
                  value={arcoTelefono}
                  onChange={(e) => setArcoTelefono(e.target.value)}
                  placeholder="809-000-0000"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                />
              </label>
            </div>

            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
              Descripción clara de la solicitud *
              <textarea
                rows={3}
                value={arcoDesc}
                onChange={(e) => setArcoDesc(e.target.value)}
                placeholder="Indica qué datos deseas consultar, corregir, suprimir o limitar..."
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </label>

            {arcoError && (
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{arcoError}</p>
            )}

            {arcoResult && (
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Solicitud radicada: {arcoResult.radicado}
                </p>
                <p>Fecha límite estimada de respuesta: <strong>{arcoResult.fechaLimiteRespuesta}</strong>.</p>
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium min-h-[40px]"
            >
              <Send className="w-4 h-4" />
              Enviar solicitud ARCO
            </button>
          </form>

          {/* Historial de radicados */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Solicitudes registradas ({arcoRequests.length})
            </h3>
            <button
              type="button"
              onClick={handleExportData}
              className="inline-flex items-center gap-2 w-full justify-center px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px]"
            >
              <Download className="w-4 h-4" />
              Exportar mis datos (JSON)
            </button>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Incluye consentimientos, solicitudes, preferencias y reportes de este dispositivo. El expediente académico completo se entrega por el canal ARCO.
            </p>
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {arcoRequests.map((req) => (
                <div
                  key={req.radicado}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-1.5 bg-slate-50/70 dark:bg-slate-900/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {req.radicado}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 capitalize">
                      {req.estado.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="font-medium text-slate-900 dark:text-slate-100 uppercase text-[11px]">
                    {req.tipo} · {req.nombreCompleto}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{req.descripcion}</p>
                  <p className="text-[11px] text-slate-500">
                    Radicada: {req.fechaRadicacion.split('T')[0]} · Límite: {req.fechaLimiteRespuesta}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COOKIES */}
      {activeTab === 'cookies' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-5">
          <div>
            <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
              Gestión Granular de Cookies y Almacenamiento Local
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Controla qué tecnologías no esenciales autorizas en tu navegador. Las cookies estrictamente necesarias permanecen activas para seguridad y sesión.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-900/40">
              <div>
                <p className="font-medium text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" /> Estrictamente necesarias
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Autenticación, seguridad, preferencia de tema y funcionamiento esencial del LMS.
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full shrink-0">
                Siempre activas
              </span>
            </div>

            <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 dark:border-slate-800 p-4 cursor-pointer">
              <div>
                <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                  Funcionales y personalización
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Recordar idioma, progreso local y configuraciones de interfaz.
                </p>
              </div>
              <input
                type="checkbox"
                checked={cookiePrefs.functionalPersonalization}
                onChange={(e) =>
                  setCookiePrefs((prev) => ({
                    ...prev,
                    functionalPersonalization: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 dark:border-slate-800 p-4 cursor-pointer">
              <div>
                <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                  Rendimiento y analítica
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Métricas agregadas de uso y diagnóstico de rendimiento (desactivadas por defecto).
                </p>
              </div>
              <input
                type="checkbox"
                checked={cookiePrefs.performanceAnalytics}
                onChange={(e) =>
                  setCookiePrefs((prev) => ({
                    ...prev,
                    performanceAnalytics: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 dark:border-slate-800 p-4 cursor-pointer">
              <div>
                <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                  Marketing y comunicaciones comerciales
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Medición de campañas (desactivadas por defecto; sujetas a Ley 310-14 y Ley 172-13).
                </p>
              </div>
              <input
                type="checkbox"
                checked={cookiePrefs.marketingCookies}
                onChange={(e) =>
                  setCookiePrefs((prev) => ({
                    ...prev,
                    marketingCookies: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
            </label>
          </div>

          {cookieSavedMsg && (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{cookieSavedMsg}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500">
              Última actualización: {new Date(cookiePrefs.updatedAt).toLocaleString('es-DO')} · Versión {cookiePrefs.version}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  handleSaveCookies({
                    functionalPersonalization: false,
                    performanceAnalytics: false,
                    marketingCookies: false,
                  })
                }
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px]"
              >
                Solo necesarias
              </button>
              <button
                type="button"
                onClick={() => handleSaveCookies(cookiePrefs)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium min-h-[40px]"
              >
                Guardar preferencias
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REPORTE DE CONTENIDO / TAKEDOWN */}
      {activeTab === 'takedown' && (
        <div className="grid gap-6 lg:grid-cols-5">
          <form
            onSubmit={handleReportSubmit}
            className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4"
          >
            <div>
              <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                Reporte de Infracción o Retiro de Contenido
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                Canal formal para notificar presuntas infracciones de derecho de autor (Ley 65-00), contenido ilícito o suplantación (Ley 53-07).
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                Nombre del reportante *
                <input
                  type="text"
                  value={repNombre}
                  onChange={(e) => setRepNombre(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                />
              </label>

              <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                Correo electrónico *
                <input
                  type="email"
                  value={repEmail}
                  onChange={(e) => setRepEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                />
              </label>

              <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                Tipo de infracción *
                <select
                  value={repTipo}
                  onChange={(e) =>
                    setRepTipo(e.target.value as ContentReportRecord['tipoInfraccion'])
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value="derechos_autor">Derechos de autor (Ley 65-00)</option>
                  <option value="contenido_ilicitio">Contenido ilícito / abuso</option>
                  <option value="suplantacion">Suplantación de identidad</option>
                  <option value="otro">Otro motivo legal</option>
                </select>
              </label>

              <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                URL o módulo afectado *
                <input
                  type="text"
                  value={repUrl}
                  onChange={(e) => setRepUrl(e.target.value)}
                  placeholder="Ej. Foro / Curso / Lección"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                />
              </label>
            </div>

            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
              Sustento y descripción *
              <textarea
                rows={3}
                value={repDesc}
                onChange={(e) => setRepDesc(e.target.value)}
                placeholder="Describe el contenido reportado y el fundamento del reclamo..."
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </label>

            {repError && (
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{repError}</p>
            )}

            {repSaved && (
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs sm:text-sm text-emerald-800 dark:text-emerald-200">
                Reporte registrado con ID <strong>{repSaved.id}</strong> en estado <strong>{repSaved.estado}</strong>.
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium min-h-[40px]"
            >
              <Flag className="w-4 h-4" />
              Enviar reporte
            </button>
          </form>

          <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Reportes registrados ({reports.length})
            </h3>
            {reports.length === 0 ? (
              <p className="text-xs text-slate-500">No hay reportes de retiro registrados en este navegador.</p>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-1 bg-slate-50/70 dark:bg-slate-900/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {rep.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200">
                        {rep.estado}
                      </span>
                    </div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{rep.urlOModulo}</p>
                    <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{rep.descripcion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: BITÁCORA DE CONSENTIMIENTOS */}
      {activeTab === 'consents' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
              Bitácora de Consentimientos Electrónicos
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Evidencia técnica de aceptaciones registradas (documento, versión, hash, fecha/hora ISO, agente de usuario y opt-in comercial).
            </p>
          </div>

          {consents.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no se han registrado aceptaciones en este dispositivo. Puedes registrar una desde la pestaña &ldquo;Documentos Legales&rdquo; o al realizar un checkout.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2 pr-3">Documento</th>
                    <th className="py-2 pr-3">Versión / Hash</th>
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Marketing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {consents.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 pr-3 font-mono text-slate-700 dark:text-slate-200">
                        {item.id}
                      </td>
                      <td className="py-2.5 pr-3 font-medium text-slate-900 dark:text-slate-100">
                        {CURRENT_DOC_VERSIONS[item.docType]?.title || item.docType}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-slate-600 dark:text-slate-300">
                        {item.docVersion} · {item.docHash}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">
                        {new Date(item.acceptedAt).toLocaleString('es-DO')}
                      </td>
                      <td className="py-2.5 pr-3">
                        {item.marketingOptIn ? 'Sí (Ley 310-14)' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

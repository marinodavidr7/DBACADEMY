import React, { useState } from 'react';
import { Code2, Copy, FileDown, FileSpreadsheet, Key, Play, Trash2, Webhook } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { exportTableToPdf, exportToCsv } from '../utils/export';
import { AuthGateNotice } from './AuthGateNotice';

export const ApiIntegrationsView: React.FC = () => {
  const {
    user,
    apiKeys,
    enrollments,
    payments,
    certificates,
    createApiKey,
    toggleApiKey,
    deleteApiKey,
    t,
  } = usePlatform();

  const [label, setLabel] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [newRawKey, setNewRawKey] = useState('');
  const [apiResponse, setApiResponse] = useState('');
  const [testingWebhook, setTestingWebhook] = useState(false);

  if (!user) return <AuthGateNotice />;

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    const { rawKey } = await createApiKey(label, webhookUrl);
    setNewRawKey(rawKey);
    setLabel('');
    setWebhookUrl('');
  };

  const handleTestEndpoint = async (endpoint: string) => {
    const res = await fetch(endpoint);
    const json = await res.json();
    setApiResponse(JSON.stringify(json, null, 2));
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    try {
      const activeWebhook = apiKeys.find((k) => k.active && k.webhookUrl)?.webhookUrl || '';
      const res = await fetch('/api/v1/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: user.uid,
          event: 'certificate.issued',
          webhookUrl: activeWebhook,
        }),
      });
      const json = await res.json();
      setApiResponse(JSON.stringify(json, null, 2));
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleExportAllCsv = () => {
    exportToCsv(
      'db-academy-resumen-cuenta',
      ['Tipo', 'Referencia / Curso', 'Detalle', 'Estado'],
      [
        ...enrollments.map((e) => ['Inscripción', e.courseTitle, `${e.progressPercent}%`, e.status]),
        ...payments.map((p) => ['Pago', p.courseTitle, `${(p.amountCents / 100).toFixed(2)} ${p.currency}`, p.gateway]),
        ...certificates.map((c) => ['Certificado', c.courseTitle, c.verificationCode, '100%']),
      ]
    );
  };

  const handleExportAllPdf = () => {
    exportTableToPdf(
      'db-academy-resumen-cuenta',
      t('integrationsTitle'),
      `Cuenta: ${user.displayName || user.email}`,
      ['Tipo', 'Curso', 'Detalle', 'Estado'],
      [
        ...enrollments.map((e) => ['Inscripción', e.courseTitle, `${e.progressPercent}%`, e.status]),
        ...payments.map((p) => ['Pago', p.courseTitle, `${(p.amountCents / 100).toFixed(2)} ${p.currency}`, p.gateway]),
        ...certificates.map((c) => ['Certificado', c.courseTitle, c.verificationCode, 'Emitido']),
      ]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('integrationsTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            REST API v1 · HMAC-SHA256 Webhooks · Exportación CSV y PDF
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportAllCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{t('exportCsv')}</span>
          </button>
          <button
            type="button"
            onClick={handleExportAllPdf}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{t('exportPdf')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: API Key Manager */}
        <div className="lg:col-span-6 space-y-5">
          <form
            onSubmit={(e) => void handleGenerateKey(e)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {t('generateApiKey')}
              </h2>
              <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <input
              type="text"
              required
              minLength={2}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nombre de integración (ej. Zapier / ERP)"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="Webhook URL opcional (https://...)"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-medium text-white hover:bg-blue-700 min-h-[42px]"
            >
              {t('generateApiKey')}
            </button>

            {newRawKey && (
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-3 space-y-1">
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  Copia tu clave ahora (solo almacenamos el hash SHA-256):
                </p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono text-slate-900 dark:text-slate-100 break-all">
                    {newRawKey}
                  </code>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(newRawKey)}
                    className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-white/60"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] divide-y divide-slate-100 dark:divide-slate-800">
            {apiKeys.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Sin claves API configuradas.
              </div>
            ) : (
              apiKeys.map((k) => (
                <div key={k.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{k.label}</p>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {k.keyPrefix}•••••••• {k.webhookUrl ? `· ${k.webhookUrl}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void toggleApiKey(k)}
                      className={`text-xs font-medium px-2.5 py-1 rounded border ${
                        k.active
                          ? 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                          : 'border-slate-300 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {k.active ? 'Activa' : 'Pausada'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteApiKey(k.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Live Endpoint & Webhook Tester */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Explorador de API REST y Webhooks
            </h2>
            <Code2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleTestEndpoint('/api/v1/health')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Play className="w-3 h-3 text-blue-600" />
              <span>GET /api/v1/health</span>
            </button>
            <button
              type="button"
              onClick={() => void handleTestEndpoint('/api/v1/openapi.json')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Play className="w-3 h-3 text-blue-600" />
              <span>GET /api/v1/openapi.json</span>
            </button>
            <button
              type="button"
              onClick={() => void handleTestEndpoint('/api/v1/payments/lemonsqueezy/status')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Play className="w-3 h-3 text-violet-600" />
              <span>GET /api/v1/payments/lemonsqueezy/status</span>
            </button>
            <button
              type="button"
              disabled={testingWebhook}
              onClick={() => void handleTestWebhook()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3 py-2 text-xs font-medium text-white dark:text-slate-900 hover:opacity-90"
            >
              <Webhook className="w-3.5 h-3.5" />
              <span>{t('testWebhook')}</span>
            </button>
          </div>

          <pre className="rounded-lg bg-slate-950 text-slate-100 p-4 text-xs font-mono overflow-x-auto max-h-80 leading-relaxed">
            {apiResponse || '// Ejecuta un endpoint o prueba de webhook para inspeccionar la respuesta JSON y la firma HMAC-SHA256.'}
          </pre>
        </div>
      </div>
    </div>
  );
};

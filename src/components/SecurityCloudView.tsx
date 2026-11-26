import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Cloud,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mic,
  MicOff,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { useSpeechDictation } from '../hooks/useSpeechDictation';
import type { CloudProvider } from '../types';
import {
  decryptTextE2EE,
  exportVaultKeyJson,
  importVaultKeyJson,
  rotateVaultKeyFromPassphrase,
} from '../utils/crypto';
import { AuthGateNotice } from './AuthGateNotice';

export const SecurityCloudView: React.FC = () => {
  const {
    user,
    language,
    privateInfo,
    encryptedNotes,
    e2eeFingerprint,
    saveEncryptedNote,
    deleteEncryptedNote,
    syncCloudBackup,
    refreshVaultFingerprint,
    t,
  } = usePlatform();

  const [noteTitle, setNoteTitle] = useState('');
  const [notePlaintext, setNotePlaintext] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [decryptedMap, setDecryptedMap] = useState<Record<string, string>>({});
  const [showCiphertextMap, setShowCiphertextMap] = useState<Record<string, boolean>>({});

  const appendDictatedReflection = useCallback((transcript: string) => {
    setNotePlaintext((prev) => {
      if (!prev.trim()) return transcript;
      const needsSpace = !/[\s\n]$/.test(prev);
      return `${prev}${needsSpace ? ' ' : ''}${transcript}`;
    });
  }, []);

  const {
    isSupported: speechSupported,
    isListening: isDictating,
    interimTranscript,
    error: speechError,
    speechLang,
    setSpeechLang,
    stop: stopDictation,
    toggle: toggleDictation,
    clearError: clearSpeechError,
  } = useSpeechDictation({
    initialLang: language === 'en' ? 'en-US' : 'es-DO',
    onFinalTranscript: appendDictatedReflection,
  });

  const [passphrase, setPassphrase] = useState('');
  const [exportedKey, setExportedKey] = useState('');
  const [importKeyText, setImportKeyText] = useState('');

  const [provider, setProvider] = useState<CloudProvider>(privateInfo?.cloudProvider || 'google_drive');
  const [folder, setFolder] = useState(privateInfo?.cloudFolder || '/Catedra-Backups');
  const [autoBackup, setAutoBackup] = useState(privateInfo?.cloudAutoBackup ?? true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ checksumSha256: string; syncedAt: string; bytes: number } | null>(null);

  useEffect(() => {
    if (privateInfo) {
      if (privateInfo.cloudProvider && privateInfo.cloudProvider !== 'none') {
        setProvider(privateInfo.cloudProvider);
      }
      if (privateInfo.cloudFolder) setFolder(privateInfo.cloudFolder);
      setAutoBackup(Boolean(privateInfo.cloudAutoBackup));
    }
  }, [privateInfo]);

  useEffect(() => {
    let cancelled = false;
    const decryptAll = async () => {
      const next: Record<string, string> = {};
      for (const note of encryptedNotes) {
        try {
          next[note.id] = await decryptTextE2EE(note.ciphertext, note.iv);
        } catch {
          next[note.id] = '[Clave distinta — importa la clave original para descifrar]';
        }
      }
      if (!cancelled) setDecryptedMap(next);
    };
    void decryptAll();
    return () => {
      cancelled = true;
    };
  }, [encryptedNotes, e2eeFingerprint]);

  if (!user) return <AuthGateNotice />;

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !notePlaintext.trim()) return;
    if (isDictating) {
      stopDictation();
    }
    setSavingNote(true);
    try {
      await saveEncryptedNote(noteTitle, notePlaintext);
      setNoteTitle('');
      setNotePlaintext('');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeriveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase.trim().length < 6) return;
    await rotateVaultKeyFromPassphrase(passphrase.trim());
    await refreshVaultFingerprint();
    setPassphrase('');
  };

  const handleExportKey = async () => {
    const json = await exportVaultKeyJson();
    setExportedKey(json);
  };

  const handleImportKey = async () => {
    if (!importKeyText.trim()) return;
    await importVaultKeyJson(importKeyText.trim());
    await refreshVaultFingerprint();
    setImportKeyText('');
  };

  const handleCloudSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    try {
      const res = await syncCloudBackup(provider, folder, autoBackup);
      setSyncResult(res);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t('securityTitle')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('e2eeStatus')} · Huella de clave: <span className="font-mono">{e2eeFingerprint}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: E2EE Notes Vault */}
        <div className="lg:col-span-7 space-y-5">
          <form
            onSubmit={(e) => void handleSaveNote(e)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {t('newEncryptedNote')}
              </h2>
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <input
              type="text"
              required
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Título de referencia (ej. Apuntes privados Módulo 2)"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
            <textarea
              rows={4}
              required
              value={notePlaintext}
              onChange={(e) => setNotePlaintext(e.target.value)}
              placeholder="Escribe o dicta por voz tus reflexiones de aprendizaje. Este contenido se cifrará con AES-GCM-256 antes de guardarse..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100"
            />

            {isDictating && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/25 px-3 py-2 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2"
              >
                <span className="mt-1 h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="font-semibold">Escuchando dictado...</span>{' '}
                  <span className="italic text-rose-700 dark:text-rose-300">
                    {interimTranscript || 'Habla naturalmente para transcribir tu reflexión.'}
                  </span>
                </div>
              </div>
            )}

            {speechError && (
              <div
                role="alert"
                className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{speechError}</span>
                </span>
                <button
                  type="button"
                  onClick={clearSpeechError}
                  aria-label="Cerrar aviso de micrófono"
                  className="p-1 rounded hover:bg-amber-200/50 dark:hover:bg-amber-900/40"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={toggleDictation}
                  disabled={!speechSupported || savingNote}
                  aria-pressed={isDictating}
                  title={
                    speechSupported
                      ? isDictating
                        ? 'Detener dictado por voz'
                        : 'Dictar reflexión con el micrófono (Web Speech API)'
                      : 'Dictado por voz no disponible en este navegador'
                  }
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium min-h-[40px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDictating
                      ? 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {isDictating ? (
                    <>
                      <MicOff className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>Detener dictado</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Dictar por voz</span>
                    </>
                  )}
                </button>

                {speechSupported && (
                  <select
                    value={speechLang}
                    disabled={isDictating}
                    onChange={(e) => setSpeechLang(e.target.value)}
                    aria-label="Idioma de dictado por voz"
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs text-slate-700 dark:text-slate-200 min-h-[40px] disabled:opacity-60"
                  >
                    <option value="es-DO">Español (RD)</option>
                    <option value="es-ES">Español (ES)</option>
                    <option value="es-MX">Español (MX)</option>
                    <option value="en-US">English (US)</option>
                  </select>
                )}
              </div>

              <button
                type="submit"
                disabled={savingNote}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 min-h-[40px]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t('saveEncrypted')}</span>
              </button>
            </div>
          </form>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] divide-y divide-slate-100 dark:divide-slate-800">
            {encryptedNotes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No tienes notas cifradas aún. Crea la primera arriba para verificar el cifrado de extremo a extremo.
              </div>
            ) : (
              encryptedNotes.map((note) => {
                const showRaw = Boolean(showCiphertextMap[note.id]);
                return (
                  <div key={note.id} className="p-5 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {note.titleHint}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {note.algorithm} · Key {note.keyFingerprint}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setShowCiphertextMap((prev) => ({ ...prev, [note.id]: !prev[note.id] }))
                          }
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                          title="Ver texto cifrado en Firestore"
                        >
                          {showRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteEncryptedNote(note.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {showRaw ? (
                      <div className="rounded-lg bg-slate-950 text-emerald-400 p-3 font-mono text-[11px] break-all">
                        <div>IV: {note.iv}</div>
                        <div className="mt-1">CIPHERTEXT: {note.ciphertext}</div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                        {decryptedMap[note.id] || '...'}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: E2EE Key Management & Cloud Storage Sync */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {t('cloudSyncTitle')}
              </h2>
              <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>

            <form onSubmit={(e) => void handleCloudSync(e)} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Proveedor de almacenamiento
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as CloudProvider)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                >
                  <option value="google_drive">Google Drive</option>
                  <option value="dropbox">Dropbox</option>
                  <option value="aws_s3">Amazon S3</option>
                  <option value="gcs">Google Cloud Storage</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Carpeta / Bucket destino
                </label>
                <input
                  type="text"
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
              <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 py-1">
                <span>Respaldo automático cifrado</span>
                <input
                  type="checkbox"
                  checked={autoBackup}
                  onChange={(e) => setAutoBackup(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
              </label>

              <button
                type="submit"
                disabled={syncing}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-slate-100 px-4 py-2.5 text-xs font-medium text-white dark:text-slate-900 hover:opacity-90 min-h-[42px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{t('syncCloudNow')}</span>
              </button>
            </form>

            {(syncResult || privateInfo?.cloudLastSyncedAt) && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3 text-xs space-y-1">
                <p className="font-medium text-emerald-600 dark:text-emerald-400">
                  Última sincronización: {syncResult?.syncedAt || privateInfo?.cloudLastSyncedAt}
                </p>
                {syncResult && (
                  <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 break-all">
                    SHA-256: {syncResult.checksumSha256} ({syncResult.bytes} B)
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Gestión de claves E2EE (PBKDF2 / JWK)
              </h2>
              <KeyRound className="w-4 h-4 text-slate-400" />
            </div>

            <form onSubmit={(e) => void handleDeriveKey(e)} className="flex gap-2">
              <input
                type="password"
                minLength={6}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Frase secreta (min 6 caracteres)"
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Derivar
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => void handleExportKey()}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Exportar clave de recuperación JWK
              </button>
              {exportedKey && (
                <textarea
                  readOnly
                  rows={3}
                  value={exportedKey}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2 font-mono text-[11px] text-slate-700 dark:text-slate-300"
                />
              )}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={importKeyText}
                  onChange={(e) => setImportKeyText(e.target.value)}
                  placeholder="Pegar JWK para restaurar en otro dispositivo"
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => void handleImportKey()}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
                >
                  Importar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

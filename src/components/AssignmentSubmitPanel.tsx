import React, { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
  MessageSquare,
  Download,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import type { LessonAssignmentConfig, AssignmentSubmission } from '../types';

interface Props {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  config: LessonAssignmentConfig;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: AssignmentSubmission['status'] }) {
  if (status === 'submitted')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
        <Clock className="w-3 h-3" /> Enviada · En revisión
      </span>
    );
  if (status === 'graded')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
        <CheckCircle className="w-3 h-3" /> Calificada
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
      <AlertTriangle className="w-3 h-3" /> Reenvío solicitado
    </span>
  );
}

export function AssignmentSubmitPanel({ courseId, lessonId, lessonTitle, config }: Props) {
  const { user, assignmentSubmissions, submitAssignment } = usePlatform();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Find the latest submission for this lesson by this student
  const mySubmissions = assignmentSubmissions
    .filter((s) => s.courseId === courseId && s.lessonId === lessonId && s.studentId === (user?.uid ?? ''))
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  const latest = mySubmissions[0] ?? null;

  const canSubmit = !latest || latest.status === 'resubmit_requested';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setSelectedFile(f);
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Selecciona un archivo antes de enviar.');
      return;
    }
    setError(null);
    setUploading(true);
    setProgress(10);

    // Simulate progress ticks while uploading
    const ticker = setInterval(() => {
      setProgress((p) => Math.min(p + 15, 85));
    }, 400);

    try {
      await submitAssignment(courseId, lessonId, selectedFile, comment);
      clearInterval(ticker);
      setProgress(100);
      setSuccess(true);
      setSelectedFile(null);
      setComment('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      clearInterval(ticker);
      setError(err instanceof Error ? err.message : 'Error al subir la tarea. Intenta de nuevo.');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1200);
    }
  };

  const accept = config.allowedFileTypes ?? '.xlsx,.pdf,.docx,.zip';

  return (
    <div className="mt-6 rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-indigo-500/20">
          <FileText className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-sm">
            📋 Tarea: {config.title || lessonTitle}
          </h3>
          {config.instructions && (
            <p className="mt-1 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {config.instructions}
            </p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
            {config.dueDate && (
              <span>
                📅 Entrega límite:{' '}
                <span className="text-slate-200">
                  {new Date(config.dueDate).toLocaleString('es-DO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </span>
            )}
            <span>
              🏆 Puntuación máx:{' '}
              <span className="text-slate-200">{config.maxScore ?? 100} pts</span>
            </span>
            <span>
              📎 Formatos:{' '}
              <span className="text-slate-200">{accept}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Latest submission status */}
      {latest && (
        <div className="rounded-lg bg-slate-800/60 p-4 space-y-2 border border-slate-700/50">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <StatusBadge status={latest.status} />
            <span className="text-xs text-slate-400">
              Enviado el{' '}
              {new Date(latest.submittedAt).toLocaleString('es-DO', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <a
              href={latest.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline flex items-center gap-1"
            >
              {latest.fileName}
              <Download className="w-3 h-3" />
            </a>
            <span className="text-slate-500">({formatBytes(latest.fileSize)})</span>
          </div>

          {latest.comment && (
            <p className="text-xs text-slate-400 italic">
              💬 Tu comentario: "{latest.comment}"
            </p>
          )}

          {/* Graded result */}
          {latest.status === 'graded' && latest.grade !== undefined && (
            <div className="mt-3 rounded-lg bg-green-900/30 border border-green-500/30 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-white">
                  Nota: {latest.grade} / {latest.maxScore} pts
                  <span className="ml-2 text-xs text-slate-400 font-normal">
                    ({Math.round((latest.grade / (latest.maxScore || 100)) * 100)}%)
                  </span>
                </span>
              </div>
              {latest.feedback && (
                <div className="flex items-start gap-2 mt-1">
                  <MessageSquare className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-300">{latest.feedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Resubmit requested */}
          {latest.status === 'resubmit_requested' && (
            <div className="mt-2 rounded-lg bg-amber-900/30 border border-amber-500/30 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-300">
                  El maestro solicitó que corrijas y vuelvas a entregar
                </span>
              </div>
              {latest.feedback && (
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-300">{latest.feedback}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upload form */}
      {canSubmit && (
        <div className="space-y-3">
          {/* File picker */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-indigo-500/40 hover:border-indigo-400/70 bg-indigo-950/20 hover:bg-indigo-950/40 cursor-pointer transition-all py-6 px-4"
          >
            <Upload className="w-6 h-6 text-indigo-400" />
            {selectedFile ? (
              <div className="text-center">
                <p className="text-sm text-white font-medium">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(selectedFile.size)}</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-slate-300">
                  Haz clic para seleccionar tu archivo
                </p>
                <p className="text-xs text-slate-500">Formatos: {accept}</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Comment */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comentario opcional para el maestro..."
            rows={2}
            className="w-full text-sm bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />

          {/* Progress bar */}
          {uploading && (
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {error}
            </p>
          )}

          {/* Success */}
          {success && (
            <p className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> ¡Tarea enviada correctamente! El maestro la revisará pronto.
            </p>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={uploading || !selectedFile}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            {uploading ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {latest?.status === 'resubmit_requested' ? 'Reenviar Tarea' : 'Entregar Tarea'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Waiting state — submitted and not yet graded */}
      {latest && latest.status === 'submitted' && (
        <p className="text-xs text-slate-500 text-center">
          Tu entrega está bajo revisión. Te notificaremos cuando sea calificada.
        </p>
      )}
    </div>
  );
}

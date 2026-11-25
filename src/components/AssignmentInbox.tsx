import React, { useState } from 'react';
import {
  Inbox,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Star,
  MessageSquare,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { isPlaceholderCampusEmail } from '../firebase';
import type { AssignmentSubmission } from '../types';

type InboxTab = 'submitted' | 'graded' | 'resubmit_requested';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: AssignmentSubmission['status'] }) {
  if (status === 'submitted')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">
        <Clock className="w-3 h-3" /> Pendiente
      </span>
    );
  if (status === 'graded')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">
        <CheckCircle className="w-3 h-3" /> Calificada
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400">
      <AlertTriangle className="w-3 h-3" /> Reenvío solicitado
    </span>
  );
}

function SubmissionRow({
  sub,
  onGrade,
  onDelete,
}: {
  sub: AssignmentSubmission;
  onGrade: (id: string, grade: number, feedback: string, resubmit: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [grade, setGrade] = useState(sub.grade?.toString() ?? '');
  const [feedback, setFeedback] = useState(sub.feedback ?? '');
  const [resubmit, setResubmit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGrade = async () => {
    const g = parseFloat(grade);
    if (isNaN(g) || g < 0 || g > (sub.maxScore ?? 100)) {
      setError(`La nota debe ser entre 0 y ${sub.maxScore ?? 100}.`);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onGrade(sub.id, g, feedback, resubmit);
      setExpanded(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al calificar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar la entrega de ${sub.studentName}?`)) return;
    setDeleting(true);
    try {
      await onDelete(sub.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-800/40 overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="p-1.5 rounded-full bg-slate-700/60">
          <User className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{sub.studentName}</p>
          <p className="text-xs text-slate-400 truncate">
            {!isPlaceholderCampusEmail(sub.studentEmail) ? sub.studentEmail : 'Correo no sincronizado'}
          </p>
        </div>
        <div className="hidden sm:block text-xs text-slate-400 text-right">
          <p className="font-medium text-slate-300 truncate max-w-[140px]">{sub.lessonTitle}</p>
          <p className="truncate max-w-[140px]">{sub.courseTitle}</p>
        </div>
        <StatusBadge status={sub.status} />
        <span className="text-xs text-slate-500 hidden md:block whitespace-nowrap">
          {new Date(sub.submittedAt).toLocaleDateString('es-DO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-700/50 p-4 space-y-4 bg-slate-900/30">
          {/* File download */}
          <div className="flex items-center gap-2">
            <a
              href={sub.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              {sub.fileName}
              <span className="text-xs text-slate-500">({formatBytes(sub.fileSize)})</span>
            </a>
          </div>

          {/* Student comment */}
          {sub.comment && (
            <div className="text-xs text-slate-400 flex items-start gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{sub.comment}</span>
            </div>
          )}

          {/* Previous grade (if already graded) */}
          {sub.status === 'graded' && sub.grade !== undefined && (
            <div className="rounded-lg bg-green-900/20 border border-green-500/30 p-3 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-green-300 font-medium">
                <Star className="w-3.5 h-3.5 text-yellow-400" />
                Nota: {sub.grade} / {sub.maxScore} pts
              </div>
              {sub.feedback && <p className="text-slate-400">{sub.feedback}</p>}
            </div>
          )}

          {/* Grade form */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {sub.status === 'graded' ? 'Actualizar calificación' : 'Calificar entrega'}
            </p>

            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-400 whitespace-nowrap">
                Nota (0 – {sub.maxScore ?? 100})
              </label>
              <input
                type="number"
                min={0}
                max={sub.maxScore ?? 100}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-24 text-sm bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="0"
              />
            </div>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Retroalimentación para el estudiante..."
              rows={3}
              className="w-full text-sm bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />

            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={resubmit}
                onChange={(e) => setResubmit(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              Solicitar reenvío (el estudiante debe corregir y volver a entregar)
            </label>

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {error}
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleGrade}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {saving ? (
                  <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Star className="w-3.5 h-3.5" />
                )}
                {saving ? 'Guardando...' : 'Calificar'}
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm transition-colors"
              >
                {deleting ? (
                  <span className="animate-spin w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AssignmentInbox() {
  const { assignmentSubmissions, gradeAssignment, deleteSubmission } = usePlatform();
  const [activeTab, setActiveTab] = useState<InboxTab>('submitted');

  const tabs: { id: InboxTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'submitted',
      label: `Pendientes (${assignmentSubmissions.filter((s) => s.status === 'submitted').length})`,
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: 'graded',
      label: `Calificadas (${assignmentSubmissions.filter((s) => s.status === 'graded').length})`,
      icon: <CheckCircle className="w-4 h-4" />,
    },
    {
      id: 'resubmit_requested',
      label: `Reenvíos (${assignmentSubmissions.filter((s) => s.status === 'resubmit_requested').length})`,
      icon: <AlertTriangle className="w-4 h-4" />,
    },
  ];

  const filtered = assignmentSubmissions
    .filter((s) => s.status === activeTab)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-500/20">
          <Inbox className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Entregas de Tareas</h2>
          <p className="text-xs text-slate-400">
            {assignmentSubmissions.length} entrega{assignmentSubmissions.length !== 1 ? 's' : ''} en total
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">
              {tab.id === 'submitted' ? '⏳' : tab.id === 'graded' ? '✅' : '🔄'}
            </span>
          </button>
        ))}
      </div>

      {/* Submission list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay entregas en esta sección.</p>
          </div>
        ) : (
          filtered.map((sub) => (
            <SubmissionRow
              key={sub.id}
              sub={sub}
              onGrade={gradeAssignment}
              onDelete={deleteSubmission}
            />
          ))
        )}
      </div>
    </div>
  );
}

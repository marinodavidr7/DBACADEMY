import React from 'react';
import { GraduationCap, FileText, Clock, CheckCircle, AlertTriangle, Star, MessageSquare, Download } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import type { AssignmentSubmission } from '../types';

function StatusBadge({ status }: { status: AssignmentSubmission['status'] }) {
  if (status === 'submitted')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400 whitespace-nowrap">
        <Clock className="w-3 h-3" /> En revisión
      </span>
    );
  if (status === 'graded')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 whitespace-nowrap">
        <CheckCircle className="w-3 h-3" /> Calificada
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 whitespace-nowrap">
      <AlertTriangle className="w-3 h-3" /> Reenvío solicitado
    </span>
  );
}

function GradeBar({ grade, maxScore }: { grade: number; maxScore: number }) {
  const pct = Math.min(100, Math.round((grade / (maxScore || 100)) * 100));
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-700 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 whitespace-nowrap">{pct}%</span>
    </div>
  );
}

export function GradesPanel() {
  const { user, assignmentSubmissions } = usePlatform();

  const mySubmissions = assignmentSubmissions
    .filter((s) => s.studentId === (user?.uid ?? ''))
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const gradedCount = mySubmissions.filter((s) => s.status === 'graded').length;
  const avgScore =
    gradedCount > 0
      ? Math.round(
          mySubmissions
            .filter((s) => s.status === 'graded' && s.grade !== undefined)
            .reduce((acc, s) => acc + (s.grade! / (s.maxScore || 100)) * 100, 0) / gradedCount
        )
      : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-500/20">
          <GraduationCap className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Mis Notas</h2>
          <p className="text-xs text-slate-400">
            {mySubmissions.length} tarea{mySubmissions.length !== 1 ? 's' : ''} enviada
            {mySubmissions.length !== 1 ? 's' : ''}
            {avgScore !== null && ` · Promedio: ${avgScore}%`}
          </p>
        </div>
      </div>

      {/* Stats row */}
      {mySubmissions.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-3 text-center">
            <p className="text-2xl font-bold text-white">{mySubmissions.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">Total enviadas</p>
          </div>
          <div className="rounded-xl bg-green-900/20 border border-green-500/30 p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{gradedCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Calificadas</p>
          </div>
          <div className="rounded-xl bg-indigo-900/20 border border-indigo-500/30 p-3 text-center">
            <p className="text-2xl font-bold text-indigo-400">
              {avgScore !== null ? `${avgScore}%` : '—'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Promedio</p>
          </div>
        </div>
      )}

      {/* Submissions list */}
      {mySubmissions.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Todavía no has entregado ninguna tarea.</p>
          <p className="text-xs mt-1 text-slate-600">
            Las tareas aparecen en la pestaña "Teoría" de cada lección.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {mySubmissions.map((sub) => (
            <div
              key={sub.id}
              className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 space-y-3"
            >
              {/* Row 1: title + status */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-white">{sub.lessonTitle}</p>
                  <p className="text-xs text-slate-400">{sub.courseTitle}</p>
                </div>
                <StatusBadge status={sub.status} />
              </div>

              {/* Row 2: file + date */}
              <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                <a
                  href={sub.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-400 hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  {sub.fileName}
                </a>
                <span>
                  Enviada el{' '}
                  {new Date(sub.submittedAt).toLocaleDateString('es-DO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* Row 3: grade */}
              {sub.status === 'graded' && sub.grade !== undefined && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-bold text-white">
                      {sub.grade} / {sub.maxScore} pts
                    </span>
                  </div>
                  <GradeBar grade={sub.grade} maxScore={sub.maxScore ?? 100} />
                  {sub.feedback && (
                    <div className="flex items-start gap-1.5 mt-2">
                      <MessageSquare className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-300">{sub.feedback}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Row: resubmit */}
              {sub.status === 'resubmit_requested' && (
                <div className="rounded-lg bg-amber-900/20 border border-amber-500/30 p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    El maestro solicitó que corrijas y vuelvas a entregar
                  </div>
                  {sub.feedback && (
                    <p className="text-xs text-slate-400 pl-5">{sub.feedback}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

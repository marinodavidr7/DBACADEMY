import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  ListChecks,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import type { CourseModule, CourseQuizQuestion } from '../types';
import { migrateModuleQuiz } from '../utils/courseEditor';

interface ModuleQuizPanelProps {
  module: CourseModule;
  courseId: string;
  userId?: string;
  sectionTitle: string;
  onPassed: () => void;
}

interface StoredQuizProgress {
  answers: Record<string, number[]>;
  submitted: boolean;
  passed: boolean;
  score: number;
  total: number;
}

const QUIZ_STORAGE_PREFIX = 'dbacademy_mod_quiz_v2_';
const PASS_THRESHOLD = 0.7;

function loadQuizProgress(key: string): StoredQuizProgress | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredQuizProgress>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      answers: parsed.answers && typeof parsed.answers === 'object' ? parsed.answers : {},
      submitted: Boolean(parsed.submitted),
      passed: Boolean(parsed.passed),
      score: typeof parsed.score === 'number' ? parsed.score : 0,
      total: typeof parsed.total === 'number' ? parsed.total : 0,
    };
  } catch {
    return null;
  }
}

function saveQuizProgress(key: string, value: StoredQuizProgress) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

function isTrueFalseQuestion(q: CourseQuizQuestion): boolean {
  if (q.multiple || q.options.length !== 2) return false;
  const labels = q.options.map((o) => o.text.trim().toLowerCase());
  return (
    (labels.includes('verdadero') && labels.includes('falso')) ||
    (labels.includes('true') && labels.includes('false'))
  );
}

function getQuestionTypeLabel(q: CourseQuizQuestion): string {
  if (q.multiple) return 'Selección múltiple';
  if (isTrueFalseQuestion(q)) return 'Verdadero / Falso';
  return 'Selección única';
}

function isQuestionCorrect(q: CourseQuizQuestion, picked: number[] | undefined): boolean {
  const chosen = [...new Set(picked ?? [])].sort((a, b) => a - b);
  const expected = [...new Set(q.correctIndexes)].sort((a, b) => a - b);
  if (chosen.length === 0 || chosen.length !== expected.length) return false;
  return chosen.every((val, i) => val === expected[i]);
}

export const ModuleQuizPanel: React.FC<ModuleQuizPanelProps> = ({
  module,
  courseId,
  userId,
  sectionTitle,
  onPassed,
}) => {
  const normalizedModule = useMemo(() => migrateModuleQuiz(module), [module]);
  const questions = useMemo(
    () =>
      (normalizedModule.questions ?? []).filter(
        (q) => q.prompt.trim().length > 0 && q.options.length >= 2
      ),
    [normalizedModule]
  );

  const storageKey = `${QUIZ_STORAGE_PREFIX}${userId || 'anon'}_${courseId}_${module.id}`;

  const [answers, setAnswers] = useState<Record<string, number[]>>(() => {
    return loadQuizProgress(storageKey)?.answers ?? {};
  });
  const [submitted, setSubmitted] = useState<boolean>(() => {
    return loadQuizProgress(storageKey)?.submitted ?? false;
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'step' | 'all'>('step');

  useEffect(() => {
    const saved = loadQuizProgress(storageKey);
    setAnswers(saved?.answers ?? {});
    setSubmitted(saved?.submitted ?? false);
    setCurrentIdx(0);
  }, [storageKey]);

  const totalCount = questions.length;
  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id]?.length ?? 0) > 0).length,
    [questions, answers]
  );

  const correctCount = useMemo(
    () => questions.filter((q) => isQuestionCorrect(q, answers[q.id])).length,
    [questions, answers]
  );

  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const passed = totalCount > 0 && correctCount / totalCount >= PASS_THRESHOLD;
  const minToPass = Math.ceil(totalCount * PASS_THRESHOLD);

  useEffect(() => {
    if (questions.length === 0) return;
    saveQuizProgress(storageKey, {
      answers,
      submitted,
      passed: submitted ? passed : false,
      score: submitted ? correctCount : 0,
      total: totalCount,
    });
  }, [storageKey, answers, submitted, passed, correctCount, totalCount, questions.length]);

  if (normalizedModule.quizEnabled === false || questions.length === 0) {
    return null;
  }

  const safeIdx = Math.min(currentIdx, Math.max(0, questions.length - 1));
  const visibleQuestions = viewMode === 'all' ? questions : [questions[safeIdx]];

  const toggleOption = (question: CourseQuizQuestion, optIdx: number) => {
    if (submitted) return;
    setAnswers((prev) => {
      const current = prev[question.id] ?? [];
      if (question.multiple) {
        const exists = current.includes(optIdx);
        const next = exists ? current.filter((i) => i !== optIdx) : [...current, optIdx];
        return { ...prev, [question.id]: next };
      }
      return { ...prev, [question.id]: [optIdx] };
    });
  };

  const handleGrade = () => {
    setSubmitted(true);
    if (totalCount > 0 && correctCount / totalCount >= PASS_THRESHOLD) {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate(35);
        } catch {
          // Ignore vibrate restrictions
        }
      }
      onPassed();
    }
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setCurrentIdx(0);
    saveQuizProgress(storageKey, {
      answers: {},
      submitted: false,
      passed: false,
      score: 0,
      total: totalCount,
    });
  };

  return (
    <section
      aria-label={`Evaluación de ${module.title}`}
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 sm:p-5 space-y-4 min-w-0"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5 min-w-0">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:text-cyan-300">
              <ListChecks className="w-3.5 h-3.5 shrink-0" />
              <span>{totalCount} preguntas · Selección y V/F</span>
            </span>
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              Mínimo {minToPass}/{totalCount} (70%) para aprobar
            </span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug break-words">
            {sectionTitle} · {module.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('step')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors min-h-[36px] ${
                viewMode === 'step'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Paso a paso
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors min-h-[36px] ${
                viewMode === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ver todas ({totalCount})
            </button>
          </div>
        </div>
      </div>

      {/* Progress / Score Banner */}
      {submitted ? (
        <div
          className={`rounded-xl border p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            passed
              ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/35'
              : 'border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/35'
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            {passed ? (
              <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <HelpCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5 min-w-0">
              <p
                className={`text-sm font-bold ${
                  passed
                    ? 'text-emerald-900 dark:text-emerald-200'
                    : 'text-amber-900 dark:text-amber-200'
                }`}
              >
                {passed
                  ? `¡Evaluación aprobada! ${correctCount}/${totalCount} aciertos (${percentage}%)`
                  : `Resultado: ${correctCount}/${totalCount} aciertos (${percentage}%) · Requieres ${minToPass}/${totalCount}`}
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {passed
                  ? 'Revisa la retroalimentación de cada pregunta o avanza al siguiente módulo.'
                  : 'Revisa las respuestas marcadas abajo e intenta nuevamente.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px] shrink-0 active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Reintentar evaluación</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span className="tabular-nums font-medium">
            Respondidas: <strong className="text-slate-900 dark:text-white">{answeredCount}</strong> / {totalCount}
          </span>
          <div className="w-full sm:w-48 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-cyan-400 transition-all duration-300"
              style={{ width: `${Math.round((answeredCount / Math.max(1, totalCount)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick 1..10 Question Navigator Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:flex-wrap">
        {questions.map((q, idx) => {
          const hasAnswer = (answers[q.id]?.length ?? 0) > 0;
          const isCurrent = viewMode === 'step' && safeIdx === idx;
          const ok = submitted ? isQuestionCorrect(q, answers[q.id]) : null;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                setViewMode('step');
                setCurrentIdx(idx);
              }}
              aria-label={`Pregunta ${idx + 1}`}
              className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors min-h-[44px] min-w-[44px] shrink-0 active:scale-[0.98] ${
                isCurrent
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : submitted
                    ? ok
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
                    : hasAnswer
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-cyan-300'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
              }`}
            >
              {submitted && (ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />)}
              <span className="tabular-nums">{idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Question Cards */}
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {visibleQuestions.map((q) => {
          const qIndex = questions.findIndex((item) => item.id === q.id);
          const picked = answers[q.id] ?? [];
          const qCorrect = submitted ? isQuestionCorrect(q, picked) : false;
          const typeLabel = getQuestionTypeLabel(q);
          const isVF = isTrueFalseQuestion(q);

          return (
            <div key={q.id} className="py-4 first:pt-1 last:pb-1 space-y-3 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 tabular-nums">
                  Pregunta {qIndex + 1} de {totalCount}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    q.multiple
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-200'
                      : isVF
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {typeLabel}
                </span>
              </div>

              <p className="text-sm sm:text-[15px] font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                {q.prompt}
              </p>

              <div className={isVF ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5' : 'space-y-2'}>
                {q.options.map((opt, optIdx) => {
                  const isSelected = picked.includes(optIdx);
                  const isExpectedCorrect = q.correctIndexes.includes(optIdx);

                  let stateCls = isSelected
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-slate-900 dark:text-slate-100'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60';

                  if (submitted) {
                    if (isExpectedCorrect) {
                      stateCls =
                        'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/35 text-emerald-950 dark:text-emerald-100';
                    } else if (isSelected && !isExpectedCorrect) {
                      stateCls =
                        'border-red-500 bg-red-50/80 dark:bg-red-950/35 text-red-950 dark:text-red-100';
                    } else {
                      stateCls =
                        'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400';
                    }
                  }

                  return (
                    <label
                      key={opt.id || `${q.id}-${optIdx}`}
                      className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm cursor-pointer transition-colors min-h-[44px] active:scale-[0.99] min-w-0 ${stateCls}`}
                    >
                      <input
                        type={q.multiple ? 'checkbox' : 'radio'}
                        name={`quiz-${module.id}-${q.id}`}
                        checked={isSelected}
                        disabled={submitted}
                        onChange={() => toggleOption(q, optIdx)}
                        className="accent-blue-600 w-4 h-4 shrink-0"
                      />
                      <span className="flex-1 min-w-0 break-words leading-snug">{opt.text}</span>
                      {submitted && isExpectedCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      {submitted && isSelected && !isExpectedCorrect && (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                      )}
                    </label>
                  );
                })}
              </div>

              {submitted && q.explanation && (
                <div
                  className={`rounded-lg border-l-2 px-3 py-2 text-xs leading-relaxed ${
                    qCorrect
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/25 text-emerald-900 dark:text-emerald-100'
                      : 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/25 text-amber-900 dark:text-amber-100'
                  }`}
                >
                  <span className="font-bold">
                    {qCorrect ? 'Correcto: ' : 'Retroalimentación: '}
                  </span>
                  <span>{q.explanation}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Navigation + Submit */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-200 dark:border-slate-800 pt-3">
        {viewMode === 'step' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safeIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 min-h-[44px] active:scale-[0.98]"
            >
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span>Anterior</span>
            </button>
            <button
              type="button"
              disabled={safeIdx >= totalCount - 1}
              onClick={() => setCurrentIdx((i) => Math.min(totalCount - 1, i + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 min-h-[44px] active:scale-[0.98]"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Mostrando todas las {totalCount} preguntas
          </span>
        )}

        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {!submitted ? (
            <button
              type="button"
              disabled={answeredCount === 0}
              onClick={handleGrade}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#107C41] hover:bg-[#0d6535] disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition-colors min-h-[44px] active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                Calificar evaluación ({answeredCount}/{totalCount})
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-slate-100 px-4 py-2 text-xs font-semibold text-white dark:text-slate-900 hover:opacity-90 transition-opacity min-h-[44px] active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>Volver a intentar</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

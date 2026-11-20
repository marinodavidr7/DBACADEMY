import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Eye,
  PlayCircle,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import type { Certificate } from '../types';
import { exportCertificatePdf } from '../utils/export';
import { AuthGateNotice } from './AuthGateNotice';

const VIEW_COMPLETION_MS = 5000;

export const CoursePlayerView: React.FC = () => {
  const {
    user,
    courses,
    enrollments,
    certificates,
    selectedCourseId,
    setSelectedCourseId,
    setActiveView,
    completeLesson,
    t,
  } = usePlatform();

  const enrolledCourses = useMemo(
    () => courses.filter((c) => enrollments.some((e) => e.courseId === c.id)),
    [courses, enrollments]
  );

  const activeCourse = useMemo(() => {
    if (selectedCourseId) {
      const found = enrolledCourses.find((c) => c.id === selectedCourseId);
      if (found) return found;
    }
    return enrolledCourses[0] || null;
  }, [enrolledCourses, selectedCourseId]);

  const activeEnrollment = useMemo(
    () => enrollments.find((e) => e.courseId === activeCourse?.id) || null,
    [enrollments, activeCourse]
  );

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizFeedback, setQuizFeedback] = useState<Record<string, 'passed' | 'failed'>>({});
  const [saving, setSaving] = useState(false);
  const [newlyIssuedCert, setNewlyIssuedCert] = useState<Certificate | null>(null);
  const [autoTrackEnabled, setAutoTrackEnabled] = useState(true);
  const [viewProgressPct, setViewProgressPct] = useState(0);
  const [autoCompletedLessonTitle, setAutoCompletedLessonTitle] = useState<string | null>(null);

  const inFlightLessonsRef = useRef<Set<string>>(new Set());

  const allLessons = useMemo(
    () =>
      activeCourse
        ? activeCourse.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m })))
        : [],
    [activeCourse]
  );

  const currentLessonIndex = useMemo(() => {
    if (allLessons.length === 0) return -1;
    const idx = allLessons.findIndex((l) => l.id === activeLessonId);
    return idx >= 0 ? idx : 0;
  }, [allLessons, activeLessonId]);

  const currentLesson = currentLessonIndex >= 0 ? allLessons[currentLessonIndex] : null;
  const isLessonDone = Boolean(
    currentLesson && activeEnrollment?.completedLessonIds.includes(currentLesson.id)
  );

  const markSubModuleComplete = useCallback(
    async (lessonId: string, lessonTitle: string, durationMinutes: number, automatic = false) => {
      if (!activeCourse || !activeEnrollment) return;
      if (activeEnrollment.completedLessonIds.includes(lessonId)) return;
      if (inFlightLessonsRef.current.has(lessonId)) return;

      inFlightLessonsRef.current.add(lessonId);
      setSaving(true);
      try {
        const res = await completeLesson(activeCourse, lessonId, durationMinutes);
        if (res.certificateIssued) {
          setNewlyIssuedCert(res.certificateIssued);
        }
        if (automatic) {
          setAutoCompletedLessonTitle(lessonTitle);
        }
      } finally {
        inFlightLessonsRef.current.delete(lessonId);
        setSaving(false);
      }
    },
    [activeCourse, activeEnrollment, completeLesson]
  );

  // Automatic viewing progress tracker: marks sub-module complete after viewing content
  useEffect(() => {
    setAutoCompletedLessonTitle(null);
    if (!currentLesson || !activeCourse || !activeEnrollment) {
      setViewProgressPct(0);
      return;
    }
    if (isLessonDone) {
      setViewProgressPct(100);
      return;
    }
    if (!autoTrackEnabled) {
      return;
    }

    setViewProgressPct(0);
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(100, Math.round((elapsed / VIEW_COMPLETION_MS) * 100));
      setViewProgressPct(pct);
      if (elapsed >= VIEW_COMPLETION_MS) {
        window.clearInterval(interval);
        void markSubModuleComplete(
          currentLesson.id,
          currentLesson.title,
          currentLesson.durationMinutes,
          true
        );
      }
    }, 150);

    return () => window.clearInterval(interval);
  }, [
    currentLesson?.id,
    currentLesson?.title,
    currentLesson?.durationMinutes,
    activeCourse?.id,
    isLessonDone,
    autoTrackEnabled,
    markSubModuleComplete,
  ]);

  if (!user) return <AuthGateNotice />;

  if (enrolledCourses.length === 0 || !activeCourse || !activeEnrollment || !currentLesson) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center max-w-xl mx-auto my-8">
        <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('myCoursesTitle')}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('noEnrollments')}</p>
        <button
          type="button"
          onClick={() => setActiveView('catalog')}
          className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors min-h-[44px]"
        >
          {t('exploreCatalog')}
        </button>
      </div>
    );
  }

  const earnedCert =
    newlyIssuedCert || certificates.find((c) => c.courseId === activeCourse.id) || null;
  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < allLessons.length - 1
      ? allLessons[currentLessonIndex + 1]
      : null;

  const handleCompleteLesson = async () => {
    await markSubModuleComplete(
      currentLesson.id,
      currentLesson.title,
      currentLesson.durationMinutes,
      false
    );
  };

  const handleNavigateLesson = async (targetLessonId: string, completeCurrentFirst: boolean) => {
    if (completeCurrentFirst && !isLessonDone) {
      await markSubModuleComplete(
        currentLesson.id,
        currentLesson.title,
        currentLesson.durationMinutes,
        true
      );
    }
    setActiveLessonId(targetLessonId);
  };

  const handleContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isLessonDone || !autoTrackEnabled) return;
    const el = e.currentTarget;
    if (el.scrollHeight > el.clientHeight && el.scrollTop + el.clientHeight >= el.scrollHeight - 12) {
      setViewProgressPct(100);
      void markSubModuleComplete(
        currentLesson.id,
        currentLesson.title,
        currentLesson.durationMinutes,
        true
      );
    }
  };

  const handleCheckQuiz = (moduleId: string, correctIndex: number) => {
    const picked = quizAnswers[moduleId];
    const passed = picked === correctIndex;
    setQuizFeedback((prev) => ({
      ...prev,
      [moduleId]: passed ? 'passed' : 'failed',
    }));
    // Interacting with the module quiz also marks the currently viewed sub-module complete
    if (passed && !isLessonDone) {
      setViewProgressPct(100);
      void markSubModuleComplete(
        currentLesson.id,
        currentLesson.title,
        currentLesson.durationMinutes,
        true
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Enrolled Course Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('myCoursesTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {activeCourse.title} ·{' '}
            <span className="tabular-nums">
              {activeEnrollment.studyMinutes} {t('studyMinutes')}
            </span>
          </p>
        </div>

        <select
          value={activeCourse.id}
          onChange={(e) => {
            setSelectedCourseId(e.target.value);
            setActiveLessonId(null);
            setNewlyIssuedCert(null);
          }}
          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[42px]"
        >
          {enrolledCourses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Live Progress Bar & Auto Certificate Banner */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {activeEnrollment.completedLessonIds.length} / {allLessons.length} {t('subModulesLabel')} ·{' '}
            {activeEnrollment.completedModuleIds.length} / {activeCourse.modules.length} {t('modulesLabel')}
          </span>
          <span className="text-sm font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
            {activeEnrollment.progressPercent}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              activeEnrollment.progressPercent === 100 ? 'bg-emerald-600' : 'bg-blue-600'
            }`}
            style={{ width: `${activeEnrollment.progressPercent}%` }}
          />
        </div>

        {earnedCert && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t('certificatesTitle')}
                </p>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {earnedCert.verificationCode}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => exportCertificatePdf(earnedCert)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors whitespace-nowrap min-h-[40px]"
            >
              <Award className="w-3.5 h-3.5" />
              <span>{t('downloadPdf')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Two-Zone Course Stage + Syllabus */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
            <div className="aspect-video bg-slate-950 relative">
              <img
                src={activeCourse.coverImage}
                alt={currentLesson.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent flex flex-col justify-end p-6">
                <div className="flex items-center gap-2 text-xs text-blue-300">
                  <PlayCircle className="w-4 h-4" />
                  <span>{currentLesson.module.title}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{currentLesson.durationMinutes} min</span>
                </div>
                <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-white">
                  {currentLesson.title}
                </h2>
              </div>
            </div>

            {/* Sub-Module Viewing Progress Tracker Bar */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {isLessonDone ? t('lessonCompleted') : t('readingProgressLabel')}
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {isLessonDone ? '100%' : `${viewProgressPct}%`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 ${
                      isLessonDone ? 'bg-emerald-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${isLessonDone ? 100 : viewProgressPct}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setAutoTrackEnabled((v) => !v)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md border transition-colors whitespace-nowrap ${
                    autoTrackEnabled
                      ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {t('autoTrackLabel')}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {autoCompletedLessonTitle && (
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {t('autoCompletedNotice')}: {autoCompletedLessonTitle}
                  </span>
                </div>
              )}

              <div
                onScroll={handleContentScroll}
                className="space-y-3 max-h-72 overflow-y-auto pr-1"
              >
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {currentLesson.summary}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {currentLesson.content}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span className="tabular-nums">{currentLesson.durationMinutes} min</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {prevLesson && (
                    <button
                      type="button"
                      onClick={() => void handleNavigateLesson(prevLesson.id, false)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[42px]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>{t('prevSubModule')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={saving || isLessonDone}
                    onClick={() => void handleCompleteLesson()}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors min-h-[42px] ${
                      isLessonDone
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isLessonDone ? t('lessonCompleted') : t('completeLesson')}</span>
                  </button>

                  {nextLesson && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleNavigateLesson(nextLesson.id, true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-4 py-2 text-xs font-medium text-white dark:text-slate-900 hover:opacity-90 transition-opacity min-h-[42px]"
                    >
                      <span>{t('nextSubModule')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Module Checkpoint Quiz */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t('moduleQuiz')} · {currentLesson.module.title}
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {currentLesson.module.quizQuestion}
            </p>
            <div className="space-y-2">
              {currentLesson.module.quizOptions.map((opt, idx) => (
                <label
                  key={opt}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-sm cursor-pointer transition-colors ${
                    quizAnswers[currentLesson.module.id] === idx
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 text-slate-900 dark:text-slate-100'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <input
                    type="radio"
                    name={`quiz-${currentLesson.module.id}`}
                    checked={quizAnswers[currentLesson.module.id] === idx}
                    onChange={() =>
                      setQuizAnswers((prev) => ({ ...prev, [currentLesson.module.id]: idx }))
                    }
                    className="accent-blue-600"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  handleCheckQuiz(currentLesson.module.id, currentLesson.module.quizCorrectIndex)
                }
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-900 dark:bg-slate-100 px-4 py-2 text-xs font-medium text-white dark:text-slate-900 hover:opacity-90 transition-opacity min-h-[40px]"
              >
                {t('verifyQuiz')}
              </button>
              {quizFeedback[currentLesson.module.id] === 'passed' && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {t('quizPassed')}
                </span>
              )}
              {quizFeedback[currentLesson.module.id] === 'failed' && (
                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                  {t('quizTryAgain')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Syllabus Tree */}
        <aside className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] divide-y divide-slate-200 dark:divide-slate-800">
          {activeCourse.modules.map((mod) => {
            const modDone = activeEnrollment.completedModuleIds.includes(mod.id);
            const doneInModule = mod.lessons.filter((l) =>
              activeEnrollment.completedLessonIds.includes(l.id)
            ).length;
            const modPct = Math.round((doneInModule / (mod.lessons.length || 1)) * 100);

            return (
              <div key={mod.id} className="p-4 space-y-2.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {mod.title}
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                      {doneInModule}/{mod.lessons.length}
                      {modDone && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        modDone ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${modPct}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  {mod.lessons.map((lesson) => {
                    const done = activeEnrollment.completedLessonIds.includes(lesson.id);
                    const active = currentLesson.id === lesson.id;
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => setActiveLessonId(lesson.id)}
                        className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors min-h-[40px] ${
                          active
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          {done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </span>
                        <span className="font-mono tabular-nums text-[11px] text-slate-400 shrink-0">
                          {lesson.durationMinutes}m
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </aside>
      </div>
    </div>
  );
};

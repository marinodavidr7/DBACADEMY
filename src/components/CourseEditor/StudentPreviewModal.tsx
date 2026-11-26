import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Clock, X } from 'lucide-react';
import type { Course } from '../../types';
import { renderLessonContent } from '../../utils/richText';

interface StudentPreviewModalProps {
  course: Course | null;
  onClose: () => void;
  labels: {
    close: string;
    modules: string;
    lessons: string;
    quiz: string;
    empty: string;
  };
}

export const StudentPreviewModal: React.FC<StudentPreviewModalProps> = ({ course, onClose, labels }) => {
  if (!course) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={course.title}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-700 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{course.title}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{course.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={labels.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-5 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
            <span className="inline-flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {course.modules.length} {labels.modules} · {course.totalLessons} {labels.lessons}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {course.modules.reduce((acc, module) => acc + module.durationMinutes, 0)} min
            </span>
          </div>
          <div className="space-y-5">
            {course.modules.map((module, moduleIndex) => (
              <section key={module.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {moduleIndex + 1}. {module.title}
                </h4>
                <div className="mt-3 space-y-3">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <article key={lesson.id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/40">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                      </p>
                      {lesson.summary && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{lesson.summary}</p>
                      )}
                      {lesson.content && (
                        <div
                          className="mt-2 max-w-[75ch] text-sm leading-relaxed text-slate-700 dark:text-slate-200 dba-rich-content"
                          dangerouslySetInnerHTML={{ __html: renderLessonContent(lesson.content) }}
                        />
                      )}
                    </article>
                  ))}
                </div>
                {module.quizEnabled !== false && (
                  <div className="mt-4 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
                    <p className="font-semibold">{labels.quiz}</p>
                    {(module.questions ?? []).map((question, index) => (
                      <div key={question.id} className="mt-2">
                        <p>{index + 1}. {question.prompt}</p>
                        <ul className="mt-1 list-disc pl-5 text-sm">
                          {question.options.map((option) => (
                            <li key={option.id}>{option.text}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
          {course.modules.length === 0 && <p className="text-sm text-slate-500">{labels.empty}</p>}
        </div>
      </motion.div>
    </div>
  );
};

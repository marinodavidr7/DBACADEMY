import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  GripVertical,
  HelpCircle,
  Layers,
  Plus,
  Trash2,
  Video,
} from 'lucide-react';
import type { CourseLesson, CourseLessonType, CourseModule } from '../../types';
import { buildNumbering, stripManualPrefix } from '../../utils/courseEditor';

interface CourseIndexProps {
  modules: CourseModule[];
  selectedModuleId: string | null;
  selectedLessonId: string | null;
  onSelectModule: (moduleId: string) => void;
  onSelectLesson: (moduleId: string, lessonId: string) => void;
  onAddModule: () => void;
  onAddLesson: (moduleId: string) => void;
  onDeleteModule: (moduleId: string) => void;
  onDeleteLesson: (moduleId: string, lessonId: string) => void;
  onMoveModule: (from: number, to: number) => void;
  onMoveLesson: (moduleId: string, from: number, to: number) => void;
  onMoveLessonBetween: (sourceModuleId: string, sourceIndex: number, targetModuleId: string, targetIndex: number) => void;
  canEdit: boolean;
  labels: {
    title: string;
    subtitle: string;
    addModule: string;
    addLesson: string;
    module: string;
    lesson: string;
    draft: string;
    published: string;
    incomplete: string;
    emptyModule: string;
    emptyModuleAction: string;
    moduleCount: string;
    lessonCount: string;
    materialCount: string;
    moveModuleUp: string;
    moveModuleDown: string;
    moveLessonUp: string;
    moveLessonDown: string;
    deleteModule: string;
    deleteLesson: string;
    dragHandle: string;
  };
}

function lessonIcon(type?: CourseLessonType) {
  if (type === 'video') return <Video className="h-3.5 w-3.5" />;
  if (type === 'excel') return <FileSpreadsheet className="h-3.5 w-3.5" />;
  if (type === 'quiz') return <HelpCircle className="h-3.5 w-3.5" />;
  return <BookOpen className="h-3.5 w-3.5" />;
}

export const CourseIndex: React.FC<CourseIndexProps> = ({
  modules,
  selectedModuleId,
  selectedLessonId,
  onSelectModule,
  onSelectLesson,
  onAddModule,
  onAddLesson,
  onDeleteModule,
  onDeleteLesson,
  onMoveModule,
  onMoveLesson,
  onMoveLessonBetween,
  canEdit,
  labels,
}) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [dragModuleId, setDragModuleId] = useState<string | null>(null);
  const [dragLesson, setDragLesson] = useState<{ moduleId: string; index: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ moduleId: string; index: number } | null>(null);

  const numbering = buildNumbering(modules);

  const handleModuleDrop = (targetIndex: number) => {
    if (dragModuleId) {
      const from = modules.findIndex((m) => m.id === dragModuleId);
      if (from >= 0) onMoveModule(from, targetIndex);
    }
    setDragModuleId(null);
    setDropTarget(null);
  };

  const handleLessonDrop = (targetModuleId: string, targetIndex: number) => {
    if (dragLesson) {
      onMoveLessonBetween(dragLesson.moduleId, dragLesson.index, targetModuleId, targetIndex);
    }
    setDragLesson(null);
    setDropTarget(null);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827]">
      <div className="border-b border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{labels.title}</h3>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{labels.subtitle}</p>
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>{modules.length} {labels.moduleCount}</span>
          <span aria-hidden="true">·</span>
          <span>{modules.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0)} {labels.lessonCount}</span>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={onAddModule}
            disabled={modules.length >= 12}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {labels.addModule}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1.5">
          {numbering.map((entry, moduleIndex) => {
            const module = modules[moduleIndex];
            if (!module) return null;
            const isCollapsed = collapsed[module.id] ?? false;
            const materials = module.lessons.reduce((acc, l) => acc + (l.materials?.length ?? 0), 0);
            return (
              <div
                key={module.id}
                draggable={canEdit}
                onDragStart={() => setDragModuleId(module.id)}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropTarget({ moduleId: module.id, index: moduleIndex });
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleModuleDrop(moduleIndex);
                }}
                onDragLeave={() => setDropTarget(null)}
                className={`rounded-lg border transition-colors ${
                  dropTarget?.moduleId === module.id && dragModuleId
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1 rounded-lg px-2 py-2">
                  <button
                    type="button"
                    onClick={() => onSelectModule(module.id)}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                    aria-label={`${labels.module} ${entry.moduleLabel}`}
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {entry.moduleLabel}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {stripManualPrefix(module.title) || `${labels.module} ${entry.moduleLabel}`}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollapsed((prev) => ({ ...prev, [module.id]: !prev[module.id] }))}
                    aria-label={entry.moduleLabel}
                    aria-expanded={!isCollapsed}
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {canEdit && (
                    <span className="flex items-center">
                      <button
                        type="button"
                        onClick={() => onMoveModule(moduleIndex, Math.max(0, moduleIndex - 1))}
                        disabled={moduleIndex === 0}
                        title={labels.moveModuleUp}
                        aria-label={labels.moveModuleUp}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveModule(moduleIndex, Math.min(modules.length - 1, moduleIndex + 1))}
                        disabled={moduleIndex === modules.length - 1}
                        title={labels.moveModuleDown}
                        aria-label={labels.moveModuleDown}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteModule(module.id)}
                        disabled={modules.length <= 1}
                        title={labels.deleteModule}
                        aria-label={labels.deleteModule}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="space-y-1 px-2 pb-2">
                    {entry.lessons.length === 0 && (
                      <div className="rounded-md border border-dashed border-slate-200 dark:border-slate-700 px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {labels.emptyModule}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => onAddLesson(module.id)}
                            className="mt-1 block font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {labels.emptyModuleAction}
                          </button>
                        )}
                      </div>
                    )}
                    {entry.lessons.map((item, lessonIndex) => {
                      const lesson = item.lesson;
                      const selected = selectedModuleId === module.id && selectedLessonId === lesson.id;
                      const incomplete = !lesson.content.trim() && lesson.type !== 'video';
                      return (
                        <div
                          key={lesson.id}
                          draggable={canEdit}
                          onDragStart={() => setDragLesson({ moduleId: module.id, index: lessonIndex })}
                          onDragOver={(event) => {
                            event.preventDefault();
                            setDropTarget({ moduleId: module.id, index: lessonIndex });
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            handleLessonDrop(module.id, lessonIndex);
                          }}
                          onDragLeave={() => setDropTarget(null)}
                          className={`group flex items-center gap-2 rounded-md px-2 py-1.5 ${
                            selected
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                          } ${dropTarget?.moduleId === module.id && dropTarget.index === lessonIndex && dragLesson ? 'ring-2 ring-blue-500' : ''}`}
                        >
                          <GripVertical className={`h-3.5 w-3.5 shrink-0 ${selected ? 'text-white/70' : 'text-slate-300 dark:text-slate-600'}`} aria-hidden="true" />
                          <button
                            type="button"
                            onClick={() => onSelectLesson(module.id, lesson.id)}
                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                            aria-label={`${item.label} ${lesson.title}`}
                          >
                            <span className={`shrink-0 ${selected ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                              {lessonIcon(lesson.type)}
                            </span>
                            <span className={`min-w-0 flex-1 truncate text-xs font-medium ${selected ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                              <span className="mr-1 font-mono tabular-nums text-slate-400 dark:text-slate-500">{item.label}</span>
                              {stripManualPrefix(lesson.title)}
                            </span>
                          </button>
                          <span className={`shrink-0 text-[10px] tabular-nums ${selected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                            {lesson.durationMinutes}m
                          </span>
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              incomplete
                                ? 'bg-amber-400'
                                : lesson.status === 'published'
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                            title={incomplete ? labels.incomplete : lesson.status === 'published' ? labels.published : labels.draft}
                          />
                          {canEdit && (
                            <span className="flex shrink-0 items-center opacity-0 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => onMoveLesson(module.id, lessonIndex, Math.max(0, lessonIndex - 1))}
                                disabled={lessonIndex === 0}
                                title={labels.moveLessonUp}
                                aria-label={labels.moveLessonUp}
                                className="rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onMoveLesson(module.id, lessonIndex, Math.min(entry.lessons.length - 1, lessonIndex + 1))}
                                disabled={lessonIndex === entry.lessons.length - 1}
                                title={labels.moveLessonDown}
                                aria-label={labels.moveLessonDown}
                                className="rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteLesson(module.id, lesson.id)}
                                disabled={entry.lessons.length <= 1}
                                title={labels.deleteLesson}
                                aria-label={labels.deleteLesson}
                                className="rounded p-0.5 text-slate-400 hover:text-red-600 disabled:opacity-30"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {canEdit && entry.lessons.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onAddLesson(module.id)}
                        className="mt-1 inline-flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-slate-200 dark:border-slate-700 px-2 py-1.5 text-xs font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600"
                      >
                        <Plus className="h-3 w-3" />
                        {labels.addLesson}
                      </button>
                    )}
                  </div>
                )}
                <div className="px-3 pb-2 text-[11px] text-slate-400 dark:text-slate-500">
                  {entry.lessons.length} {labels.lessonCount} · {materials} {labels.materialCount}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

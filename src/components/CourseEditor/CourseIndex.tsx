import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  GripVertical,
  HelpCircle,
  Plus,
  Trash2,
  Video,
} from 'lucide-react';
import type { CourseLesson, CourseLessonType, CourseModule } from '../../types';
import { buildNumbering, stripManualPrefix } from '../../utils/courseEditor';

interface CourseIndexLabels {
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
}

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
  labels: CourseIndexLabels;
}

function lessonIcon(type?: CourseLessonType) {
  if (type === 'video') return <Video className="h-3.5 w-3.5" />;
  if (type === 'excel') return <FileSpreadsheet className="h-3.5 w-3.5" />;
  if (type === 'quiz') return <HelpCircle className="h-3.5 w-3.5" />;
  return <BookOpen className="h-3.5 w-3.5" />;
}

interface LessonRowProps {
  moduleId: string;
  lesson: CourseLesson;
  lessonIndex: number;
  lessonsCount: number;
  label: string;
  selected: boolean;
  isDropTarget: boolean;
  canEdit: boolean;
  labels: CourseIndexLabels;
  onSelectLesson: (moduleId: string, lessonId: string) => void;
  onMoveLesson: (moduleId: string, from: number, to: number) => void;
  onDeleteLesson: (moduleId: string, lessonId: string) => void;
  onDragStartLesson: (moduleId: string, index: number) => void;
  onDragOverTarget: (moduleId: string, index: number) => void;
  onDropLesson: (moduleId: string, index: number) => void;
  onDragLeaveTarget: () => void;
  onDragEnd: () => void;
}

const CourseIndexLessonRow: React.FC<LessonRowProps> = memo(({
  moduleId,
  lesson,
  lessonIndex,
  lessonsCount,
  label,
  selected,
  isDropTarget,
  canEdit,
  labels,
  onSelectLesson,
  onMoveLesson,
  onDeleteLesson,
  onDragStartLesson,
  onDragOverTarget,
  onDropLesson,
  onDragLeaveTarget,
  onDragEnd,
}) => {
  const incomplete = !lesson.content.trim() && lesson.type !== 'video';
  const strippedTitle = useMemo(() => stripManualPrefix(lesson.title), [lesson.title]);

  return (
    <div
      draggable={canEdit}
      onDragStart={(event) => {
        if ((event.target as HTMLElement | null)?.closest('button')) {
          event.preventDefault();
          return;
        }
        event.stopPropagation();
        onDragStartLesson(moduleId, lessonIndex);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDragOverTarget(moduleId, lessonIndex);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDropLesson(moduleId, lessonIndex);
      }}
      onDragLeave={onDragLeaveTarget}
      onDragEnd={onDragEnd}
      className={`group flex items-center gap-2 rounded-md px-2 py-1.5 ${
        selected
          ? 'bg-blue-600 text-white'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
      } ${isDropTarget ? 'ring-2 ring-blue-500' : ''}`}
    >
      <GripVertical
        className={`h-3.5 w-3.5 shrink-0 ${selected ? 'text-white/70' : 'text-slate-300 dark:text-slate-600'}`}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => onSelectLesson(moduleId, lesson.id)}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        aria-label={`${label} ${lesson.title}`}
      >
        <span className={`shrink-0 ${selected ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}>
          {lessonIcon(lesson.type)}
        </span>
        <span
          className={`min-w-0 flex-1 truncate text-xs font-medium ${
            selected ? 'text-white' : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          <span
            className={`mr-1 font-mono tabular-nums ${
              selected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {label}
          </span>
          {strippedTitle}
        </span>
      </button>
      <span
        className={`shrink-0 text-[10px] tabular-nums ${
          selected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
        }`}
      >
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
        title={
          incomplete ? labels.incomplete : lesson.status === 'published' ? labels.published : labels.draft
        }
      />
      {canEdit && (
        <span className="flex shrink-0 items-center opacity-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onMoveLesson(moduleId, lessonIndex, Math.max(0, lessonIndex - 1))}
            disabled={lessonIndex === 0}
            title={labels.moveLessonUp}
            aria-label={labels.moveLessonUp}
            className="rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() =>
              onMoveLesson(moduleId, lessonIndex, Math.min(lessonsCount - 1, lessonIndex + 1))
            }
            disabled={lessonIndex === lessonsCount - 1}
            title={labels.moveLessonDown}
            aria-label={labels.moveLessonDown}
            className="rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteLesson(moduleId, lesson.id)}
            disabled={lessonsCount <= 1}
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
});

interface ModuleCardProps {
  module: CourseModule;
  moduleIndex: number;
  modulesCount: number;
  moduleLabel: string;
  lessons: Array<{ lesson: CourseLesson; label: string }>;
  selectedLessonId: string | null;
  isModuleSelected: boolean;
  isCollapsed: boolean;
  isModuleDropTarget: boolean;
  dropLessonIndex: number | null;
  canEdit: boolean;
  labels: CourseIndexLabels;
  onSelectModule: (moduleId: string) => void;
  onToggleCollapse: (moduleId: string) => void;
  onSelectLesson: (moduleId: string, lessonId: string) => void;
  onAddLesson: (moduleId: string) => void;
  onDeleteModule: (moduleId: string) => void;
  onDeleteLesson: (moduleId: string, lessonId: string) => void;
  onMoveModule: (from: number, to: number) => void;
  onMoveLesson: (moduleId: string, from: number, to: number) => void;
  onDragStartModule: (moduleId: string) => void;
  onDragOverModule: (moduleId: string, index: number) => void;
  onDropModule: (targetIndex: number) => void;
  onDragStartLesson: (moduleId: string, index: number) => void;
  onDragOverLesson: (moduleId: string, index: number) => void;
  onDropLesson: (moduleId: string, index: number) => void;
  onDragLeaveTarget: () => void;
  onDragEnd: () => void;
}

const CourseIndexModuleCard: React.FC<ModuleCardProps> = memo(({
  module,
  moduleIndex,
  modulesCount,
  moduleLabel,
  lessons,
  selectedLessonId,
  isModuleSelected,
  isCollapsed,
  isModuleDropTarget,
  dropLessonIndex,
  canEdit,
  labels,
  onSelectModule,
  onToggleCollapse,
  onSelectLesson,
  onAddLesson,
  onDeleteModule,
  onDeleteLesson,
  onMoveModule,
  onMoveLesson,
  onDragStartModule,
  onDragOverModule,
  onDropModule,
  onDragStartLesson,
  onDragOverLesson,
  onDropLesson,
  onDragLeaveTarget,
  onDragEnd,
}) => {
  const strippedModuleTitle = useMemo(() => stripManualPrefix(module.title), [module.title]);
  const materials = useMemo(
    () => (module.lessons ?? []).reduce((acc, l) => acc + (l.materials?.length ?? 0), 0),
    [module.lessons]
  );

  return (
    <div
      draggable={canEdit}
      onDragStart={(event) => {
        if ((event.target as HTMLElement | null)?.closest('button')) {
          event.preventDefault();
          return;
        }
        onDragStartModule(module.id);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOverModule(module.id, moduleIndex);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDropModule(moduleIndex);
      }}
      onDragLeave={onDragLeaveTarget}
      onDragEnd={onDragEnd}
      className={`rounded-lg border transition-colors ${
        isModuleDropTarget
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-1 rounded-lg px-2 py-2">
        <button
          type="button"
          onClick={() => onSelectModule(module.id)}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          aria-label={`${labels.module} ${moduleLabel}`}
        >
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {moduleLabel}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
            {strippedModuleTitle || `${labels.module} ${moduleLabel}`}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onToggleCollapse(module.id)}
          aria-label={moduleLabel}
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
              onClick={() => onMoveModule(moduleIndex, Math.min(modulesCount - 1, moduleIndex + 1))}
              disabled={moduleIndex === modulesCount - 1}
              title={labels.moveModuleDown}
              aria-label={labels.moveModuleDown}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDeleteModule(module.id)}
              disabled={modulesCount <= 1}
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
          {lessons.length === 0 && (
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
          {lessons.map((item, lessonIndex) => (
            <CourseIndexLessonRow
              key={item.lesson.id}
              moduleId={module.id}
              lesson={item.lesson}
              lessonIndex={lessonIndex}
              lessonsCount={lessons.length}
              label={item.label}
              selected={isModuleSelected && selectedLessonId === item.lesson.id}
              isDropTarget={dropLessonIndex === lessonIndex}
              canEdit={canEdit}
              labels={labels}
              onSelectLesson={onSelectLesson}
              onMoveLesson={onMoveLesson}
              onDeleteLesson={onDeleteLesson}
              onDragStartLesson={onDragStartLesson}
              onDragOverTarget={onDragOverLesson}
              onDropLesson={onDropLesson}
              onDragLeaveTarget={onDragLeaveTarget}
              onDragEnd={onDragEnd}
            />
          ))}
          {canEdit && lessons.length > 0 && (
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
        {lessons.length} {labels.lessonCount} · {materials} {labels.materialCount}
      </div>
    </div>
  );
});

export const CourseIndex: React.FC<CourseIndexProps> = memo(({
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

  const modulesRef = useRef(modules);
  modulesRef.current = modules;
  const dragModuleIdRef = useRef(dragModuleId);
  dragModuleIdRef.current = dragModuleId;
  const dragLessonRef = useRef(dragLesson);
  dragLessonRef.current = dragLesson;

  const numbering = useMemo(() => buildNumbering(modules), [modules]);
  const totalLessonsCount = useMemo(
    () => modules.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0),
    [modules]
  );

  const toggleCollapse = useCallback((moduleId: string) => {
    setCollapsed((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  }, []);

  const handleDragStartModule = useCallback((moduleId: string) => {
    setDragModuleId(moduleId);
  }, []);

  const handleDragOverModule = useCallback((moduleId: string, index: number) => {
    setDropTarget((prev) =>
      prev?.moduleId === moduleId && prev.index === index ? prev : { moduleId, index }
    );
  }, []);

  const handleModuleDrop = useCallback(
    (targetIndex: number) => {
      const currentDragModuleId = dragModuleIdRef.current;
      if (currentDragModuleId) {
        const from = modulesRef.current.findIndex((m) => m.id === currentDragModuleId);
        if (from >= 0) onMoveModule(from, targetIndex);
      }
      setDragModuleId(null);
      setDropTarget(null);
    },
    [onMoveModule]
  );

  const handleDragStartLesson = useCallback((moduleId: string, index: number) => {
    setDragLesson({ moduleId, index });
  }, []);

  const handleDragOverLesson = useCallback((moduleId: string, index: number) => {
    setDropTarget((prev) =>
      prev?.moduleId === moduleId && prev.index === index ? prev : { moduleId, index }
    );
  }, []);

  const handleLessonDrop = useCallback(
    (targetModuleId: string, targetIndex: number) => {
      const currentDragLesson = dragLessonRef.current;
      if (currentDragLesson) {
        onMoveLessonBetween(
          currentDragLesson.moduleId,
          currentDragLesson.index,
          targetModuleId,
          targetIndex
        );
      }
      setDragLesson(null);
      setDropTarget(null);
    },
    [onMoveLessonBetween]
  );

  const handleDragLeaveTarget = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragModuleId(null);
    setDragLesson(null);
    setDropTarget(null);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827]">
      <div className="border-b border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{labels.title}</h3>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{labels.subtitle}</p>
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>{modules.length} {labels.moduleCount}</span>
          <span aria-hidden="true">·</span>
          <span>{totalLessonsCount} {labels.lessonCount}</span>
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
            const isModuleSelected = selectedModuleId === module.id;
            return (
              <CourseIndexModuleCard
                key={module.id}
                module={module}
                moduleIndex={moduleIndex}
                modulesCount={modules.length}
                moduleLabel={entry.moduleLabel}
                lessons={entry.lessons}
                selectedLessonId={isModuleSelected ? selectedLessonId : null}
                isModuleSelected={isModuleSelected}
                isCollapsed={collapsed[module.id] ?? false}
                isModuleDropTarget={Boolean(dragModuleId && dropTarget?.moduleId === module.id)}
                dropLessonIndex={
                  dragLesson && dropTarget?.moduleId === module.id ? dropTarget.index : null
                }
                canEdit={canEdit}
                labels={labels}
                onSelectModule={onSelectModule}
                onToggleCollapse={toggleCollapse}
                onSelectLesson={onSelectLesson}
                onAddLesson={onAddLesson}
                onDeleteModule={onDeleteModule}
                onDeleteLesson={onDeleteLesson}
                onMoveModule={onMoveModule}
                onMoveLesson={onMoveLesson}
                onDragStartModule={handleDragStartModule}
                onDragOverModule={handleDragOverModule}
                onDropModule={handleModuleDrop}
                onDragStartLesson={handleDragStartLesson}
                onDragOverLesson={handleDragOverLesson}
                onDropLesson={handleLessonDrop}
                onDragLeaveTarget={handleDragLeaveTarget}
                onDragEnd={handleDragEnd}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

import React, { useRef, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Paperclip,
  Trash2,
  UploadCloud,
  Video,
  X,
} from 'lucide-react';
import type { CourseMaterial, CourseMaterialType } from '../../types';
import {
  MATERIAL_ACCEPT,
  MAX_MATERIAL_BYTES,
  validateMaterialFile,
} from '../../utils/courseEditor';
import { formatFileSize, uploadCourseMaterial } from '../../services/storageService';
import { Field } from './Field';

interface MaterialsPanelProps {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  materials: CourseMaterial[];
  canEdit: boolean;
  onChange: (materials: CourseMaterial[]) => void;
  labels: {
    title: string;
    empty: string;
    emptyHint: string;
    dropCompact: string;
    tooLarge: string;
    unsupported: string;
    uploading: string;
    rename: string;
    download: string;
    delete: string;
    renameTitle: string;
    renameAction: string;
    renameCancel: string;
  };
}

interface UploadTask {
  id: string;
  name: string;
  pct: number;
  error?: string;
}

function MaterialIcon({ type, className = 'h-4 w-4' }: { type: CourseMaterialType; className?: string }) {
  const map: Record<CourseMaterialType, React.ReactNode> = {
    pdf: <FileText className={className} />,
    video: <Video className={className} />,
    doc: <FileText className={className} />,
    spreadsheet: <FileSpreadsheet className={className} />,
    image: <ImageIcon className={className} />,
    zip: <Archive className={className} />,
    other: <Paperclip className={className} />,
  };
  return <>{map[type]}</>;
}

export const MaterialsPanel: React.FC<MaterialsPanelProps> = ({
  courseId,
  lessonId,
  lessonTitle,
  materials,
  canEdit,
  onChange,
  labels,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [pendingDelete, setPendingDelete] = useState<CourseMaterial | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const rejected: UploadTask[] = [];
    const accepted: File[] = [];

    list.forEach((file) => {
      const error = validateMaterialFile(file);
      if (error) {
        rejected.push({
          id: `${file.name}-${file.size}`,
          name: file.name,
          pct: 0,
          error: error === 'too-large' ? labels.tooLarge : labels.unsupported,
        });
      } else {
        accepted.push(file);
      }
    });

    if (rejected.length > 0) setTasks((prev) => [...prev, ...rejected]);
    if (accepted.length === 0) {
      setTimeout(() => {
        setTasks((prev) => prev.filter((task) => !rejected.some((r) => r.id === task.id)));
      }, 4000);
      return;
    }

    const initial: UploadTask[] = accepted.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      pct: 0,
    }));
    setTasks((prev) => [...prev, ...initial]);

    for (let index = 0; index < accepted.length; index += 1) {
      const file = accepted[index];
      const task = initial[index];
      try {
        const material = await uploadCourseMaterial(
          courseId || 'general',
          lessonId,
          file,
          (pct) => {
            setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, pct } : item)));
          }
        );
        onChange([...materials, material]);
      } catch (error) {
        setTasks((prev) =>
          prev.map((item) =>
            item.id === task.id
              ? { ...item, error: error instanceof Error ? error.message : 'Error al subir' }
              : item
          )
        );
      }
    }

    setTimeout(() => {
      setTasks((prev) => prev.filter((item) => !initial.some((t) => t.id === item.id)));
    }, 1800);
  };

  const startRename = (material: CourseMaterial) => {
    setRenamingId(material.id);
    setRenameValue(material.name);
  };

  const commitRename = () => {
    if (!renamingId) return;
    const next = materials.map((material) =>
      material.id === renamingId ? { ...material, name: renameValue.trim() || material.name } : material
    );
    onChange(next);
    setRenamingId(null);
  };

  const dropZoneClass = `flex items-center justify-center rounded-lg border-2 border-dashed text-sm transition-colors ${
    dragging
      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
      : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400'
  }`;

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Paperclip className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
          <h4 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {labels.title}
            <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">{lessonTitle}</span>
          </h4>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            {labels.uploading}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={MATERIAL_ACCEPT}
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = '';
        }}
      />

      {canEdit && materials.length === 0 && tasks.length === 0 ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void handleFiles(event.dataTransfer.files);
          }}
          className={`mt-3 min-h-[140px] cursor-pointer flex-col gap-2 px-4 py-6 ${dropZoneClass}`}
        >
          <UploadCloud className="h-6 w-6" />
          <span>{labels.empty}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500">{labels.emptyHint}</span>
        </div>
      ) : null}

      {tasks.length > 0 && (
        <div className="mt-3 space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
            >
              {task.error ? (
                <X className="h-4 w-4 shrink-0 text-red-500" />
              ) : task.pct >= 100 ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-500" />
              )}
              <span className="min-w-0 flex-1 truncate text-xs text-slate-700 dark:text-slate-200">
                {task.name}
              </span>
              {task.error ? (
                <span className="shrink-0 text-xs text-red-600 dark:text-red-400">{task.error}</span>
              ) : (
                <>
                  <span className="shrink-0 text-xs tabular-nums text-slate-500">{task.pct}%</span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div className="h-full bg-blue-600 transition-all" style={{ width: `${task.pct}%` }} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {materials.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {materials.map((material) => (
            <li
              key={material.id}
              className="group flex items-center gap-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
            >
              <span className="shrink-0 text-blue-600 dark:text-blue-400">
                <MaterialIcon type={material.type} className="h-4 w-4" />
              </span>
              {renamingId === material.id ? (
                <input
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  aria-label={labels.renameTitle}
                  className="min-w-0 flex-1 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') commitRename();
                    if (event.key === 'Escape') setRenamingId(null);
                  }}
                />
              ) : (
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-800 dark:text-slate-100">
                  {material.name}
                </span>
              )}
              {material.sizeByte > 0 && (
                <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  {formatFileSize(material.sizeByte)}
                </span>
              )}
              <span className="flex shrink-0 items-center gap-1">
                {renamingId === material.id ? (
                  <>
                    <button
                      type="button"
                      onClick={commitRename}
                      className="rounded-md px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    >
                      {labels.renameAction}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenamingId(null)}
                      className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {labels.renameCancel}
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={labels.download}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => startRename(material)}
                          title={labels.rename}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(material)}
                          title={labels.delete}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {canEdit && materials.length > 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void handleFiles(event.dataTransfer.files);
          }}
          className={`mt-2 min-h-[72px] w-full text-xs ${dropZoneClass}`}
        >
          {labels.dropCompact}
        </button>
      )}

      {pendingDelete && (
        <div className="mt-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-3">
          <p className="text-xs text-red-700 dark:text-red-300">
            {labels.delete}: <span className="font-semibold">{pendingDelete.name}</span>
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPendingDelete(null)}
              className="rounded-md px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
            >
              {labels.renameCancel}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(materials.filter((item) => item.id !== pendingDelete.id));
                setPendingDelete(null);
              }}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
            >
              {labels.delete}
            </button>
          </div>
        </div>
      )}

      {canEdit && materials.length > 0 && (
        <Field className="sr-only" label={labels.title}>
          <span>{`${materials.length} / ${MAX_MATERIAL_BYTES}`}</span>
        </Field>
      )}
    </section>
  );
};

/**
 * MaterialUploader.tsx
 * Panel de subida de materiales por lección.
 * Usado dentro del InstructorDashboard course builder.
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Plus,
  Trash2,
  UploadCloud,
  Video,
  X,
} from 'lucide-react';
import { auth, isAuthorizedAdminEmail } from '../firebase';
import type { CourseMaterial, CourseMaterialType } from '../types';
import {
  buildExternalMaterial,
  formatFileSize,
  uploadCourseMaterial,
} from '../services/storageService';

/* ------------------------------------------------------------------ */
/*  Icon resolver                                                        */
/* ------------------------------------------------------------------ */
function MaterialIcon({
  type,
  className = 'w-4 h-4',
}: {
  type: CourseMaterialType;
  className?: string;
}) {
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

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */
interface Props {
  courseId: string;      // ID del curso (puede ser temporal mientras se crea)
  lessonId: string;
  lessonTitle: string;
  materials: CourseMaterial[];
  canEdit?: boolean;
  onChange: (updated: CourseMaterial[]) => void;
}

/* ------------------------------------------------------------------ */
/*  Upload progress per file                                            */
/* ------------------------------------------------------------------ */
interface UploadTask {
  name: string;
  pct: number;
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */
export function MaterialUploader({
  courseId,
  lessonId,
  lessonTitle,
  materials,
  canEdit = true,
  onChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<UploadTask[]>([]);
  const [permissionError, setPermissionError] = useState('');

  // External URL form
  const [showExtForm, setShowExtForm] = useState(false);
  const [extUrl, setExtUrl] = useState('');
  const [extName, setExtName] = useState('');
  const [extType, setExtType] = useState<CourseMaterialType>('other');

  const isAuthorizedAdminSession = () => {
    const current = auth.currentUser;
    return Boolean(
      canEdit && current?.emailVerified && isAuthorizedAdminEmail(current.email)
    );
  };

  /* ---------------------------------------------------------------- */
  /*  File picker handler                                               */
  /* ---------------------------------------------------------------- */
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (!isAuthorizedAdminSession()) {
        setPermissionError(
          'Permiso denegado: solo el correo verificado Marinodavidr7@gmail.com puede subir materiales.'
        );
        return;
      }
      setPermissionError('');

      const tempId = courseId.startsWith('crs_') ? courseId : `tmp_${Date.now().toString(36)}`;

      const tasks: UploadTask[] = Array.from(files).map((f) => ({
        name: f.name,
        pct: 0,
      }));
      setUploading(tasks);

      const results: CourseMaterial[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const mat = await uploadCourseMaterial(
            tempId,
            lessonId,
            file,
            (pct) => {
              setUploading((prev) =>
                prev.map((t, idx) => (idx === i ? { ...t, pct } : t))
              );
            }
          );
          results.push(mat);
          setUploading((prev) =>
            prev.map((t, idx) => (idx === i ? { ...t, pct: 100 } : t))
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Error al subir';
          setUploading((prev) =>
            prev.map((t, idx) => (idx === i ? { ...t, error: msg } : t))
          );
        }
      }

      onChange([...materials, ...results]);
      // Clear progress after a brief pause
      setTimeout(() => setUploading([]), 1800);
    },
    [courseId, lessonId, materials, canEdit, onChange]
  );

  /* ---------------------------------------------------------------- */
  /*  Drag-and-drop                                                     */
  /* ---------------------------------------------------------------- */
  const [dragging, setDragging] = useState(false);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      setDragging(false);
      void handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  /* ---------------------------------------------------------------- */
  /*  External link                                                     */
  /* ---------------------------------------------------------------- */
  const addExternal = () => {
    if (!isAuthorizedAdminSession()) {
      setPermissionError(
        'Permiso denegado: solo el correo verificado Marinodavidr7@gmail.com puede agregar enlaces.'
      );
      return;
    }
    setPermissionError('');
    if (!extUrl.trim()) return;
    const name = extName.trim() || extUrl.trim().split('/').pop() || 'Enlace';
    onChange([...materials, buildExternalMaterial(name, extUrl.trim(), extType)]);
    setExtUrl('');
    setExtName('');
    setExtType('other');
    setShowExtForm(false);
  };

  /* ---------------------------------------------------------------- */
  /*  Remove material                                                   */
  /* ---------------------------------------------------------------- */
  const removeMaterial = (id: string) => {
    if (!isAuthorizedAdminSession()) {
      setPermissionError(
        'Permiso denegado: solo el correo verificado Marinodavidr7@gmail.com puede eliminar materiales.'
      );
      return;
    }
    setPermissionError('');
    onChange(materials.filter((m) => m.id !== id));
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                            */
  /* ---------------------------------------------------------------- */
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Paperclip className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Materiales — <span className="font-normal text-slate-500">{lessonTitle}</span>
          </span>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowExtForm((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Agregar enlace externo"
            >
              <Plus className="w-3 h-3" />
              Enlace
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <UploadCloud className="w-3 h-3" />
              Subir archivo
            </button>
          </div>
        )}
      </div>

      {permissionError && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-[11px] text-red-700 dark:text-red-300">
          {permissionError}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept="*/*"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {/* Drop zone (shown when no materials yet) */}
      {canEdit && materials.length === 0 && uploading.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg cursor-pointer flex flex-col items-center justify-center gap-2 py-5 transition-colors ${
            dragging
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30'
              : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
          }`}
        >
          <UploadCloud className="w-6 h-6 text-slate-400" />
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Arrastra archivos aquí o haz clic para seleccionarlos<br />
            <span className="text-[11px]">PDF, Video, Word, Excel, ZIP — máx. 100 MB</span>
          </p>
        </div>
      )}

      {/* Upload progress */}
      {uploading.map((task, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
        >
          {task.error ? (
            <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
          ) : task.pct === 100 ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          ) : (
            <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
          )}
          <span className="text-xs text-slate-700 dark:text-slate-300 truncate flex-1">
            {task.name}
          </span>
          {!task.error && task.pct < 100 && (
            <span className="text-[11px] font-mono tabular-nums text-slate-500 shrink-0">
              {task.pct}%
            </span>
          )}
          {task.error && (
            <span className="text-[11px] text-red-500 shrink-0">{task.error}</span>
          )}
          {!task.error && (
            <div className="w-16 h-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${task.pct}%` }}
              />
            </div>
          )}
        </div>
      ))}

      {/* Material list */}
      {materials.length > 0 && (
        <div className="space-y-1.5">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="flex items-center gap-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 group"
            >
              <span className="text-blue-600 dark:text-blue-400 shrink-0">
                <MaterialIcon type={mat.type} className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate flex-1">
                {mat.name}
              </span>
              {mat.sizeByte > 0 && (
                <span className="text-[11px] text-slate-400 font-mono tabular-nums shrink-0">
                  {formatFileSize(mat.sizeByte)}
                </span>
              )}
              <a
                href={mat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-600"
                title="Abrir en nueva pestaña"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => removeMaterial(mat.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                  title="Eliminar material"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {/* Show drop target below the list too */}
          {canEdit && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`w-full text-xs text-center py-2 rounded-lg border-2 border-dashed transition-colors ${
                dragging
                  ? 'border-blue-400 text-blue-600'
                  : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-blue-300 hover:text-blue-500'
              }`}
            >
              + Agregar más archivos
            </button>
          )}
        </div>
      )}

      {/* External URL form */}
      {canEdit && showExtForm && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-2">
          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            Agregar enlace externo
          </p>
          <input
            type="url"
            value={extUrl}
            onChange={(e) => setExtUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="w-full text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={extName}
              onChange={(e) => setExtName(e.target.value)}
              placeholder="Nombre descriptivo (opcional)"
              className="flex-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <select
              value={extType}
              onChange={(e) => setExtType(e.target.value as CourseMaterialType)}
              className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-slate-900 dark:text-slate-100"
            >
              <option value="pdf">PDF</option>
              <option value="video">Video</option>
              <option value="doc">Documento</option>
              <option value="spreadsheet">Hoja de cálculo</option>
              <option value="image">Imagen</option>
              <option value="zip">ZIP</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowExtForm(false)}
              className="text-xs px-3 py-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={addExternal}
              disabled={!extUrl.trim()}
              className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

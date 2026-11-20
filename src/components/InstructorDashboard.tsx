import React, { useMemo, useState } from 'react';
import {
  FileDown,
  FileSpreadsheet,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import type { Course } from '../types';
import { exportTableToPdf, exportToCsv } from '../utils/export';
import { AuthGateNotice } from './AuthGateNotice';

const STUDIO_COVER_PRESETS = [
  {
    label: 'Excel / Productividad',
    url: '/src/assets/images/course_excel_basico_1795186770853.jpg',
  },
  {
    label: 'Ingeniería',
    url: '/src/assets/images/course_system_architecture_1795146988857.jpg',
  },
  {
    label: 'Datos',
    url: '/src/assets/images/course_data_science_1795146987818.jpg',
  },
  {
    label: 'Diseño',
    url: '/src/assets/images/course_ux_engineering_1795146988343.jpg',
  },
  {
    label: 'Seguridad',
    url: '/src/assets/images/course_cybersecurity_e2ee_1795146988090.jpg',
  },
];

export const InstructorDashboard: React.FC = () => {
  const {
    user,
    courses,
    instructorEnrollments,
    instructorPayments,
    createCourse,
    setActiveView,
    setSelectedCourseId,
    t,
  } = usePlatform();

  const [searchStudent, setSearchStudent] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Ingeniería');
  const [level, setLevel] = useState<Course['level']>('intermediate');
  const [priceUsd, setPriceUsd] = useState('99');
  const [currency, setCurrency] = useState<Course['currency']>('USD');
  const [moduleTitle, setModuleTitle] = useState('01. Fundamentos y Arquitectura');
  const [lessonTitle, setLessonTitle] = useState('Introducción práctica y objetivos');
  const [coverImage, setCoverImage] = useState('');
  const [generatingCover, setGeneratingCover] = useState(false);
  const [coverError, setCoverError] = useState('');
  const [creating, setCreating] = useState(false);

  const totalRevenueCents = useMemo(
    () => instructorPayments.reduce((acc, p) => acc + (p.status === 'succeeded' ? p.amountCents : 0), 0),
    [instructorPayments]
  );
  const avgProgress = useMemo(() => {
    if (instructorEnrollments.length === 0) return 0;
    const sum = instructorEnrollments.reduce((acc, e) => acc + e.progressPercent, 0);
    return Math.round(sum / instructorEnrollments.length);
  }, [instructorEnrollments]);
  const completedCount = useMemo(
    () => instructorEnrollments.filter((e) => e.progressPercent === 100).length,
    [instructorEnrollments]
  );

  const filteredEnrollments = useMemo(() => {
    const q = searchStudent.trim().toLowerCase();
    if (!q) return instructorEnrollments;
    return instructorEnrollments.filter(
      (e) =>
        e.studentName.toLowerCase().includes(q) ||
        e.courseTitle.toLowerCase().includes(q)
    );
  }, [instructorEnrollments, searchStudent]);

  if (!user) return <AuthGateNotice />;

  const requestGeneratedCover = async (targetTitle?: string): Promise<string> => {
    setGeneratingCover(true);
    setCoverError('');
    try {
      const res = await fetch('/api/v1/courses/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: (targetTitle ?? title).trim() || 'Curso DB Academy',
          category,
          level,
        }),
      });
      if (!res.ok) {
        throw new Error('No se pudo generar la portada');
      }
      const data = (await res.json()) as { coverImage?: string };
      if (data.coverImage) {
        setCoverImage(data.coverImage);
        return data.coverImage;
      }
      throw new Error('Respuesta sin imagen');
    } catch {
      const fallback = STUDIO_COVER_PRESETS[2].url;
      setCoverError('Modo sin conexión: se asignó una portada de respaldo.');
      setCoverImage(fallback);
      return fallback;
    } finally {
      setGeneratingCover(false);
    }
  };

  const handlePublishCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const resolvedCover = coverImage || (await requestGeneratedCover(title));
      const priceCents = Math.max(0, Math.round(Number(priceUsd || 0) * 100));
      const cleanDescription =
        description.trim().length >= 10
          ? description.trim()
          : `${subtitle.trim()} — Programa de formación técnica en tiempo real.`;

      await createCourse({
        title: title.trim(),
        subtitle: subtitle.trim(),
        description: cleanDescription,
        category,
        level,
        priceCents,
        currency,
        coverImage: resolvedCover,
        published: true,
        modulesCount: 1,
        totalLessons: 2,
        modules: [
          {
            id: `mod_${Date.now().toString(36)}`,
            title: moduleTitle,
            durationMinutes: 45,
            quizQuestion: `¿Cuál es el objetivo central de ${title.trim()}?`,
            quizOptions: [
              'Dominar la implementación práctica en producción',
              'Memorizar definiciones teóricas sin aplicación',
              'Omitir las pruebas de validación',
            ],
            quizCorrectIndex: 0,
            lessons: [
              {
                id: `les_${Date.now().toString(36)}_1`,
                title: lessonTitle,
                durationMinutes: 20,
                summary: subtitle.trim(),
                content: cleanDescription,
              },
              {
                id: `les_${Date.now().toString(36)}_2`,
                title: 'Laboratorio aplicado y evaluación final',
                durationMinutes: 25,
                summary: 'Consolidación práctica del módulo.',
                content: 'Aplica los conceptos del módulo mediante un ejercicio verificable paso a paso.',
              },
            ],
          },
        ],
      });
      setShowBuilder(false);
      setTitle('');
      setSubtitle('');
      setDescription('');
      setCoverImage('');
      setCoverError('');
    } finally {
      setCreating(false);
    }
  };

  const handleExportProgressCsv = () => {
    exportToCsv(
      'db-academy-progreso-alumnos',
      ['Alumno', 'Curso', 'Progreso (%)', 'Minutos', 'Estado'],
      filteredEnrollments.map((e) => [
        e.studentName,
        e.courseTitle,
        e.progressPercent,
        e.studyMinutes,
        e.status,
      ])
    );
  };

  const handleExportProgressPdf = () => {
    exportTableToPdf(
      'db-academy-progreso-alumnos',
      t('liveProgressTable'),
      `Generado: ${new Date().toLocaleDateString('es-ES')}`,
      ['Alumno', 'Curso', 'Progreso (%)', 'Estudio (min)', 'Estado'],
      filteredEnrollments.map((e) => [
        e.studentName,
        e.courseTitle,
        `${e.progressPercent}%`,
        e.studyMinutes,
        e.status === 'completed' ? t('completedBadge') : 'En curso',
      ])
    );
  };

  const handleExportPaymentsCsv = () => {
    exportToCsv(
      'db-academy-pagos-ingresos',
      ['Referencia', 'Curso', 'Pasarela', 'Monto', 'Moneda', 'Estado'],
      instructorPayments.map((p) => [
        p.transactionRef,
        p.courseTitle,
        p.gateway,
        (p.amountCents / 100).toFixed(2),
        p.currency,
        p.status,
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('instructorTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {courses.length} cursos activos · Sincronización en tiempo real
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowBuilder((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>{t('createCourseBtn')}</span>
        </button>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('kpiStudents')}</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {instructorEnrollments.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('kpiRevenue')}</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            ${(totalRevenueCents / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('kpiAvgProgress')}</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
            {avgProgress}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('kpiCertificates')}</p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {completedCount}
          </p>
        </div>
      </div>

      {/* Course Builder Panel */}
      {showBuilder && (
        <form
          onSubmit={(e) => void handlePublishCourse(e)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t('courseBuilderTitle')}
            </h2>
            <button
              type="button"
              onClick={() => setShowBuilder(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Course Metadata Fields */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  minLength={3}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título del curso"
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input
                  type="text"
                  required
                  minLength={3}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Subtítulo breve"
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Categoría (ej. Productividad, Datos)"
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as Course['level'])}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="beginner">{t('beginner')}</option>
                    <option value="intermediate">{t('intermediate')}</option>
                    <option value="advanced">{t('advanced')}</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={priceUsd}
                    onChange={(e) => setPriceUsd(e.target.value)}
                    placeholder="Precio"
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Course['currency'])}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="MXN">MXN</option>
                  </select>
                </div>
                <input
                  type="text"
                  required
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="Título del módulo 1"
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  required
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Título de la lección inicial"
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción académica del programa (mínimo 10 caracteres)"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Cover Image Generator & Preview */}
            <div className="lg:col-span-5 space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {t('coverPlaceholderLabel')}
                </span>
                <button
                  type="button"
                  disabled={generatingCover}
                  onClick={() => void requestGeneratedCover()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3 py-1.5 text-xs font-medium text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-60 transition-opacity whitespace-nowrap shrink-0"
                >
                  {generatingCover ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{generatingCover ? t('generatingCover') : t('generateCover')}</span>
                </button>
              </div>

              <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 flex items-center justify-center">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={title || 'Vista previa de portada'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 px-4 text-center text-slate-400">
                    <ImageIcon className="w-7 h-7 opacity-75" />
                    <span className="text-[11px] leading-snug">
                      Se generará automáticamente al publicar o pulsa &ldquo;{t('generateCover')}&rdquo;
                    </span>
                  </div>
                )}
              </div>

              {coverError && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">{coverError}</p>
              )}

              <div className="space-y-1.5">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  O selecciona una portada de estudio:
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {STUDIO_COVER_PRESETS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      title={preset.label}
                      onClick={() => {
                        setCoverImage(preset.url);
                        setCoverError('');
                      }}
                      className={`aspect-video rounded overflow-hidden border transition-all ${
                        coverImage === preset.url
                          ? 'border-blue-600 ring-2 ring-blue-600/40'
                          : 'border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={creating || generatingCover}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors min-h-[42px]"
            >
              {(creating || generatingCover) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{t('publishCourse')}</span>
            </button>
          </div>
        </form>
      )}

      {/* Active Courses Strip */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Cursos publicados en {t('brand')}
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {courses.length} programas
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={() => {
                setSelectedCourseId(course.id);
                setActiveView('catalog');
              }}
              className="group text-left rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-900/40"
            >
              <div className="aspect-video w-full bg-slate-900 overflow-hidden">
                {course.coverImage ? (
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="p-3.5">
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  {course.category} · {course.totalLessons} {t('lessonsLabel')}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                  {course.title}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Real-Time Student Progress Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t('liveProgressTable')}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Filtrar alumno..."
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <button
              type="button"
              onClick={handleExportProgressCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportProgressPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-5 font-medium">Estudiante</th>
                <th className="py-3 px-5 font-medium">Curso</th>
                <th className="py-3 px-5 font-medium text-right">Estudio</th>
                <th className="py-3 px-5 font-medium text-right">Progreso</th>
                <th className="py-3 px-5 font-medium text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    Sin inscripciones registradas todavía. Inscríbete en un curso para visualizar el seguimiento en tiempo real.
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((enr) => (
                  <tr key={enr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-5 font-medium text-slate-900 dark:text-slate-100">
                      {enr.studentName}
                    </td>
                    <td className="py-3 px-5 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {enr.courseTitle}
                    </td>
                    <td className="py-3 px-5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {enr.studyMinutes} min
                    </td>
                    <td className="py-3 px-5 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {enr.progressPercent}%
                    </td>
                    <td className="py-3 px-5 text-right">
                      <span
                        className={
                          enr.status === 'completed'
                            ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                            : 'text-blue-600 dark:text-blue-400 font-medium'
                        }
                      >
                        {enr.status === 'completed' ? t('completedBadge') : 'Activo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Gateway Transactions Ledger */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Registro de pasarelas de pago
          </h2>
          <button
            type="button"
            onClick={handleExportPaymentsCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{t('exportCsv')}</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-5 font-medium">Referencia</th>
                <th className="py-3 px-5 font-medium">Curso</th>
                <th className="py-3 px-5 font-medium">Pasarela</th>
                <th className="py-3 px-5 font-medium text-right">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {instructorPayments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500 dark:text-slate-400">
                    Sin transacciones registradas aún.
                  </td>
                </tr>
              ) : (
                instructorPayments.map((pay) => (
                  <tr key={pay.id}>
                    <td className="py-3 px-5 font-mono text-slate-700 dark:text-slate-300">
                      {pay.transactionRef}
                    </td>
                    <td className="py-3 px-5 text-slate-900 dark:text-slate-100 max-w-xs truncate">
                      {pay.courseTitle}
                    </td>
                    <td className="py-3 px-5 uppercase text-slate-600 dark:text-slate-300">
                      {pay.gateway}
                    </td>
                    <td className="py-3 px-5 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {(pay.amountCents / 100).toFixed(2)} {pay.currency}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Circle,
  FileDown,
  FileSpreadsheet,
  Plus,
  Trash2,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import type { CalendarEvent } from '../types';
import { exportEventsToIcs, exportTableToPdf, exportToCsv } from '../utils/export';
import { AuthGateNotice } from './AuthGateNotice';

export const CalendarTasksView: React.FC = () => {
  const {
    user,
    courses,
    calendarEvents,
    privateInfo,
    createCalendarEvent,
    toggleCalendarEventComplete,
    deleteCalendarEvent,
    updateNotificationPrefs,
    triggerPushAlert,
    t,
  } = usePlatform();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<CalendarEvent['type']>('deadline');
  const [priority, setPriority] = useState<CalendarEvent['priority']>('high');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [reminderMinutes, setReminderMinutes] = useState(60);
  const [courseId, setCourseId] = useState('');
  const [permState, setPermState] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const sortedEvents = useMemo(
    () =>
      [...calendarEvents].sort(
        (a, b) => new Date(a.dueAtIso).getTime() - new Date(b.dueAtIso).getTime()
      ),
    [calendarEvents]
  );

  if (!user) return <AuthGateNotice />;

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const course = courses.find((c) => c.id === courseId);
    await createCalendarEvent({
      title,
      type,
      priority,
      dueAtIso: new Date(dueDate).toISOString(),
      completed: false,
      reminderMinutes,
      courseId: course?.id || '',
      courseTitle: course?.title || '',
    });
    setTitle('');
    triggerPushAlert('deadline', 'Calendario sincronizado', title);
  };

  const handleRequestBrowserPush = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setPermState(perm);
    await updateNotificationPrefs({ pushEnabled: perm === 'granted' });
    if (perm === 'granted') {
      triggerPushAlert('sync', 'Notificaciones push activadas', 'Alertas sincronizadas con tu calendario.', true);
    }
  };

  const handleExportCsv = () => {
    exportToCsv(
      'db-academy-calendario-tareas',
      ['Título', 'Tipo', 'Prioridad', 'Vencimiento', 'Completada'],
      sortedEvents.map((ev) => [
        ev.title,
        ev.type,
        ev.priority,
        new Date(ev.dueAtIso).toLocaleString('es-ES'),
        ev.completed ? 'Sí' : 'No',
      ])
    );
  };

  const handleExportPdf = () => {
    exportTableToPdf(
      'db-academy-calendario-tareas',
      t('calendarTitle'),
      `Usuario: ${user.displayName || user.email}`,
      ['Título', 'Tipo', 'Prioridad', 'Vencimiento', 'Estado'],
      sortedEvents.map((ev) => [
        ev.title,
        ev.type,
        ev.priority,
        new Date(ev.dueAtIso).toLocaleString('es-ES'),
        ev.completed ? t('completedBadge') : 'Pendiente',
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('calendarTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {sortedEvents.filter((e) => !e.completed).length} tareas pendientes · Sincronizado en todos tus dispositivos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportEventsToIcs(sortedEvents)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('exportIcs')}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(320px,28vw)] gap-6 2xl:gap-10 items-start">
        {/* Left: Add Event & Task List */}
        <div className="min-w-0 space-y-5">
          <form
            onSubmit={(e) => void handleAddEvent(e)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3"
          >
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t('addTaskBtn')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                minLength={2}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entrega de proyecto, examen o tarea"
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
              <input
                type="datetime-local"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100"
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CalendarEvent['type'])}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="deadline">Fecha límite</option>
                <option value="task">Tarea pendiente</option>
                <option value="live_session">Sesión en vivo</option>
                <option value="exam">Evaluación</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as CalendarEvent['priority'])}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="high">Alta</option>
                  <option value="medium">Media</option>
                  <option value="low">Baja</option>
                </select>
                <select
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value={15}>15 min antes</option>
                  <option value={60}>1 hora antes</option>
                  <option value={1440}>24 horas antes</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 max-w-full sm:max-w-xs"
              >
                <option value="">General (sin curso específico)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 min-h-[40px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Guardar en calendario</span>
              </button>
            </div>
          </form>

          {/* Agenda Items */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] divide-y divide-slate-100 dark:divide-slate-800">
            {sortedEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No tienes eventos o fechas límite registradas aún.
              </div>
            ) : (
              sortedEvents.map((ev) => {
                const isOverdue = !ev.completed && new Date(ev.dueAtIso).getTime() < Date.now();
                return (
                  <div
                    key={ev.id}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => void toggleCalendarEventComplete(ev)}
                      className="flex items-start gap-3 text-left min-w-0 flex-1"
                    >
                      {ev.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            ev.completed
                              ? 'line-through text-slate-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {ev.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-mono tabular-nums">
                            {new Date(ev.dueAtIso).toLocaleString('es-ES', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              isOverdue
                                ? 'text-red-600 dark:text-red-400 font-medium'
                                : ev.priority === 'high'
                                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                                  : ''
                            }
                          >
                            {isOverdue ? 'Vencida' : ev.priority}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Aviso {ev.reminderMinutes}m antes</span>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => void deleteCalendarEvent(ev.id)}
                      aria-label="Eliminar evento"
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Customizable Push Notifications Panel */}
        <div className="min-w-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t('pushSettingsTitle')}
            </h2>
            <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => void handleRequestBrowserPush()}
              className="w-full rounded-lg bg-slate-900 dark:bg-slate-100 px-4 py-2.5 text-xs font-medium text-white dark:text-slate-900 hover:opacity-90 transition-opacity min-h-[42px]"
            >
              {t('enablePushBrowser')} ({permState})
            </button>

            <button
              type="button"
              onClick={() =>
                triggerPushAlert(
                  'deadline',
                  'Alerta de flujo de trabajo',
                  'Tienes tareas pendientes sincronizadas en tu calendario.',
                  true
                )
              }
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[40px]"
            >
              {t('testPushBtn')}
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 pt-2">
            {(
              [
                { key: 'notifyDeadlines', label: 'Fechas límite del calendario' },
                { key: 'notifyForumReplies', label: 'Respuestas en foros de discusión' },
                { key: 'notifyPayments', label: 'Confirmaciones de pasarelas de pago' },
                { key: 'notifyCertificates', label: 'Emisión automática de certificados' },
              ] as const
            ).map((item) => {
              const checked = privateInfo ? Boolean(privateInfo[item.key]) : true;
              return (
                <label
                  key={item.key}
                  className="py-3 flex items-center justify-between gap-3 cursor-pointer text-xs text-slate-700 dark:text-slate-200"
                >
                  <span>{item.label}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      void updateNotificationPrefs({ [item.key]: e.target.checked })
                    }
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                Silencio desde
              </label>
              <input
                type="time"
                value={privateInfo?.quietHoursStart || '22:00'}
                onChange={(e) =>
                  void updateNotificationPrefs({ quietHoursStart: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                Silencio hasta
              </label>
              <input
                type="time"
                value={privateInfo?.quietHoursEnd || '07:00'}
                onChange={(e) =>
                  void updateNotificationPrefs({ quietHoursEnd: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

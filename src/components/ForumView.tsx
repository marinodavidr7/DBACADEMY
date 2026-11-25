import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from '../lib/supabase/firestoreAdapter';
import {
  CheckCircle2,
  Info,
  Lightbulb,
  ListChecks,
  MessageSquare,
  Pin,
  Send,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { handleFirestoreError, OperationType } from '../firebase';
import { db } from '../lib/supabase/firestoreAdapter';
import { SEED_FORUM_REPLIES } from '../data/seedForum';
import type { ForumReply, ForumThread } from '../types';
import { AuthGateNotice } from './AuthGateNotice';

const WelcomeThreadContent: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 1. Sobre este foro */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
          <Info className="w-4 h-4 shrink-0" />
          <span>Sobre este foro</span>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          ¡Te damos la bienvenida al <strong className="font-semibold text-slate-900 dark:text-slate-100">Curso de Excel de DB Academy</strong>! Este foro es el primer punto de encuentro con la comunidad del curso. Aquí podrás presentarte, compartir tu experiencia utilizando hojas de cálculo y contar qué te motivó a fortalecer tus conocimientos en Excel.
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          No importa si utilizas Excel con frecuencia o si estás dando tus primeros pasos. Lo importante es reconocer desde qué nivel comienzas, qué tareas realizas actualmente y qué esperas lograr al aprender a organizar, calcular, analizar y presentar información de manera más eficiente.
        </p>
      </div>

      {/* 2. ¿Qué incluir en tu presentación? */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <ListChecks className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>¿Qué incluir en tu presentación?</span>
        </div>
        <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>Tu nombre y desde qué país o ciudad participas.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>A qué te dedicas actualmente o qué estás estudiando.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>Qué experiencia tienes utilizando Excel u otras herramientas de hojas de cálculo.</span>
          </li>
        </ul>
      </div>

      {/* 3. Reflexiona y comparte */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Reflexiona y comparte</span>
        </div>
        <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>¿Qué te motivó a inscribirte en este Curso de Excel?</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>¿Qué tarea te gustaría realizar de forma más rápida, organizada o precisa utilizando Excel?</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>¿En qué contexto académico, laboral o personal esperas aplicar lo aprendido?</span>
          </li>
        </ul>
      </div>

      {/* 4. Un ejemplo para inspirarte */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>Un ejemplo para inspirarte</span>
        </div>
        <blockquote className="rounded-r-lg border-l-4 border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/20 p-4 text-sm italic text-slate-700 dark:text-slate-300 leading-relaxed">
          &ldquo;¡Hola! Soy Daniel y trabajo en el área administrativa de una empresa. Actualmente utilizo Excel para registrar información y hacer cálculos sencillos, pero quiero aprender a organizar mejor los datos y aprovechar las fórmulas, funciones, tablas y gráficos. Mi objetivo es elaborar reportes con mayor rapidez y reducir errores en las tareas que realizo cada semana.&rdquo;
        </blockquote>
      </div>
    </div>
  );
};

export const ForumView: React.FC = () => {
  const {
    user,
    courses,
    forumThreads,
    isAdmin,
    createForumThread,
    addForumReply,
    upvoteForumThread,
    toggleForumThreadState,
    t,
  } = usePlatform();

  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pinned' | 'unresolved'>('all');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);

  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCourseId, setNewCourseId] = useState(courses[0]?.id || '');
  const [replyText, setReplyText] = useState('');
  const [showComposer, setShowComposer] = useState(false);

  const filteredThreads = useMemo(() => {
    return [...forumThreads]
      .filter((th) => {
        if (courseFilter !== 'all' && th.courseId !== courseFilter) return false;
        if (statusFilter === 'pinned' && !th.pinned) return false;
        if (statusFilter === 'unresolved' && th.resolved) return false;
        return true;
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [forumThreads, courseFilter, statusFilter]);

  const activeThread: ForumThread | null = useMemo(() => {
    if (selectedThreadId) {
      return filteredThreads.find((th) => th.id === selectedThreadId) || filteredThreads[0] || null;
    }
    return filteredThreads[0] || null;
  }, [filteredThreads, selectedThreadId]);

  useEffect(() => {
    if (!user || !activeThread) {
      setReplies([]);
      return;
    }
    const currentThreadId = activeThread.id;
    const q = query(
      collection(db, 'forumThreads', currentThreadId, 'replies'),
      where('threadId', '==', currentThreadId)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => d.data() as ForumReply);
        if (items.length > 0) {
          items.sort((a, b) => {
            const ta = (a.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
            const tb = (b.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
            return ta - tb;
          });
          setReplies(items);
        } else if (SEED_FORUM_REPLIES[currentThreadId]) {
          setReplies(SEED_FORUM_REPLIES[currentThreadId]);
        } else {
          setReplies([]);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `forumThreads/${currentThreadId}/replies`);
        if (SEED_FORUM_REPLIES[currentThreadId]) {
          setReplies(SEED_FORUM_REPLIES[currentThreadId]);
        }
      }
    );
    return () => unsub();
  }, [user, activeThread]);

  if (!user) return <AuthGateNotice />;

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCourse = newCourseId || courses[0]?.id;
    if (!targetCourse) return;
    await createForumThread(targetCourse, newTitle, newBody);
    setNewTitle('');
    setNewBody('');
    setShowComposer(false);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim()) return;
    await addForumReply(activeThread, replyText);
    setReplyText('');
  };

  const canModerate = (th: ForumThread) =>
    Boolean(isAdmin || th.authorId === user.uid);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('forumTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {forumThreads.length} debates activos · Sincronización instantánea
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowComposer((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap min-h-[42px]"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{t('newThread')}</span>
        </button>
      </div>

      {showComposer && (
        <form
          onSubmit={(e) => void handleCreateThread(e)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              value={newCourseId || courses[0]?.id || ''}
              onChange={(e) => setNewCourseId(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              minLength={3}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título de tu pregunta o tema"
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <textarea
            rows={3}
            required
            minLength={3}
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Describe el contexto o duda..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 min-h-[40px]"
            >
              {t('postThread')}
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
        >
          <option value="all">{t('allCategories')}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
          {(
            [
              { id: 'all', label: t('allCategories') },
              { id: 'pinned', label: t('pinned') },
              { id: 'unresolved', label: 'Abiertos' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Split Thread List + Conversation View */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(320px,28vw)_minmax(0,1fr)] gap-6 2xl:gap-10 items-start">
        <div className="min-w-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] divide-y divide-slate-100 dark:divide-slate-800">
          {filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No hay debates en esta vista. Inicia el primer tema de discusión.
            </div>
          ) : (
            filteredThreads.map((th) => {
              const selected = activeThread?.id === th.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setSelectedThreadId(th.id)}
                  className={`w-full text-left p-4 transition-colors ${
                    selected
                      ? 'bg-blue-50/70 dark:bg-blue-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{th.authorName}</span>
                    {th.pinned && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-blue-600 dark:text-blue-400 font-medium">{t('pinned')}</span>
                      </>
                    )}
                    {th.resolved && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t('resolved')}</span>
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {th.title}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>{th.upvotesCount} votos</span>
                    <span>{th.repliesCount} respuestas</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
          {activeThread ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{activeThread.authorName}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {courses.find((c) => c.id === activeThread.courseId)?.title || activeThread.courseId}
                    </span>
                  </div>
                  <h2 className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {activeThread.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void upvoteForumThread(activeThread)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span className="tabular-nums">{activeThread.upvotesCount}</span>
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => void toggleForumThreadState(activeThread, 'pinned')}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Pin className="w-3.5 h-3.5" />
                      <span>{t('pinned')}</span>
                    </button>
                  )}
                  {canModerate(activeThread) && (
                      <button
                        type="button"
                        onClick={() => void toggleForumThreadState(activeThread, 'resolved')}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('resolved')}</span>
                      </button>
                  )}
                </div>
              </div>

              {activeThread.id === 'thr_bienvenida_excel' || activeThread.title.toLowerCase().includes('bienvenida') ? (
                <WelcomeThreadContent />
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {activeThread.body}
                </p>
              )}

              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                {replies.map((rep) => (
                  <div
                    key={rep.id}
                    className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4"
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {rep.authorName}
                      </span>
                      {rep.isInstructorAnswer && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">
                            {t('instructorTag')}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-200">{rep.body}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={(e) => void handleSendReply(e)} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('replyPlaceholder')}
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 min-h-[40px]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('sendReply')}</span>
                </button>
              </form>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Selecciona o crea un debate para colaborar con profesores y alumnos.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  Gift,
  Lock,
  LogIn,
  SearchX,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import type {
  Course,
  CurrencyCode,
  GiftCardValidationErrorCode,
  GiftCardValidationResult,
} from '../types';
import { formatCurrency } from '../utils/currency';

interface RedeemGiftCardModalProps {
  initialCourse?: Course | null;
  onClose: () => void;
  onEnrolled: (courseId: string) => void;
  onContinuePartialCheckout?: (course: Course, code: string) => void;
}

interface ValidationFeedback {
  kind: GiftCardValidationErrorCode | 'unknown';
  title: string;
  message: string;
  hint: string;
}

function buildValidationFeedback(
  errorCode: GiftCardValidationErrorCode | undefined,
  reason: string | undefined
): ValidationFeedback {
  switch (errorCode) {
    case 'not_found':
      return {
        kind: 'not_found',
        title: 'Código inexistente',
        message: reason || 'No encontramos ninguna Gift Card registrada con ese código.',
        hint: 'Revisa que hayas escrito bien las letras, números y guiones (ej. DBA-XXXX-XXXX).',
      };
    case 'used':
      return {
        kind: 'used',
        title: 'Código ya utilizado',
        message: reason || 'Esta Gift Card ya fue canjeada y su saldo quedó en RD$0.00.',
        hint: 'Si ya la canjeaste anteriormente, revisa tus cursos activos o solicita un código nuevo.',
      };
    case 'expired':
      return {
        kind: 'expired',
        title: 'Código expirado',
        message: reason || 'Esta Gift Card superó su fecha de vencimiento.',
        hint: 'Contacta con tu instructor o soporte académico para validar si aplica renovación.',
      };
    case 'disabled':
      return {
        kind: 'disabled',
        title: 'Código desactivado',
        message: reason || 'Esta Gift Card fue desactivada temporalmente por el administrador.',
        hint: 'Comunícate con el administrador de la academia para habilitarla.',
      };
    case 'invalid_format':
      return {
        kind: 'invalid_format',
        title: 'Formato de código inválido',
        message: reason || 'El código ingresado no tiene un formato válido.',
        hint: 'Usa únicamente letras, números y guiones (entre 6 y 64 caracteres).',
      };
    case 'course_mismatch':
      return {
        kind: 'course_mismatch',
        title: 'Código válido para otro curso',
        message: reason || 'Esta Gift Card está asignada a un curso específico distinto.',
        hint: 'Canjea el código desde el catálogo general para abrir el curso asignado.',
      };
    case 'currency_mismatch':
      return {
        kind: 'currency_mismatch',
        title: 'Moneda incompatible',
        message: reason || 'La moneda de la Gift Card no coincide con la del curso seleccionado.',
        hint: 'Selecciona un curso emitido en la misma moneda de tu Gift Card.',
      };
    case 'already_enrolled':
      return {
        kind: 'already_enrolled',
        title: 'Ya estás inscrito',
        message: reason || 'Tu cuenta ya tiene acceso a este curso.',
        hint: 'Conserva tu código para otro programa del catálogo.',
      };
    case 'free_course':
      return {
        kind: 'free_course',
        title: 'Curso gratuito',
        message: reason || 'Este curso no requiere pago ni Gift Card.',
        hint: 'Puedes inscribirte directamente sin gastar el saldo de tu tarjeta.',
      };
    case 'auth_required':
      return {
        kind: 'auth_required',
        title: 'Sesión requerida',
        message: reason || 'Debes iniciar sesión para verificar y canjear una Gift Card.',
        hint: 'Inicia sesión con tu cuenta de estudiante e inténtalo de nuevo.',
      };
    case 'network':
      return {
        kind: 'network',
        title: 'Error de verificación',
        message: reason || 'No se pudo comprobar el código en el servidor en este momento.',
        hint: 'Verifica tu conexión a internet e intenta nuevamente en unos segundos.',
      };
    default:
      return {
        kind: 'unknown',
        title: 'Código no válido',
        message: reason || 'No fue posible validar esta Gift Card.',
        hint: 'Verifica el código e inténtalo nuevamente.',
      };
  }
}

function formatMoney(cents: number, currency: CurrencyCode) {
  if (cents === 0) return `Gratis (${formatCurrency(0, currency)})`;
  return formatCurrency(cents, currency);
}

function formatRedeemErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : 'No se pudo completar el canje.';
  if (raw.startsWith('{') && raw.includes('"operationType"')) {
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      if (parsed.error && parsed.error.toLowerCase().includes('permission')) {
        return 'No tienes permisos suficientes en este momento para completar el canje. Recarga la página o inicia sesión nuevamente.';
      }
      if (parsed.error) return parsed.error;
    } catch {
      // Fallback to raw message
    }
  }
  return raw;
}

export const RedeemGiftCardModal: React.FC<RedeemGiftCardModalProps> = ({
  initialCourse = null,
  onClose,
  onEnrolled,
  onContinuePartialCheckout,
}) => {
  const {
    user,
    isAdmin,
    courses,
    enrollments,
    certificates,
    signInWithGoogle,
    subscribeToGiftCard,
    redeemGiftCardCode,
  } = usePlatform();

  const [codeInput, setCodeInput] = useState('');
  const [liveCode, setLiveCode] = useState('');
  const [subNonce, setSubNonce] = useState(0);
  const [validating, setValidating] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState<ValidationFeedback | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [validation, setValidation] = useState<GiftCardValidationResult | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourse?.id || '');
  const [redeemedSuccess, setRedeemedSuccess] = useState<{
    course: Course;
    transactionRef: string;
  } | null>(null);

  const visibleCourses = useMemo(
    () => courses.filter((c) => (c.published || isAdmin) && c.priceCents > 0),
    [courses, isAdmin]
  );

  const activeCourse = useMemo(() => {
    if (initialCourse) return initialCourse;
    if (validation?.card?.courseId) {
      return courses.find((c) => c.id === validation.card?.courseId) || null;
    }
    return visibleCourses.find((c) => c.id === selectedCourseId) || null;
  }, [initialCourse, validation, courses, visibleCourses, selectedCourseId]);

  const eligibleCourses = useMemo(() => {
    if (!validation?.valid || !validation.card) return visibleCourses;
    const card = validation.card;
    return visibleCourses.filter((c) => {
      if (card.courseId && c.id !== card.courseId) return false;
      if (c.currency !== card.currency) return false;
      return true;
    });
  }, [visibleCourses, validation]);

  const effectiveSummary = useMemo(() => {
    if (!validation?.valid || !validation.card || !activeCourse) return null;
    const card = validation.card;
    const coveredCents = Math.min(card.remainingAmountCents, activeCourse.priceCents);
    const remainingToPayCents = Math.max(0, activeCourse.priceCents - coveredCents);
    const remainingCardBalanceAfterCents = card.singleUse
      ? 0
      : Math.max(0, card.remainingAmountCents - coveredCents);
    const alreadyEnrolled = enrollments.some((e) => e.courseId === activeCourse.id);
    const unmetPrereq =
      !isAdmin &&
      (activeCourse.prerequisites || []).some((pid) => {
        const enr = enrollments.find((e) => e.courseId === pid);
        const cert = certificates.some((c) => c.courseId === pid);
        return !((enr && enr.progressPercent >= 100) || cert);
      });

    return {
      coveredCents,
      remainingToPayCents,
      remainingCardBalanceAfterCents,
      coversFullCourse: remainingToPayCents === 0,
      alreadyEnrolled,
      unmetPrereq,
    };
  }, [validation, activeCourse, enrollments, certificates, isAdmin]);

  // Auto-suscripción en tiempo real tras breve pausa al escribir un código completo
  useEffect(() => {
    if (!user || redeemedSuccess) return;
    const normalized = codeInput.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{8,64}$/.test(normalized) || normalized === liveCode) {
      return;
    }
    const timer = window.setTimeout(() => {
      setValidationFeedback(null);
      setRedeemError(null);
      setValidating(true);
      setLiveCode(normalized);
      setSubNonce((n) => n + 1);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [codeInput, liveCode, user, redeemedSuccess]);

  // Listener en tiempo real sobre giftCards/{liveCode}
  useEffect(() => {
    if (!liveCode || !user || redeemedSuccess) {
      setValidating(false);
      return;
    }

    const unsub = subscribeToGiftCard(liveCode, initialCourse || null, (res) => {
      setValidating(false);
      setValidation(res);
      if (!res.valid) {
        setValidationFeedback(buildValidationFeedback(res.errorCode, res.reason));
        return;
      }
      setValidationFeedback(null);
      if (res.card?.courseId) {
        setSelectedCourseId(res.card.courseId);
      } else if (!initialCourse) {
        setSelectedCourseId((prev) => {
          if (prev && visibleCourses.some((c) => c.id === prev && c.currency === res.card?.currency)) {
            return prev;
          }
          const firstMatch = visibleCourses.find(
            (c) =>
              c.currency === res.card?.currency &&
              !enrollments.some((en) => en.courseId === c.id)
          );
          return firstMatch ? firstMatch.id : prev;
        });
      }
    });

    return () => unsub();
  }, [
    liveCode,
    subNonce,
    initialCourse,
    user,
    redeemedSuccess,
    subscribeToGiftCard,
    visibleCourses,
    enrollments,
  ]);

  const handleValidate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationFeedback(null);
    setRedeemError(null);
    setValidation(null);

    const normalized = codeInput.trim().toUpperCase();
    if (!normalized) {
      setLiveCode('');
      setValidationFeedback(
        buildValidationFeedback('invalid_format', 'Ingresa el código de tu Gift Card antes de verificar.')
      );
      return;
    }
    if (!/^[A-Z0-9_-]{6,64}$/.test(normalized)) {
      setLiveCode('');
      setValidationFeedback(
        buildValidationFeedback(
          'invalid_format',
          'El código debe tener entre 6 y 64 caracteres (solo letras, números y guiones).'
        )
      );
      return;
    }

    setValidating(true);
    setLiveCode(normalized);
    setSubNonce((n) => n + 1);
  };

  const handleRedeemFull = async () => {
    if (!validation?.valid || !validation.card || !activeCourse || !effectiveSummary) return;
    if (!effectiveSummary.coversFullCourse) {
      if (onContinuePartialCheckout) {
        onContinuePartialCheckout(activeCourse, validation.card.code);
      }
      return;
    }

    setValidationFeedback(null);
    setRedeemError(null);
    setRedeeming(true);
    try {
      const result = await redeemGiftCardCode(validation.card.code, activeCourse);
      setRedeemedSuccess({
        course: result.course,
        transactionRef: result.payment.transactionRef,
      });
    } catch (err) {
      setRedeemError(formatRedeemErrorMessage(err));
    } finally {
      setRedeeming(false);
    }
  };

  const renderFeedbackIcon = (kind: ValidationFeedback['kind']) => {
    switch (kind) {
      case 'not_found':
        return <SearchX className="w-4 h-4 shrink-0 mt-0.5" />;
      case 'used':
        return <Ban className="w-4 h-4 shrink-0 mt-0.5" />;
      case 'expired':
        return <Clock className="w-4 h-4 shrink-0 mt-0.5" />;
      case 'disabled':
        return <ShieldOff className="w-4 h-4 shrink-0 mt-0.5" />;
      default:
        return <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />;
    }
  };

  const feedbackToneClass = (kind: ValidationFeedback['kind']) => {
    if (kind === 'expired') {
      return 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/35 text-amber-900 dark:text-amber-200';
    }
    if (kind === 'used') {
      return 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/35 text-orange-900 dark:text-orange-200';
    }
    return 'border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/35 text-red-800 dark:text-red-200';
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs p-4 overflow-y-auto flex items-start sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] shadow-2xl overflow-hidden my-4"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[var(--dba-bg-hero)] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)] flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-amber-300">
                DB Academy · Canje de Código
              </p>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Canjear Gift Card
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!user ? (
            <div className="rounded-xl border border-amber-300/70 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 p-5 text-center space-y-3">
              <p className="text-sm font-semibold text-[var(--dba-text-primary)]">
                Inicia sesión para canjear tu Gift Card
              </p>
              <p className="text-xs text-[var(--dba-text-secondary)]">
                Necesitas tu cuenta de estudiante para vincular el curso desbloqueado a tu perfil.
              </p>
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-4 py-2.5 text-xs font-semibold text-[var(--dba-accent-foreground)] min-h-[40px]"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar sesión con Google</span>
              </button>
            </div>
          ) : redeemedSuccess ? (
            <div className="rounded-xl border border-emerald-300/80 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[var(--dba-text-primary)]">
                  ¡Curso desbloqueado!
                </h4>
                <p className="text-xs text-[var(--dba-text-secondary)] mt-1">
                  Canjeaste tu Gift Card y ya tienes acceso completo a{' '}
                  <strong className="text-[var(--dba-text-primary)]">{redeemedSuccess.course.title}</strong>.
                </p>
                <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 mt-2">
                  Referencia: {redeemedSuccess.transactionRef}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onEnrolled(redeemedSuccess.course.id)}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-5 py-2.5 text-xs font-semibold text-[var(--dba-accent-foreground)] min-h-[42px]"
              >
                <span>Ir al curso ahora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Step 1: Enter Code */}
              <form onSubmit={handleValidate} className="space-y-2">
                <label
                  htmlFor="gift-card-code-input"
                  className="block text-xs font-semibold text-[var(--dba-text-primary)]"
                >
                  Código de tu Gift Card
                </label>
                <div className="flex gap-2">
                  <input
                    id="gift-card-code-input"
                    type="text"
                    value={codeInput}
                    aria-invalid={Boolean(validationFeedback)}
                    onChange={(e) => {
                      setCodeInput(e.target.value.toUpperCase());
                      if (liveCode) setLiveCode('');
                      if (validating) setValidating(false);
                      if (validation) setValidation(null);
                      if (validationFeedback) setValidationFeedback(null);
                      if (redeemError) setRedeemError(null);
                    }}
                    placeholder="Ej: DBA-XXXX-XXXX"
                    className={`flex-1 rounded-lg border bg-[var(--dba-bg-canvas)] px-3.5 py-2.5 text-sm font-mono uppercase text-[var(--dba-text-primary)] placeholder:text-zinc-400 focus:outline-none focus:ring-2 min-h-[44px] transition-colors ${
                      validationFeedback
                        ? 'border-red-500 focus:ring-red-500/40'
                        : validation?.valid
                          ? 'border-emerald-500 focus:ring-emerald-500/40'
                          : 'border-[var(--dba-border)] focus:ring-[var(--dba-accent-ink)]'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={validating || !codeInput.trim()}
                    className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2.5 text-xs font-semibold hover:opacity-90 disabled:opacity-50 whitespace-nowrap min-h-[44px]"
                  >
                    {validating ? 'Verificando...' : 'Verificar'}
                  </button>
                </div>
              </form>

              {validationFeedback && (
                <div
                  role="alert"
                  className={`rounded-xl border px-4 py-3 text-xs flex items-start gap-2.5 ${feedbackToneClass(
                    validationFeedback.kind
                  )}`}
                >
                  {renderFeedbackIcon(validationFeedback.kind)}
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs">{validationFeedback.title}</p>
                    <p className="leading-relaxed">{validationFeedback.message}</p>
                    <p className="text-[11px] opacity-85 pt-0.5">{validationFeedback.hint}</p>
                  </div>
                </div>
              )}

              {/* Step 2: Valid Gift Card Preview + Course Selection */}
              {validation?.valid && validation.card && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-amber-300/70 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/20 p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--dba-accent-ink)] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Gift Card válida · {validation.card.code}</span>
                      </p>
                      <p className="text-xs text-[var(--dba-text-secondary)] mt-0.5">
                        {validation.card.courseId
                          ? `Válida para: ${validation.card.courseTitle || validation.card.courseId}`
                          : 'Válida para cualquier curso del catálogo'}
                        {' · '}
                        {validation.card.singleUse ? 'Uso único' : 'Saldo reutilizable'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-[var(--dba-text-secondary)]">Valor disponible</p>
                      <p className="text-lg font-bold font-mono tabular-nums text-[var(--dba-text-primary)]">
                        {formatMoney(validation.card.remainingAmountCents, validation.card.currency)}
                      </p>
                    </div>
                  </div>

                  {!initialCourse && !validation.card.courseId && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[var(--dba-text-primary)]">
                        Elige el curso que deseas desbloquear
                      </label>
                      {eligibleCourses.length === 0 ? (
                        <p className="text-xs text-[var(--dba-text-secondary)]">
                          No hay cursos de pago disponibles en {validation.card.currency}.
                        </p>
                      ) : (
                        <select
                          value={selectedCourseId}
                          onChange={(e) => {
                            setSelectedCourseId(e.target.value);
                            if (redeemError) setRedeemError(null);
                          }}
                          className="w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2.5 text-xs text-[var(--dba-text-primary)] min-h-[42px]"
                        >
                          <option value="">Selecciona un curso...</option>
                          {eligibleCourses.map((c) => {
                            const enrolled = enrollments.some((e) => e.courseId === c.id);
                            const covered = c.priceCents <= validation.card!.remainingAmountCents;
                            return (
                              <option key={c.id} value={c.id} disabled={enrolled}>
                                {c.title} — {formatMoney(c.priceCents, c.currency)}
                                {enrolled ? ' (Ya inscrito)' : covered ? ' · Cubierto 100%' : ''}
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>
                  )}

                  {activeCourse && effectiveSummary && (
                    <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-4 space-y-2 text-xs">
                      <p className="font-semibold text-sm text-[var(--dba-text-primary)]">
                        {activeCourse.title}
                      </p>
                      <div className="flex justify-between text-[var(--dba-text-secondary)]">
                        <span>Precio del curso</span>
                        <span className="font-mono tabular-nums">
                          {formatMoney(activeCourse.priceCents, activeCourse.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                        <span>Crédito Gift Card ({validation.card.code})</span>
                        <span className="font-mono tabular-nums">
                          -{formatMoney(effectiveSummary.coveredCents, activeCourse.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-[var(--dba-text-primary)] pt-2 border-t border-[var(--dba-border)]">
                        <span>Total a pagar</span>
                        <span className="font-mono tabular-nums">
                          {formatMoney(effectiveSummary.remainingToPayCents, activeCourse.currency)}
                        </span>
                      </div>
                      {!validation.card.singleUse && effectiveSummary.remainingCardBalanceAfterCents > 0 && (
                        <p className="text-[11px] text-[var(--dba-text-secondary)]">
                          Saldo restante en tu tarjeta tras el canje:{' '}
                          <strong className="font-mono">
                            {formatMoney(effectiveSummary.remainingCardBalanceAfterCents, validation.card.currency)}
                          </strong>
                        </p>
                      )}
                    </div>
                  )}

                  {activeCourse && effectiveSummary && (
                    effectiveSummary.alreadyEnrolled ? (
                      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-3 text-xs text-blue-700 dark:text-blue-300">
                        Ya estás inscrito en este curso. Elige otro programa para no gastar tu Gift Card.
                      </div>
                    ) : effectiveSummary.unmetPrereq ? (
                      <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <Lock className="w-4 h-4 shrink-0" />
                        <span>Debes completar el prerrequisito de este curso antes de canjearlo.</span>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-1">
                        {redeemError && (
                          <div
                            role="alert"
                            className="rounded-xl border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/35 px-4 py-3 text-xs text-red-800 dark:text-red-200 flex items-start gap-2.5"
                          >
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <p className="font-bold text-xs">No se pudo completar el canje</p>
                              <p className="leading-relaxed">{redeemError}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] text-[var(--dba-text-secondary)] flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Canje atómico instantáneo</span>
                          </span>
                          <button
                            type="button"
                            disabled={redeeming}
                            onClick={() => void handleRedeemFull()}
                            className="inline-flex items-center gap-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] disabled:opacity-60 px-5 py-2.5 text-xs font-semibold text-[var(--dba-accent-foreground)] transition-colors min-h-[42px]"
                          >
                            <Gift className="w-4 h-4" />
                            <span>
                              {redeeming
                                ? 'Canjeando...'
                                : effectiveSummary.coversFullCourse
                                  ? 'Canjear y obtener curso'
                                  : `Aplicar y pagar ${formatMoney(effectiveSummary.remainingToPayCents, activeCourse.currency)}`}
                            </span>
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

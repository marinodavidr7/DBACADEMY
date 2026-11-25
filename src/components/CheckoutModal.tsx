import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Gift,
  Globe2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import type {
  CouponValidationResult,
  Course,
  GiftCardValidationResult,
  LemonSqueezyStatus,
  PaymentGateway,
  PaymentRecord,
} from '../types';
import { formatCurrency } from '../utils/currency';
import { legalConsentService } from '../services/legalConsentService';
import { legalDocumentPath } from '../services/legalDocuments';

interface CheckoutModalProps {
  course: Course;
  initialGiftCardCode?: string;
  onClose: () => void;
  onSuccess: (courseId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  course,
  initialGiftCardCode = '',
  onClose,
  onSuccess,
}) => {
  const {
    user,
    isAdmin,
    signInWithGoogle,
    enrollWithPayment,
    getLemonSqueezyStatus,
    createLemonSqueezyCheckout,
    verifyAndCompleteLemonSqueezyCheckout,
    subscribeToGiftCard,
    redeemGiftCardForCourse,
    validateCoupon: validateCouponInFirestore,
    t,
  } = usePlatform();

  const [gateway, setGateway] = useState<PaymentGateway>('lemonsqueezy');
  const [testMode, setTestMode] = useState(false);
  const [cardHolder, setCardHolder] = useState(user?.displayName || '');
  const [cardLastFour, setCardLastFour] = useState('4242');
  const [submitting, setSubmitting] = useState(false);
  const [verifyingLemon, setVerifyingLemon] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<PaymentRecord | null>(null);

  const [lsStatus, setLsStatus] = useState<LemonSqueezyStatus | null>(null);
  const [lemonSession, setLemonSession] = useState<{
    checkoutUrl: string;
    paymentId: string;
    testMode?: boolean;
  } | null>(null);

  const [codeMode, setCodeMode] = useState<'gift_card' | 'coupon'>('gift_card');

  const [giftCardCode, setGiftCardCode] = useState(initialGiftCardCode);
  const [liveGiftCardCode, setLiveGiftCardCode] = useState(() =>
    initialGiftCardCode.trim().toUpperCase()
  );
  const [giftCardSubNonce, setGiftCardSubNonce] = useState(0);
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [giftCardError, setGiftCardError] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState<GiftCardValidationResult | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const formatMoney = (cents: number) => formatCurrency(cents, course.currency);

  const originalPrice = course.priceCents;
  const giftCardDiscount = appliedGiftCard?.valid ? appliedGiftCard.coveredCents : 0;
  const couponDiscount =
    !appliedGiftCard?.valid && appliedCoupon?.valid ? appliedCoupon.discountCents : 0;
  const discountCents = giftCardDiscount > 0 ? giftCardDiscount : couponDiscount;
  const finalPrice = Math.max(0, originalPrice - discountCents);

  useEffect(() => {
    let active = true;
    void getLemonSqueezyStatus()
      .then((status) => {
        if (active) setLsStatus(status);
      })
      .catch(() => {
        // Non-blocking status probe
      });
    return () => {
      active = false;
    };
  }, [getLemonSqueezyStatus]);

  // Auto-validación en tiempo real cuando el usuario termina de escribir un código completo
  useEffect(() => {
    if (!user || receipt || lemonSession || codeMode !== 'gift_card') return;
    if (appliedGiftCard?.valid) return;
    const normalized = giftCardCode.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{8,64}$/.test(normalized) || normalized === liveGiftCardCode) {
      return;
    }
    const timer = window.setTimeout(() => {
      setGiftCardLoading(true);
      setGiftCardError('');
      setAppliedCoupon(null);
      setLiveGiftCardCode(normalized);
      setGiftCardSubNonce((n) => n + 1);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [
    giftCardCode,
    liveGiftCardCode,
    codeMode,
    appliedGiftCard?.valid,
    user,
    receipt,
    lemonSession,
  ]);

  // Suscripción en tiempo real a giftCards/{liveGiftCardCode}
  useEffect(() => {
    if (!liveGiftCardCode || !user || receipt) {
      setGiftCardLoading(false);
      return;
    }

    const unsub = subscribeToGiftCard(liveGiftCardCode, course, (res) => {
      setGiftCardLoading(false);
      if (!res.valid) {
        setAppliedGiftCard(null);
        setGiftCardError(res.reason || 'Código de Gift Card inválido.');
        return;
      }
      setGiftCardError('');
      setAppliedCoupon(null);
      setAppliedGiftCard(res);
    });

    return () => unsub();
  }, [liveGiftCardCode, giftCardSubNonce, course, user, receipt, subscribeToGiftCard]);

  const handleValidateGiftCard = (overrideCode?: string) => {
    const raw = (overrideCode ?? giftCardCode).trim().toUpperCase();
    if (!raw) return;
    if (!/^[A-Z0-9_-]{6,64}$/.test(raw)) {
      setLiveGiftCardCode('');
      setAppliedGiftCard(null);
      setGiftCardError(
        'El código debe tener al menos 6 caracteres (letras y números, ej: DBA-XXXX-XXXX).'
      );
      return;
    }
    setGiftCardLoading(true);
    setGiftCardError('');
    setAppliedGiftCard(null);
    setAppliedCoupon(null);
    setLiveGiftCardCode(raw);
    setGiftCardSubNonce((n) => n + 1);
  };

  useEffect(() => {
    const initialNormalized = initialGiftCardCode.trim().toUpperCase();
    if (initialNormalized && user) {
      setLiveGiftCardCode(initialNormalized);
      setGiftCardSubNonce((n) => n + 1);
    }
  }, [initialGiftCardCode, user?.uid]);

  const removeGiftCard = () => {
    setLiveGiftCardCode('');
    setAppliedGiftCard(null);
    setGiftCardCode('');
    setGiftCardError('');
    setGiftCardLoading(false);
  };

  const validateCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError('');
    setAppliedCoupon(null);
    setLiveGiftCardCode('');
    setAppliedGiftCard(null);
    setGiftCardError('');
    try {
      const data = await validateCouponInFirestore(code, course);
      if (!data.valid) {
        setCouponError(data.reason || t('couponInvalid'));
        return;
      }
      setAppliedCoupon(data);
    } catch {
      setCouponError(t('couponInvalid'));
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleVerifyLemonPayment = async () => {
    if (!lemonSession) return;
    setVerifyingLemon(true);
    setError('');
    try {
      const result = await verifyAndCompleteLemonSqueezyCheckout(
        lemonSession.paymentId,
        course.id
      );
      if (result.verified && result.payment) {
        recordCheckoutConsent();
        setReceipt(result.payment);
        setLemonSession(null);
        setTimeout(() => onSuccess(course.id), 700);
      } else {
        setError(
          result.message ||
            'Aún no confirmamos el pago en Lemon Squeezy. Completa el checkout en la pestaña abierta e intenta de nuevo.'
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('checkoutError'));
    } finally {
      setVerifyingLemon(false);
    }
  };

  /** Registra la aceptación solo cuando la transacción se perfecciona (Ley 126-02). */
  const recordCheckoutConsent = () => {
    if (!user) return;
    (['terminos', 'reembolsos'] as const).forEach((docType) => {
      legalConsentService.recordConsent({
        docType,
        userId: user.uid,
        userEmail: user.email || undefined,
      });
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!acceptedTerms) {
      setError(
        'Debes aceptar los Términos y Condiciones y la Política de Cancelación y Reembolsos para continuar.'
      );
      return;
    }

    if (finalPrice > 0 && gateway !== 'lemonsqueezy') {
      if (!cardHolder.trim()) {
        setError(t('cardHolderRequired'));
        return;
      }
      const safeLastFour = cardLastFour.replace(/\D/g, '').slice(-4);
      if (safeLastFour.length !== 4) {
        setError(t('cardDigitsRequired'));
        return;
      }
    }

    setSubmitting(true);
    setError('');
    try {
      if (finalPrice > 0 && gateway === 'lemonsqueezy') {
        const session = await createLemonSqueezyCheckout(course, {
          couponCode: appliedCoupon?.valid ? appliedCoupon.coupon?.code : undefined,
          giftCardCode:
            appliedGiftCard?.valid && appliedGiftCard.card ? appliedGiftCard.card.code : undefined,
        });

        if (!session.freeBypass && session.checkoutUrl) {
          try {
            sessionStorage.setItem(
              'dba_pending_ls_checkout',
              JSON.stringify({
                paymentId: session.paymentId,
                courseId: course.id,
                checkoutId: session.checkoutId,
              })
            );
          } catch {
            // Ignore storage errors
          }
          setLemonSession({
            checkoutUrl: session.checkoutUrl,
            paymentId: session.paymentId,
            testMode: session.testMode,
          });
          return;
        }
      }

      let payment: PaymentRecord;
      if (appliedGiftCard?.valid && appliedGiftCard.card) {
        const res = await redeemGiftCardForCourse(appliedGiftCard.card.code, course, gateway);
        payment = res.payment;
      } else {
        payment = await enrollWithPayment(course, gateway, {
          couponCode: appliedCoupon?.valid ? appliedCoupon.coupon?.code : undefined,
          referralWelcome: true,
          testMode: isAdmin && testMode,
        });
      }
      recordCheckoutConsent();
      setReceipt(payment);
      setTimeout(() => onSuccess(course.id), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('checkoutError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mt-8 bg-[var(--dba-bg-surface)] border border-[var(--dba-border)] rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--dba-bg-hero)] text-white">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-amber-300">
              {t('secureCheckout')}
            </p>
            <h3 className="text-lg font-semibold text-white">{t('checkoutTitle')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-xl border border-[var(--dba-border)] p-4 bg-[var(--dba-bg-canvas)]">
            <p className="text-sm font-semibold text-[var(--dba-text-primary)]">{course.title}</p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between text-[var(--dba-text-secondary)]">
                <span>{t('originalPrice')}</span>
                <span className={discountCents > 0 ? 'line-through opacity-60' : 'font-semibold'}>
                  {formatMoney(originalPrice)}
                </span>
              </div>
              {discountCents > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>
                    {appliedGiftCard?.valid
                      ? `Gift Card (${appliedGiftCard.card?.code})`
                      : t('discount')}
                  </span>
                  <span>-{formatMoney(discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[var(--dba-text-primary)] pt-1.5 border-t border-[var(--dba-border)]">
                <span>{t('total')}</span>
                <span className="font-mono">{formatMoney(finalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Gift Card / Cupón */}
          {!lemonSession && !receipt && (
            <div className="rounded-xl border border-[var(--dba-border)] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCodeMode('gift_card')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                      codeMode === 'gift_card'
                        ? 'bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)]'
                        : 'text-[var(--dba-text-secondary)] hover:text-[var(--dba-text-primary)]'
                    }`}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Gift Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeMode('coupon')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                      codeMode === 'coupon'
                        ? 'bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)]'
                        : 'text-[var(--dba-text-secondary)] hover:text-[var(--dba-text-primary)]'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Cupón</span>
                  </button>
                </div>
                <span className="text-[11px] text-[var(--dba-text-secondary)]">
                  {codeMode === 'gift_card'
                    ? 'Cubre hasta el 100% del curso al instante'
                    : 'Aplica un código promocional'}
                </span>
              </div>

              {codeMode === 'gift_card' ? (
                <div>
                  <div className="flex gap-2">
                    <input
                      value={giftCardCode}
                      onChange={(e) => {
                        setGiftCardCode(e.target.value.toUpperCase());
                        if (liveGiftCardCode) setLiveGiftCardCode('');
                        if (giftCardError) setGiftCardError('');
                        if (giftCardLoading) setGiftCardLoading(false);
                      }}
                      placeholder="Ej: DBA-XXXX-XXXX"
                      disabled={!!appliedGiftCard?.valid || giftCardLoading}
                      className="flex-1 px-3 py-2.5 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] text-sm font-mono uppercase text-[var(--dba-text-primary)]"
                    />
                    {appliedGiftCard?.valid ? (
                      <button
                        type="button"
                        onClick={removeGiftCard}
                        className="px-4 py-2.5 rounded-lg border border-[var(--dba-border)] text-xs font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800"
                      >
                        Quitar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleValidateGiftCard()}
                        disabled={giftCardLoading || !giftCardCode.trim()}
                        className="px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold disabled:opacity-50"
                      >
                        {giftCardLoading ? 'Verificando...' : 'Aplicar código'}
                      </button>
                    )}
                  </div>
                  {giftCardError && <p className="text-xs text-red-500 mt-2">{giftCardError}</p>}
                  {appliedGiftCard?.valid && appliedGiftCard.card && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                      Gift Card {appliedGiftCard.card.code} aplicada: cubre{' '}
                      {formatMoney(appliedGiftCard.coveredCents)}
                      {appliedGiftCard.coversFullCourse
                        ? ' (100% cubierto — no necesitas pasarela externa)'
                        : `. Saldo restante a pagar: ${formatMoney(appliedGiftCard.remainingToPayCents)}`}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder={t('couponPlaceholder')}
                      disabled={!!appliedCoupon?.valid || couponLoading}
                      className="flex-1 px-3 py-2.5 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] text-sm uppercase text-[var(--dba-text-primary)]"
                    />
                    {appliedCoupon?.valid ? (
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="px-4 py-2.5 rounded-lg border border-[var(--dba-border)] text-xs font-semibold hover:bg-stone-100 dark:hover:bg-zinc-800"
                      >
                        {t('removeCoupon')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void validateCoupon()}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold disabled:opacity-50"
                      >
                        {couponLoading ? '...' : t('applyCoupon')}
                      </button>
                    )}
                  </div>
                  {couponError && <p className="text-xs text-red-500 mt-2">{couponError}</p>}
                  {appliedCoupon?.valid && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                      {t('couponApplied')}: {appliedCoupon.coupon?.code} —{' '}
                      {appliedCoupon.coupon?.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {!user ? (
            <div className="rounded-xl border border-amber-300/70 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/60 p-4">
              <p className="text-sm text-amber-900 dark:text-amber-200 mb-3">
                {t('loginToEnroll')}
              </p>
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="px-4 py-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] text-[var(--dba-accent-foreground)] text-xs font-semibold"
              >
                {t('signInGoogle')}
              </button>
            </div>
          ) : receipt ? (
            <div className="rounded-xl border border-emerald-300/80 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800/60 p-4">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                {t('paymentConfirmed')}
              </div>
              <p className="text-sm text-emerald-700/90 dark:text-emerald-300/90 mt-1">
                {t('transactionRef')}: {receipt.transactionRef}
              </p>
            </div>
          ) : lemonSession ? (
            <div className="rounded-xl border border-violet-300/80 dark:border-violet-800/70 bg-violet-50/70 dark:bg-violet-950/30 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-violet-900 dark:text-violet-200 font-semibold text-sm">
                    <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span>Sesión de pago lista en Lemon Squeezy</span>
                  </div>
                  <p className="text-xs text-violet-800/90 dark:text-violet-300/90">
                    Abre la pasarela segura de Lemon Squeezy para completar el pago y luego haz clic
                    en verificar (o regresa automáticamente al finalizar).
                  </p>
                </div>
                {lemonSession.testMode && (
                  <span className="shrink-0 rounded-md bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 px-2 py-0.5 text-[10px] font-mono font-semibold text-amber-800 dark:text-amber-200">
                    TEST MODE
                  </span>
                )}
              </div>

              {error && <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex flex-col sm:flex-row gap-2.5">
                <a
                  href={lemonSession.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white min-h-[42px] transition-colors"
                >
                  <span>Abrir checkout en app.lemonsqueezy.com</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>
                <button
                  type="button"
                  disabled={verifyingLemon}
                  onClick={() => void handleVerifyLemonPayment()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-300 dark:border-violet-700 bg-white dark:bg-zinc-900 hover:bg-violet-50 dark:hover:bg-violet-950/60 px-4 py-2.5 text-xs font-semibold text-violet-800 dark:text-violet-200 min-h-[42px] disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${verifyingLemon ? 'animate-spin' : ''}`} />
                  <span>{t('lemonSqueezyVerifyBtn')}</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-mono text-[var(--dba-text-secondary)]">
                  ID: {lemonSession.paymentId}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLemonSession(null);
                    setError('');
                  }}
                  className="text-xs font-medium text-[var(--dba-text-secondary)] hover:text-[var(--dba-text-primary)] underline"
                >
                  Cambiar método de pago
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {finalPrice > 0 && (
                <>
                  <div>
                    <p className="text-sm font-medium text-[var(--dba-text-primary)] mb-2">
                      {t('selectGateway')}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'lemonsqueezy', label: 'Lemon Squeezy', Icon: Sparkles },
                        { id: 'stripe', label: 'Stripe', Icon: CreditCard },
                        { id: 'mercadopago', label: 'Mercado Pago', Icon: Globe2 },
                        { id: 'paypal', label: 'PayPal', Icon: ShieldCheck },
                      ].map(({ id, label, Icon }) => (
                        <button
                          type="button"
                          key={id}
                          onClick={() => {
                            setGateway(id as PaymentGateway);
                            setError('');
                          }}
                          className={`px-3 py-2.5 rounded-lg border text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                            gateway === id
                              ? 'border-[var(--dba-accent-ink)] bg-amber-50/70 text-[var(--dba-accent-ink)] dark:bg-amber-950/30 dark:text-amber-300'
                              : 'border-[var(--dba-border)] text-[var(--dba-text-secondary)] hover:text-[var(--dba-text-primary)]'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {gateway === 'lemonsqueezy' ? (
                    <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[var(--dba-text-primary)]">
                          Lemon Squeezy Checkout (app.lemonsqueezy.com)
                        </span>
                        {lsStatus && (
                          <span
                            className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                              lsStatus.configured
                                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                : 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {lsStatus.configured
                              ? lsStatus.testMode
                                ? 'Configurado · Test Mode'
                                : 'Conectado'
                              : 'Faltan Secrets'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--dba-text-secondary)]">
                        {t('lemonSqueezyHostedNote')}
                      </p>
                      {lsStatus && !lsStatus.configured && (
                        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-2.5 text-[11px] text-amber-900 dark:text-amber-200">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>
                            Configura en Secrets del proyecto:{' '}
                            <code className="font-mono">{lsStatus.missingKeys.join(', ')}</code>{' '}
                            (y <code className="font-mono">LEMONSQUEEZY_WEBHOOK_SECRET</code>).
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="text-sm text-[var(--dba-text-primary)]">
                        {t('cardHolder')}
                        <input
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="mt-1 w-full px-3 py-2.5 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] text-sm"
                          placeholder={t('cardHolderPlaceholder')}
                        />
                      </label>
                      <label className="text-sm text-[var(--dba-text-primary)]">
                        {t('cardLast4')}
                        <input
                          value={cardLastFour}
                          onChange={(e) =>
                            setCardLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))
                          }
                          className="mt-1 w-full px-3 py-2.5 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] text-sm"
                          placeholder="4242"
                          inputMode="numeric"
                        />
                      </label>
                    </div>
                  )}
                </>
              )}

              {isAdmin &&
                finalPrice > 0 &&
                !appliedGiftCard?.valid &&
                gateway !== 'lemonsqueezy' && (
                  <label className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                    <input
                      type="checkbox"
                      checked={testMode}
                      onChange={(e) => setTestMode(e.target.checked)}
                    />
                    Modo prueba admin: no genera canjes/recompensas reales
                  </label>
                )}

              <div className="rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-3 space-y-2">
                <label className="flex items-start gap-2.5 text-xs text-[var(--dba-text-primary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      if (e.target.checked && error.includes('Términos')) setError('');
                    }}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    He leído y acepto los{' '}
                    <a
                      href={legalDocumentPath('terminos')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium text-blue-600 dark:text-blue-400"
                    >
                      Términos y Condiciones
                    </a>{' '}
                    y la{' '}
                    <a
                      href={legalDocumentPath('reembolsos')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium text-blue-600 dark:text-blue-400"
                    >
                      Política de Cancelación y Reembolsos
                    </a>{' '}
                    (Ley 358-05 y Ley 126-02).
                  </span>
                </label>
                <p className="text-[11px] text-[var(--dba-text-secondary)] pl-6">
                  Pago único por acceso al curso ({formatMoney(finalPrice)}, sin renovación automática). Impuestos aplicables según pasarela y jurisdicción.
                </p>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex items-center justify-between pt-2 gap-3">
                <p className="text-xs text-[var(--dba-text-secondary)] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {appliedGiftCard?.valid && finalPrice === 0
                    ? 'Canje atómico sin tarjeta bancaria'
                    : t('securePayment')}
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] disabled:opacity-50 text-[var(--dba-accent-foreground)] text-xs sm:text-sm font-semibold min-h-[42px]"
                >
                  {submitting
                    ? t('processingPayment')
                    : appliedGiftCard?.valid && finalPrice === 0
                      ? 'Canjear Gift Card y obtener curso'
                      : finalPrice === 0
                        ? t('enrollFree')
                        : gateway === 'lemonsqueezy'
                          ? t('lemonSqueezyPayLabel')
                          : t('payAndEnroll')}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

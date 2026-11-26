import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Gift,
  ShieldCheck,
  Tag,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import type {
  CouponValidationResult,
  Course,
  GiftCardValidationResult,
  PaymentRecord,
} from '../types';
import { formatCurrency } from '../utils/currency';
import { legalConsentService } from '../services/legalConsentService';
import { legalDocumentPath } from '../services/legalDocuments';
import { PayPalButtonsBox } from './PayPalButtonsBox';

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
    subscribeToGiftCard,
    redeemGiftCardForCourse,
    validateCoupon: validateCouponInFirestore,
    t,
  } = usePlatform();

  const [testMode, setTestMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<PaymentRecord | null>(null);

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
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'card'>('paypal');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const formatMoney = (cents: number) => formatCurrency(cents, course.currency);

  const originalPrice = course.priceCents;
  const giftCardDiscount = appliedGiftCard?.valid ? appliedGiftCard.coveredCents : 0;
  const couponDiscount =
    !appliedGiftCard?.valid && appliedCoupon?.valid ? appliedCoupon.discountCents : 0;
  const discountCents = giftCardDiscount > 0 ? giftCardDiscount : couponDiscount;
  const finalPrice = Math.max(0, originalPrice - discountCents);

  // Auto-validación en tiempo real cuando el usuario termina de escribir un código completo
  useEffect(() => {
    if (!user || receipt || codeMode !== 'gift_card') return;
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

  /** Completa la inscripción automática tras capturar el pago en PayPal. */
  const handlePayPalApproved = async ({
    orderId,
    captureId,
  }: {
    orderId: string;
    captureId: string;
  }) => {
    if (!user) return;
    setSubmitting(true);
    setError('');
    try {
      let recordedPayment: PaymentRecord;
      if (appliedGiftCard?.valid && appliedGiftCard.card) {
        const result = await redeemGiftCardForCourse(
          appliedGiftCard.card.code,
          course,
          'paypal',
          {
            externalPaymentId: `pp_${orderId}`.slice(0, 128),
            externalTransactionRef: captureId || orderId,
          }
        );
        recordedPayment = result.payment;
      } else {
        recordedPayment = await enrollWithPayment(course, 'paypal', {
          couponCode: appliedCoupon?.valid ? appliedCoupon.coupon?.code : undefined,
          testMode: isAdmin ? testMode : false,
          externalPaymentId: `pp_${orderId}`.slice(0, 128),
          externalTransactionRef: captureId || orderId,
        });
      }
      recordCheckoutConsent();
      setReceipt(recordedPayment);
      setTimeout(() => onSuccess(course.id), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('checkoutError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCardConfirm = async () => {
    if (!user || submitting) return;

    const holder = cardHolder.trim();
    const digits = cardNumber.replace(/\D/g, '');
    const expiry = cardExpiry.trim();
    const cvc = cardCvc.replace(/\D/g, '');

    if (!holder) {
      setError('Ingresa el nombre del titular de la tarjeta.');
      return;
    }
    if (digits.length < 13 || digits.length > 19) {
      setError('Ingresa un número de tarjeta válido (13 a 19 dígitos).');
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      setError('Ingresa una fecha de expiración válida (MM/AA).');
      return;
    }
    if (cvc.length < 3 || cvc.length > 4) {
      setError('Ingresa un CVC válido (3 o 4 dígitos).');
      return;
    }
    if (!acceptedTerms) {
      setError(
        'Debes aceptar los Términos y Condiciones y la Política de Cancelación y Reembolsos para continuar.'
      );
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const externalRef = `card_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      let recordedPayment: PaymentRecord;
      if (appliedGiftCard?.valid && appliedGiftCard.card) {
        const result = await redeemGiftCardForCourse(
          appliedGiftCard.card.code,
          course,
          'paypal',
          {
            externalPaymentId: externalRef.slice(0, 128),
            externalTransactionRef: externalRef,
          }
        );
        recordedPayment = result.payment;
      } else {
        recordedPayment = await enrollWithPayment(course, 'paypal', {
          couponCode: appliedCoupon?.valid ? appliedCoupon.coupon?.code : undefined,
          testMode: isAdmin ? testMode : false,
          externalPaymentId: externalRef.slice(0, 128),
          externalTransactionRef: externalRef,
        });
      }
      recordCheckoutConsent();
      setReceipt(recordedPayment);
      setTimeout(() => onSuccess(course.id), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('checkoutError'));
    } finally {
      setSubmitting(false);
    }
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

    if (finalPrice > 0) {
      if (paymentMethod === 'card') {
        await handleCardConfirm();
      }
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      let payment: PaymentRecord;
      if (appliedGiftCard?.valid && appliedGiftCard.card) {
        const res = await redeemGiftCardForCourse(appliedGiftCard.card.code, course, 'gift_card');
        payment = res.payment;
      } else {
        payment = await enrollWithPayment(course, 'free', {
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

  const termsBlock = (
    <div
      className={`rounded-lg border bg-[var(--dba-bg-canvas)] p-3 space-y-2 transition-colors ${
        error.includes('Términos')
          ? 'border-red-400 dark:border-red-500 ring-1 ring-red-400/40'
          : 'border-[var(--dba-border)]'
      }`}
    >
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
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto my-4 sm:my-8 bg-[var(--dba-bg-surface)] border border-[var(--dba-border)] rounded-2xl shadow-2xl overflow-hidden"
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

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna izquierda: resumen + gift card/cupón */}
            <div className="space-y-5">
              <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-4 space-y-4">
                <div>
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

                {!receipt && (
                  <div className="pt-4 border-t border-[var(--dba-border)] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-0.5 text-xs font-semibold">
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
                            className="flex-1 px-3 py-2.5 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] text-sm font-mono uppercase text-[var(--dba-text-primary)]"
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
                            className="flex-1 px-3 py-2.5 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] text-sm uppercase text-[var(--dba-text-primary)]"
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
              </div>
            </div>

            {/* Columna derecha: método de pago / login / recibo */}
            <div className="space-y-5">
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
              ) : (
                <div className="space-y-4">
                  {finalPrice > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-[var(--dba-text-primary)]">
                        Método de pago
                      </p>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('paypal')}
                          className={`flex-1 rounded-xl border p-3 text-left transition-colors ${
                            paymentMethod === 'paypal'
                              ? 'border-[var(--dba-accent)] bg-[var(--dba-accent)]/5 ring-1 ring-[var(--dba-accent)]/40'
                              : 'border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] hover:border-[var(--dba-accent)]/60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#003087] shrink-0" />
                            <span className="text-sm font-semibold text-[var(--dba-text-primary)]">PayPal</span>
                          </div>
                          <p className="text-[11px] text-[var(--dba-text-secondary)] mt-1">Cuenta PayPal</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className={`flex-1 rounded-xl border p-3 text-left transition-colors ${
                            paymentMethod === 'card'
                              ? 'border-[var(--dba-accent)] bg-[var(--dba-accent)]/5 ring-1 ring-[var(--dba-accent)]/40'
                              : 'border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] hover:border-[var(--dba-accent)]/60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-[var(--dba-text-primary)] shrink-0" />
                            <span className="text-sm font-semibold text-[var(--dba-text-primary)]">Tarjeta</span>
                          </div>
                          <p className="text-[11px] text-[var(--dba-text-secondary)] mt-1">Débito o Crédito</p>
                        </button>
                      </div>
                    </div>
                  )}

                  {isAdmin && finalPrice > 0 && !appliedGiftCard?.valid && (
                    <label className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                      <input
                        type="checkbox"
                        checked={testMode}
                        onChange={(e) => setTestMode(e.target.checked)}
                      />
                      Modo prueba admin: no genera canjes/recompensas reales
                    </label>
                  )}

                  {finalPrice > 0 && paymentMethod === 'card' ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] p-4 space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-[var(--dba-text-primary)]">Nombre del titular</label>
                          <input
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            placeholder="Como aparece en la tarjeta"
                            autoComplete="cc-name"
                            className="w-full px-3 py-2.5 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] text-sm text-[var(--dba-text-primary)]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-[var(--dba-text-primary)]">Número de tarjeta</label>
                          <input
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="1234 5678 9012 3456"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            className="w-full px-3 py-2.5 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] text-sm text-[var(--dba-text-primary)]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--dba-text-primary)]">Fecha de expiración (MM/AA)</label>
                            <input
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              placeholder="MM/AA"
                              inputMode="numeric"
                              autoComplete="cc-exp"
                              className="w-full px-3 py-2.5 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] text-sm text-[var(--dba-text-primary)]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--dba-text-primary)]">CVC</label>
                            <input
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value)}
                              placeholder="123"
                              inputMode="numeric"
                              autoComplete="cc-csc"
                              className="w-full px-3 py-2.5 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] text-sm text-[var(--dba-text-primary)]"
                            />
                          </div>
                        </div>
                      </div>

                      {termsBlock}
                      {error && <p className="text-sm text-red-500">{error}</p>}

                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => void handleCardConfirm()}
                        className="w-full px-5 py-3 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] disabled:opacity-50 text-[var(--dba-accent-foreground)] text-sm font-semibold min-h-[44px]"
                      >
                        {submitting ? t('processingPayment') : 'Confirmar Pago'}
                      </button>
                    </div>
                  ) : finalPrice > 0 ? (
                    <div className="space-y-3">
                      {termsBlock}
                      {error && <p className="text-sm text-red-500">{error}</p>}
                      <p className="text-xs text-[var(--dba-text-secondary)] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {t('securePayment')}
                      </p>
                      <PayPalButtonsBox
                        course={course}
                        finalPriceCents={finalPrice}
                        acceptedTerms={acceptedTerms}
                        disabled={submitting}
                        method="paypal"
                        onTermsRequired={() =>
                          setError(
                            'Debes aceptar los Términos y Condiciones y la Política de Cancelación y Reembolsos antes de continuar.'
                          )
                        }
                        onApproved={handlePayPalApproved}
                        onError={(msg) => setError(msg)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {termsBlock}
                      {error && <p className="text-sm text-red-500">{error}</p>}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-3">
                        <p className="text-xs text-[var(--dba-text-secondary)] flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {appliedGiftCard?.valid && finalPrice === 0
                            ? 'Canje atómico sin tarjeta bancaria'
                            : t('securePayment')}
                        </p>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={(e) => void onSubmit(e as unknown as React.FormEvent)}
                          className="px-5 py-2.5 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] disabled:opacity-50 text-[var(--dba-accent-foreground)] text-xs sm:text-sm font-semibold min-h-[42px]"
                        >
                          {submitting
                            ? t('processingPayment')
                            : appliedGiftCard?.valid && finalPrice === 0
                              ? 'Canjear Gift Card y obtener curso'
                              : t('enrollFree')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

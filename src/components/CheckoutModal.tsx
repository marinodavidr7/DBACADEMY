import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Gift,
  Lock,
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
  PaymentGateway,
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

  const [gateway, setGateway] = useState<PaymentGateway>('paypal');
  const [testMode, setTestMode] = useState(false);
  const [cardHolder, setCardHolder] = useState(user?.displayName || '');
  const [cardLastFour, setCardLastFour] = useState('4242');
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
  const [codePanelOpen, setCodePanelOpen] = useState(() => Boolean(initialGiftCardCode.trim()));

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
    if (initialNormalized) {
      setCodePanelOpen(true);
    }
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

  const handlePayPalApproved = async ({
    orderId,
    captureId,
  }: {
    orderId: string;
    captureId: string;
  }) => {
    setError('');
    try {
      if (!user) throw new Error('Debes iniciar sesión para completar el pago.');

      let verifiedCaptureId = captureId;
      const finalAmountCents = Math.max(0, finalPrice);
      if (finalAmountCents > 0) {
        const idToken = await user.getIdToken();
        const verifyResp = await fetch('/api/v1/payments/paypal/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            orderId,
            courseId: course.id,
            couponCode: appliedCoupon?.valid ? appliedCoupon.coupon?.code : undefined,
            referralWelcome: Boolean((user as unknown as { referredBy?: string }).referredBy),
          }),
        });
        const verifyJson = await verifyResp.json().catch(() => ({}));
        if (!verifyResp.ok || !verifyJson?.verified) {
          throw new Error(verifyJson?.error || 'No se pudo verificar el pago con PayPal.');
        }
        if (verifyJson.captureId) verifiedCaptureId = String(verifyJson.captureId);
      }

      let recordedPayment: PaymentRecord;
      if (appliedGiftCard?.valid && appliedGiftCard.card) {
        const res = await redeemGiftCardForCourse(appliedGiftCard.card.code, course, 'paypal', {
          externalPaymentId: 'pp_' + orderId,
          externalTransactionRef: verifiedCaptureId || orderId,
        });
        recordedPayment = res.payment;
      } else {
        recordedPayment = await enrollWithPayment(course, 'paypal', {
          couponCode: appliedCoupon?.valid ? appliedCoupon.coupon?.code : undefined,
          testMode: isAdmin ? testMode : false,
          externalPaymentId: 'pp_' + orderId,
          externalTransactionRef: verifiedCaptureId || orderId,
        });
      }
      recordCheckoutConsent();
      setReceipt(recordedPayment);
      setTimeout(() => onSuccess(course.id), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error verificando el pago con PayPal.');
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

    if (false) {
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
        className="max-w-[560px] w-full mx-auto mt-8 bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-[16px] shadow-2xl overflow-hidden font-sans"
      >
        <div className="flex items-center justify-between gap-3 px-7 py-5 bg-[#0d0d0f] text-white">
          <div className="min-w-0">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#ffd23f]">
              PAGO SEGURO
            </p>
            <h3 className="text-[20px] font-bold text-white leading-tight mt-0.5">Finalizar compra</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de pago"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-7 py-5 space-y-4">
          <div className="rounded-[12px] border border-stone-200 dark:border-zinc-800 p-4 bg-[#f7f5ef] dark:bg-zinc-900/80">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-600 dark:text-zinc-400">
              TU CURSO
            </p>
            <p className="text-[16px] font-semibold text-stone-900 dark:text-zinc-100 mt-1">
              {course.title}
            </p>
            <div className="border-t border-stone-200 dark:border-zinc-700 my-2.5" />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-4 text-stone-600 dark:text-zinc-400">
                <span>Precio original</span>
                <span className={discountCents > 0 ? 'line-through opacity-70' : 'font-medium text-stone-900 dark:text-zinc-100'}>
                  {formatMoney(originalPrice)}
                </span>
              </div>
              {discountCents > 0 && (
                <div className="flex justify-between gap-4 text-[#0b6b4a] dark:text-emerald-400 font-medium">
                  <span>
                    {appliedGiftCard?.valid
                      ? `Gift Card (${appliedGiftCard.card?.code})`
                      : t('discount')}
                  </span>
                  <span>-{formatMoney(discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline gap-4 pt-1">
                <span className="font-semibold text-stone-900 dark:text-zinc-100">Total</span>
                <span className="text-[22px] font-bold tabular-nums text-stone-900 dark:text-zinc-100">
                  {formatMoney(finalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Gift Card / Cupón */}
          {!receipt && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setCodePanelOpen((open) => !open)}
                className="min-h-[44px] inline-flex items-center gap-2 text-[#1d4ed8] dark:text-blue-400 text-sm font-medium hover:underline"
                aria-expanded={codePanelOpen}
              >
                <Tag className="w-4 h-4" aria-hidden="true" />
                <span>¿Tienes un cupón o una gift card?</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${codePanelOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {codePanelOpen && (
                <div className="rounded-[12px] border border-stone-200 dark:border-zinc-800 p-4 space-y-3 bg-white dark:bg-zinc-900/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-900 p-0.5 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setCodeMode('gift_card')}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors min-h-[44px] ${
                          codeMode === 'gift_card'
                            ? 'bg-stone-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                            : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100'
                        }`}
                      >
                        <Gift className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Gift Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCodeMode('coupon')}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors min-h-[44px] ${
                          codeMode === 'coupon'
                            ? 'bg-stone-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                            : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Cupón</span>
                      </button>
                    </div>
                  </div>

                  {codeMode === 'gift_card' ? (
                    <div>
                      <div className="flex flex-col sm:flex-row gap-2">
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
                          className="flex-1 px-3 py-2.5 rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-mono uppercase text-stone-900 dark:text-zinc-100 min-h-[44px]"
                        />
                        {appliedGiftCard?.valid ? (
                          <button
                            type="button"
                            onClick={removeGiftCard}
                            className="px-4 py-2.5 rounded-lg border border-stone-300 dark:border-zinc-700 text-sm font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 min-h-[44px]"
                          >
                            Quitar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleValidateGiftCard()}
                            disabled={giftCardLoading || !giftCardCode.trim()}
                            className="px-4 py-2.5 rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-900 disabled:opacity-50 min-h-[44px]"
                          >
                            {giftCardLoading ? 'Verificando...' : 'Aplicar código'}
                          </button>
                        )}
                      </div>
                      {giftCardError && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{giftCardError}</p>}
                      {appliedGiftCard?.valid && appliedGiftCard.card && (
                        <p className="text-xs text-[#0b6b4a] dark:text-emerald-400 mt-2 font-medium">
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
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder={t('couponPlaceholder')}
                          disabled={!!appliedCoupon?.valid || couponLoading}
                          className="flex-1 px-3 py-2.5 rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm uppercase text-stone-900 dark:text-zinc-100 min-h-[44px]"
                        />
                        {appliedCoupon?.valid ? (
                          <button
                            type="button"
                            onClick={removeCoupon}
                            className="px-4 py-2.5 rounded-lg border border-stone-300 dark:border-zinc-700 text-sm font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 min-h-[44px]"
                          >
                            {t('removeCoupon')}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void validateCoupon()}
                            disabled={couponLoading || !couponCode.trim()}
                            className="px-4 py-2.5 rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-900 disabled:opacity-50 min-h-[44px]"
                          >
                            {couponLoading ? '...' : 'Aplicar código'}
                          </button>
                        )}
                      </div>
                      {couponError && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{couponError}</p>}
                      {appliedCoupon?.valid && (
                        <p className="text-xs text-[#0b6b4a] dark:text-emerald-400 mt-2 font-medium">
                          {t('couponApplied')}: {appliedCoupon.coupon?.code} —{' '}
                          {appliedCoupon.coupon?.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!user ? (
            <div className="rounded-[12px] border border-amber-300/70 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/60 p-4">
              <p className="text-sm text-amber-900 dark:text-amber-200 mb-3">
                {t('loginToEnroll')}
              </p>
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[#ffd23f] hover:bg-[#f5c72f] text-[#0d0d0f] text-sm font-semibold"
              >
                {t('signInGoogle')}
              </button>
            </div>
          ) : receipt ? (
            <div className="rounded-[12px] border border-emerald-300/80 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800/60 p-4">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                {t('paymentConfirmed')}
              </div>
              <p className="text-sm text-emerald-700/90 dark:text-emerald-300/90 mt-1">
                {t('transactionRef')}: {receipt.transactionRef}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {finalPrice > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100">Método de pago</p>
                  <div className="rounded-[12px] border-2 border-[#b27b00] bg-[#fbf8ef] dark:bg-amber-950/20 p-3.5">
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#b27b00]"
                        aria-hidden="true"
                      >
                        <span className="h-2.5 w-2.5 rounded-full bg-[#b27b00]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100">PayPal</p>
                          <span className="text-xs font-semibold text-[#0b6b4a] dark:text-emerald-400 shrink-0">Pago seguro</span>
                        </div>
                        <p className="text-sm text-stone-600 dark:text-zinc-400 mt-0.5">
                          Paga con tarjeta de débito/crédito, sin necesidad de cuenta PayPal.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isAdmin &&
                finalPrice > 0 &&
                !appliedGiftCard?.valid &&
                gateway === 'paypal' && (
                  <label className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={testMode}
                      onChange={(e) => setTestMode(e.target.checked)}
                      className="w-4 h-4"
                    />
                    Modo prueba admin: no genera canjes/recompensas reales
                  </label>
                )}

              <label className="flex items-start gap-3 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    if (e.target.checked && error.includes('Términos')) setError('');
                  }}
                  className="w-5 h-5 shrink-0 mt-0.5 rounded border-stone-300 text-[#1d4ed8] focus:ring-[#1d4ed8]"
                />
                <span className="text-sm text-stone-700 dark:text-zinc-300 leading-relaxed">
                  He leído y acepto los{' '}
                  <a
                    href={legalDocumentPath('terminos')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1d4ed8] dark:text-blue-400 underline font-medium"
                  >
                    Términos y Condiciones
                  </a>{' '}
                  y la{' '}
                  <a
                    href={legalDocumentPath('reembolsos')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1d4ed8] dark:text-blue-400 underline font-medium"
                  >
                    Política de Cancelación y Reembolsos
                  </a>{' '}
                  (Ley 358-05 y Ley 126-02). Pago único por acceso al curso, sin renovación automática. Impuestos según pasarela y jurisdicción.
                </span>
              </label>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              {finalPrice > 0 ? (
                <div className="space-y-3">
                  <PayPalButtonsBox
                    course={course}
                    finalPriceCents={finalPrice}
                    acceptedTerms={acceptedTerms}
                    onTermsRequired={() =>
                      setError(
                        'Debes aceptar los Términos y Condiciones y la Política de Cancelación y Reembolsos para continuar.'
                      )
                    }
                    onApproved={handlePayPalApproved}
                    onError={(message) => setError(message)}
                  />

                  <div className="text-center space-y-2">
                    <p className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-[#0b6b4a] dark:text-emerald-400">
                      <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                      <span>Pago seguro y cifrado</span>
                    </p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <img
                        src="https://www.paypalobjects.com/images/Debit_Credit.svg"
                        alt="Tarjetas aceptadas"
                        className="h-6"
                      />
                      <span className="text-xs text-stone-500 dark:text-zinc-400">y más</span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-zinc-400 flex items-center justify-center gap-1.5">
                      <span>Con la tecnología de</span>
                      <img
                        src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg"
                        alt="PayPal"
                        className="h-[14px]"
                      />
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={(e) => void onSubmit(e as unknown as React.FormEvent)}
                    className="w-full h-[58px] rounded-[12px] bg-[#ffd23f] hover:bg-[#f5c72f] disabled:opacity-50 text-[#0d0d0f] font-bold text-[18px] flex items-center justify-center gap-2.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Lock className="w-5 h-5" aria-hidden="true" />
                    <span>
                      {submitting
                        ? t('processingPayment')
                        : appliedGiftCard?.valid && finalPrice === 0
                          ? 'Canjear Gift Card y obtener curso'
                          : t('enrollFree')}
                    </span>
                  </button>
                  <div className="text-center space-y-2">
                    <p className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-[#0b6b4a] dark:text-emerald-400">
                      <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                      <span>Pago seguro y cifrado</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

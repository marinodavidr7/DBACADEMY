import React, { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, Gift, Globe2, ShieldCheck, Tag, X } from 'lucide-react';
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
    validateGiftCard,
    redeemGiftCardForCourse,
    validateCoupon: validateCouponInFirestore,
    t,
  } = usePlatform();

  const [gateway, setGateway] = useState<PaymentGateway>('stripe');
  const [testMode, setTestMode] = useState(false);
  const [cardHolder, setCardHolder] = useState(user?.displayName || '');
  const [cardLastFour, setCardLastFour] = useState('4242');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<PaymentRecord | null>(null);

  const [codeMode, setCodeMode] = useState<'gift_card' | 'coupon'>('gift_card');

  const [giftCardCode, setGiftCardCode] = useState(initialGiftCardCode);
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [giftCardError, setGiftCardError] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState<GiftCardValidationResult | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);

  const formatMoney = (cents: number) => formatCurrency(cents, course.currency);

  const originalPrice = course.priceCents;
  const giftCardDiscount = appliedGiftCard?.valid ? appliedGiftCard.coveredCents : 0;
  const couponDiscount = !appliedGiftCard?.valid && appliedCoupon?.valid ? appliedCoupon.discountCents : 0;
  const discountCents = giftCardDiscount > 0 ? giftCardDiscount : couponDiscount;
  const finalPrice = Math.max(0, originalPrice - discountCents);

  const handleValidateGiftCard = async (overrideCode?: string) => {
    const raw = (overrideCode ?? giftCardCode).trim().toUpperCase();
    if (!raw) return;
    setGiftCardLoading(true);
    setGiftCardError('');
    setAppliedGiftCard(null);
    setAppliedCoupon(null);
    try {
      const res = await validateGiftCard(raw, course);
      if (!res.valid) {
        setGiftCardError(res.reason || 'Código de Gift Card inválido.');
        return;
      }
      setAppliedGiftCard(res);
    } finally {
      setGiftCardLoading(false);
    }
  };

  useEffect(() => {
    if (initialGiftCardCode.trim() && user) {
      void handleValidateGiftCard(initialGiftCardCode);
    }
  }, [initialGiftCardCode, user?.uid]);

  const removeGiftCard = () => {
    setAppliedGiftCard(null);
    setGiftCardCode('');
    setGiftCardError('');
  };

  const validateCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError('');
    setAppliedCoupon(null);
    setAppliedGiftCard(null);
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (finalPrice > 0) {
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
                    onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
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
                      onClick={() => void handleValidateGiftCard()}
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
                      ? ' (100% cubierto — no necesitas ingresar tarjeta)'
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
                    {t('couponApplied')}: {appliedCoupon.coupon?.code} — {appliedCoupon.coupon?.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {!user ? (
            <div className="rounded-xl border border-amber-300/70 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/60 p-4">
              <p className="text-sm text-amber-900 dark:text-amber-200 mb-3">{t('loginToEnroll')}</p>
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
            <form onSubmit={onSubmit} className="space-y-4">
              {finalPrice > 0 && (
                <>
                  <div>
                    <p className="text-sm font-medium text-[var(--dba-text-primary)] mb-2">
                      {t('selectGateway')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'stripe', label: 'Stripe', Icon: CreditCard },
                        { id: 'mercadopago', label: 'Mercado Pago', Icon: Globe2 },
                        { id: 'paypal', label: 'PayPal', Icon: ShieldCheck },
                      ].map(({ id, label, Icon }) => (
                        <button
                          type="button"
                          key={id}
                          onClick={() => setGateway(id as PaymentGateway)}
                          className={`px-3 py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${
                            gateway === id
                              ? 'border-[var(--dba-accent-ink)] bg-amber-50/70 text-[var(--dba-accent-ink)] dark:bg-amber-950/30 dark:text-amber-300'
                              : 'border-[var(--dba-border)] text-[var(--dba-text-secondary)]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

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
                        onChange={(e) => setCardLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="mt-1 w-full px-3 py-2.5 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] text-sm"
                        placeholder="4242"
                        inputMode="numeric"
                      />
                    </label>
                  </div>
                </>
              )}

              {isAdmin && finalPrice > 0 && !appliedGiftCard?.valid && (
                <label className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                  <input type="checkbox" checked={testMode} onChange={(e) => setTestMode(e.target.checked)} />
                  Modo prueba admin: no genera canjes/recompensas reales
                </label>
              )}

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

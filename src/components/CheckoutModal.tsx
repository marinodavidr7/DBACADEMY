import React, { useState } from 'react';
import { CheckCircle2, CreditCard, Globe2, ShieldCheck, Tag, X } from 'lucide-react';
import { motion } from 'motion/react';
import { usePlatform } from '../context/PlatformContext';
import type { Course, PaymentGateway, PaymentRecord } from '../types';

interface CheckoutModalProps {
  course: Course;
  onClose: () => void;
  onSuccess: (courseId: string) => void;
}

interface CouponValidation {
  valid: boolean;
  originalPriceCents: number;
  discountCents: number;
  finalPriceCents: number;
  reason?: string;
  coupon?: { code: string; description: string; type: 'percent' | 'fixed'; value: number };
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ course, onClose, onSuccess }) => {
  const { user, isAdmin, signInWithGoogle, enrollWithPayment, t } = usePlatform();
  const [gateway, setGateway] = useState<PaymentGateway>('stripe');
  const [testMode, setTestMode] = useState(false);
  const [cardHolder, setCardHolder] = useState(user?.displayName || '');
  const [cardLastFour, setCardLastFour] = useState('4242');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<PaymentRecord | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);

  const formatMoney = (cents: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: course.currency }).format(cents / 100);

  const originalPrice = course.priceCents;
  const discountCents = appliedCoupon?.valid ? appliedCoupon.discountCents : 0;
  const finalPrice = Math.max(0, originalPrice - discountCents);

  const validateCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError('');
    setAppliedCoupon(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, courseId: course.id, priceCents: course.priceCents }),
      });
      const data = (await res.json()) as CouponValidation & { error?: string };
      if (!res.ok || !data.valid) {
        setCouponError(data.reason || data.error || t('couponInvalid'));
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
    if (!cardHolder.trim()) {
      setError(t('cardHolderRequired'));
      return;
    }
    const safeLastFour = cardLastFour.replace(/\D/g, '').slice(-4);
    if (safeLastFour.length !== 4) {
      setError(t('cardDigitsRequired'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payment = await enrollWithPayment(course, gateway, {
        couponCode: appliedCoupon?.valid ? appliedCoupon.coupon?.code : undefined,
        referralWelcome: true,
        testMode: isAdmin && testMode,
      });
      setReceipt(payment);
      setTimeout(() => onSuccess(course.id), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('checkoutError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mt-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{t('secureCheckout')}</p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('checkoutTitle')}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/40">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{course.title}</p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>{t('originalPrice')}</span>
                <span className={discountCents > 0 ? 'line-through text-slate-400' : 'font-semibold'}>{formatMoney(originalPrice)}</span>
              </div>
              {discountCents > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>{t('discount')}</span>
                  <span>-{formatMoney(discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>{t('total')}</span>
                <span>{formatMoney(finalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Cupón */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Tag className="w-4 h-4" /> {t('haveCoupon')}
            </label>
            <div className="mt-2 flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder={t('couponPlaceholder')}
                disabled={!!appliedCoupon?.valid || couponLoading}
                className="flex-1 px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm uppercase"
              />
              {appliedCoupon?.valid ? (
                <button type="button" onClick={removeCoupon} className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">
                  {t('removeCoupon')}
                </button>
              ) : (
                <button type="button" onClick={() => void validateCoupon()} disabled={couponLoading || !couponCode.trim()} className="px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium disabled:opacity-50">
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

          {!user ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-900/40 p-4">
              <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">{t('loginToEnroll')}</p>
              <button
                onClick={() => void signInWithGoogle()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
              >
                {t('signInGoogle')}
              </button>
            </div>
          ) : receipt ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-900/40 p-4">
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
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('selectGateway')}</p>
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
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  {t('cardHolder')}
                  <input
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    placeholder={t('cardHolderPlaceholder')}
                  />
                </label>
                <label className="text-sm text-slate-700 dark:text-slate-300">
                  {t('cardLast4')}
                  <input
                    value={cardLastFour}
                    onChange={(e) => setCardLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    placeholder="4242"
                    inputMode="numeric"
                  />
                </label>
              </div>

              {isAdmin && (
                <label className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                  <input type="checkbox" checked={testMode} onChange={(e) => setTestMode(e.target.checked)} />
                  Modo prueba admin: no genera canjes/recompensas reales
                </label>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {t('securePayment')}
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-sm font-semibold"
                >
                  {submitting ? t('processingPayment') : finalPrice === 0 ? t('enrollFree') : t('payAndEnroll')}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

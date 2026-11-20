import React, { useState } from 'react';
import { CheckCircle2, CreditCard, Globe2, ShieldCheck, X } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import type { Course, PaymentGateway, PaymentRecord } from '../types';

interface CheckoutModalProps {
  course: Course;
  onClose: () => void;
  onSuccess: (courseId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ course, onClose, onSuccess }) => {
  const { user, signInWithGoogle, enrollWithPayment, t } = usePlatform();
  const [gateway, setGateway] = useState<PaymentGateway>('stripe');
  const [cardHolder, setCardHolder] = useState(user?.displayName || '');
  const [cardLastFour, setCardLastFour] = useState('4242');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<PaymentRecord | null>(null);

  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: course.currency,
  }).format(course.priceCents / 100);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user) {
      await signInWithGoogle();
      return;
    }
    setSubmitting(true);
    try {
      const payment = await enrollWithPayment(course, gateway);
      setReceipt(payment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t('checkoutTitle')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">
              {course.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {receipt ? (
          <div className="p-6">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t('paymentSuccess')}
              </h4>
            </div>
            <dl className="mt-4 divide-y divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800 text-sm">
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Referencia</dt>
                <dd className="font-mono text-slate-900 dark:text-slate-100">{receipt.transactionRef}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Pasarela</dt>
                <dd className="uppercase font-medium text-slate-900 dark:text-slate-100">{receipt.gateway}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Total</dt>
                <dd className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                  {formattedPrice}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => onSuccess(course.id)}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors min-h-[44px]"
            >
              {t('continueCourse')}
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleConfirm(e)} className="p-6 space-y-5">
            <div className="flex items-baseline justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-sm text-slate-600 dark:text-slate-300">{course.instructorName}</span>
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {formattedPrice}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('selectGateway')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'stripe', label: 'Stripe' },
                    { id: 'mercadopago', label: 'Mercado Pago' },
                    { id: 'paypal', label: 'PayPal' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGateway(item.id)}
                    className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap min-h-[42px] ${
                      gateway === item.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {gateway === 'stripe' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Titular
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="Nombre completo"
                    required
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Últimos 4
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardLastFour}
                    onChange={(e) => setCardLastFour(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3.5 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2.5">
                <Globe2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  Autorización directa con token seguro vía {gateway === 'mercadopago' ? 'Mercado Pago Checkout' : 'PayPal Express'}.
                </span>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>TLS + E2EE</span>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors min-h-[44px]"
              >
                <CreditCard className="w-4 h-4" />
                <span>{submitting ? t('processingPayment') : t('payAndEnroll')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

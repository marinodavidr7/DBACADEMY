import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Gift, Loader2, ShoppingBag } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { formatCurrency } from '../utils/currency';
import type { CurrencyCode } from '../types';
import { getPayPal, getPayPalCurrency, getPayPalValue, loadPayPalSdk, type PayPalButtonsInstance } from '../utils/paypalSdk';

const PRESETS: Record<CurrencyCode, number[]> = {
  DOP: [500, 1000, 2000, 5000],
  USD: [10, 25, 50, 100],
  EUR: [10, 25, 50, 100],
  MXN: [200, 500, 1000, 2000],
};

export const GiftCardStoreView: React.FC = () => {
  const { user, signInWithGoogle } = usePlatform();
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [amountInput, setAmountInput] = useState('25');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [purchasedCode, setPurchasedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const amountCents = useMemo(() => {
    const n = Number(amountInput);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n * 100);
  }, [amountInput]);

  useEffect(() => {
    setPurchasedCode(null);
    setError('');
  }, [amountCents, currency]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !user || amountCents < 100 || purchasedCode) return;

    let cancelled = false;
    let buttonInstance: PayPalButtonsInstance | null = null;
    container.innerHTML = '';

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const clientId = (import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined)?.trim() || '';
        if (!clientId) throw new Error('PayPal no está configurado.');
        const ppCurrency = getPayPalCurrency(currency);
        await loadPayPalSdk(clientId, ppCurrency, 'dba-paypal-store-sdk');
        if (cancelled || !containerRef.current || !getPayPal()?.Buttons) return;

        buttonInstance = getPayPal()!.Buttons({
          style: { layout: 'vertical', shape: 'rect', label: 'pay', height: 45 },
          createOrder: (_data: unknown, actions: { order: { create: (o: unknown) => Promise<string> } }) => actions.order.create({
            purchase_units: [{
              amount: { currency_code: ppCurrency, value: getPayPalValue(amountCents, currency) },
              description: `Gift Card DB Academy ${formatCurrency(amountCents, currency)}`.slice(0, 127),
            }],
          }),
          onApprove: async (data: { orderID?: string }) => {
            try {
              const idToken = await user.getIdToken();
              const resp = await fetch('/api/v1/gift-cards/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ orderId: data?.orderID, amountCents, currency }),
              });
              const json = await resp.json().catch(() => ({}));
              if (!resp.ok) throw new Error((json as { error?: string })?.error || 'No se pudo completar la compra.');
              setPurchasedCode(String((json as { card?: { code?: string } })?.card?.code || ''));
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Error al comprar la Gift Card.');
            }
          },
          onError: (err: unknown) => {
            console.error('PayPal store error', err);
            setError('Error en PayPal. Intenta de nuevo.');
          },
        });
        if (buttonInstance?.isEligible?.() === false) {
          setError('PayPal no está disponible para esta configuración.');
          return;
        }
        await buttonInstance.render(containerRef.current);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No se pudo cargar PayPal.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
      void buttonInstance?.close?.();
    };
  }, [user, amountCents, currency, purchasedCode]);

  const copyCode = async () => {
    if (!purchasedCode) return;
    try {
      await navigator.clipboard.writeText(purchasedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"><ShoppingBag className="w-5 h-5" /></div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Tienda de Gift Cards</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Compra una Gift Card y úsala para inscribirte en cursos.</p>
          </div>
        </div>
      </div>

      {!user ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 text-center space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">Inicia sesión para comprar una Gift Card.</p>
          <button type="button" onClick={() => void signInWithGoogle()} className="inline-flex items-center justify-center rounded-lg bg-[#0052CC] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0747A6] min-h-[44px]">Iniciar sesión con Google</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Gift className="w-4 h-4 text-amber-500" /> Elige el valor</h2>

            <div className="grid grid-cols-3 gap-2">
              {(['DOP', 'USD', 'EUR'] as CurrencyCode[]).map((c) => (
                <button key={c} type="button" onClick={() => setCurrency(c)} className={`rounded-lg border px-3 py-2 text-xs font-semibold min-h-[40px] ${currency === c ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>{c}</button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {(PRESETS[currency] || PRESETS.USD).map((p) => (
                <button key={p} type="button" onClick={() => setAmountInput(String(p))} className={`rounded-lg border px-3 py-2 text-xs font-semibold min-h-[40px] ${Number(amountInput) === p ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {formatCurrency(p * 100, currency)}
                </button>
              ))}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Monto personalizado ({currency})</span>
              <input type="number" min="1" step="1" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm min-h-[44px]" />
            </label>

            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-slate-500 dark:text-slate-400">Total</span><span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(amountCents, currency)}</span></div>
              {currency === 'DOP' && <p className="text-[11px] text-slate-400 mt-1">PayPal cobrará el equivalente en USD.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Pago con PayPal</h2>

            {purchasedCode ? (
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold"><Check className="w-5 h-5" /> Gift Card comprada</div>
                <p className="text-xs text-emerald-700/90 dark:text-emerald-300/90">Guarda este código. También puedes canjearlo en el checkout.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-slate-100">{purchasedCode}</code>
                  <button type="button" onClick={() => void copyCode()} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 min-h-[40px]">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <button type="button" onClick={() => { setPurchasedCode(null); setError(''); }} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Comprar otra Gift Card</button>
              </div>
            ) : (
              <>
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                {loading && <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Cargando PayPal...</div>}
                <div ref={containerRef} className={amountCents < 100 ? 'opacity-50 pointer-events-none' : ''} />
                {amountCents < 100 && <p className="text-xs text-slate-500">Ingresa un monto mínimo de 1.00 para continuar.</p>}
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Al comprar, se verificará el pago en PayPal y se generará tu código de Gift Card.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

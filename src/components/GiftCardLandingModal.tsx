import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Gift, Lock, Mail, ShieldCheck, X } from 'lucide-react';
import type { Course } from '../types';
import { formatCurrency } from '../utils/currency';

type PayPalButtonsInstance = {
  render: (container: HTMLElement | string) => Promise<void>;
  close?: () => Promise<void>;
  isEligible?: () => boolean;
};
type PayPalNs = { Buttons: (options: Record<string, unknown>) => PayPalButtonsInstance };

const getPayPalCurrency = (currency: Course['currency']): string => (currency === 'DOP' ? 'USD' : currency);
const getPayPalValue = (amountCents: number, currency: Course['currency']): string => {
  const rate = Number(import.meta.env.VITE_DOP_TO_USD_RATE) || 60;
  const amount = currency === 'DOP' ? amountCents / 100 / rate : amountCents / 100;
  return amount.toFixed(2);
};
const getPayPal = (): PayPalNs | undefined => (window as unknown as { paypal?: PayPalNs }).paypal;

const loadPayPalSdk = (clientId: string, currency: string): Promise<void> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('window unavailable'));
  const id = 'dba-paypal-giftcard-landing-sdk';
  const src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons`;
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing && existing.dataset.loaded === 'true' && existing.dataset.currency === currency && getPayPal()?.Buttons) return Promise.resolve();
  if (existing) existing.remove();
  if (getPayPal() && !getPayPal()?.Buttons) delete (window as unknown as { paypal?: unknown }).paypal;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.id = id; s.src = src; s.async = true; s.dataset.currency = currency;
    s.onload = () => { s.dataset.loaded = 'true'; resolve(); };
    s.onerror = () => reject(new Error('No se pudo cargar PayPal.'));
    document.body.appendChild(s);
  });
};

interface Props {
  courses: Course[];
  onClose: () => void;
}

export const GiftCardLandingModal: React.FC<Props> = ({ courses, onClose }) => {
  const purchasableCourses = useMemo(() => courses.filter((c) => c.published && c.priceCents > 0), [courses]);
  const [courseId, setCourseId] = useState(purchasableCourses[0]?.id || '');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ code: string; courseTitle: string; emailed: boolean } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buyerEmailRef = useRef(buyerEmail);
  const buyerNameRef = useRef(buyerName);
  const acceptedTermsRef = useRef(acceptedTerms);

  const selectedCourse = useMemo(() => purchasableCourses.find((c) => c.id === courseId) || null, [purchasableCourses, courseId]);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail.trim());
  const canPay = Boolean(selectedCourse && emailValid && acceptedTerms && !result);

  useEffect(() => { buyerEmailRef.current = buyerEmail; }, [buyerEmail]);
  useEffect(() => { buyerNameRef.current = buyerName; }, [buyerName]);
  useEffect(() => { acceptedTermsRef.current = acceptedTerms; }, [acceptedTerms]);
  useEffect(() => { setError(''); }, [courseId, buyerEmail, acceptedTerms]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !selectedCourse || !canPay) return;
    let cancelled = false;
    let buttonInstance: PayPalButtonsInstance | null = null;
    container.innerHTML = '';
    const run = async () => {
      setLoading(true);
      try {
        const clientId = (import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined)?.trim() || '';
        if (!clientId) throw new Error('PayPal no está configurado.');
        const ppCurrency = getPayPalCurrency(selectedCourse.currency);
        await loadPayPalSdk(clientId, ppCurrency);
        if (cancelled || !containerRef.current || !getPayPal()?.Buttons) return;
        buttonInstance = getPayPal()!.Buttons({
          style: { layout: 'vertical', shape: 'rect', label: 'pay', height: 45 },
          createOrder: (_d: unknown, actions: { order: { create: (o: unknown) => Promise<string> } }) => actions.order.create({
            purchase_units: [{
              amount: { currency_code: ppCurrency, value: getPayPalValue(selectedCourse.priceCents, selectedCourse.currency) },
              description: `Gift Card: ${selectedCourse.title}`.slice(0, 127),
              custom_id: selectedCourse.id.slice(0, 127),
            }],
            application_context: { shipping_preference: 'NO_SHIPPING' },
          }),
          onClick: (_d: unknown, actions: { reject: () => unknown; resolve: () => unknown }) => {
            const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmailRef.current.trim());
            if (!emailOk) { setError('Ingresa un correo válido para recibir la Gift Card.'); return actions.reject(); }
            if (!acceptedTermsRef.current) { setError('Debes aceptar los términos para continuar.'); return actions.reject(); }
            return actions.resolve();
          },
          onApprove: async (data: { orderID?: string }) => {
            try {
              setLoading(true);
              const resp = await fetch('/api/public/gift-cards/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: data?.orderID, courseId: selectedCourse.id, buyerEmail: buyerEmailRef.current.trim(), buyerName: buyerNameRef.current.trim() }),
              });
              const json = await resp.json().catch(() => ({}));
              if (!resp.ok) throw new Error((json as { error?: string })?.error || 'No se pudo completar la compra.');
              const card = (json as { card?: { code?: string; courseTitle?: string }; emailed?: boolean }).card;
              setResult({ code: String(card?.code || ''), courseTitle: String(card?.courseTitle || selectedCourse.title), emailed: Boolean((json as { emailed?: boolean }).emailed) });
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Error al comprar la Gift Card.');
            } finally { setLoading(false); }
          },
          onError: () => setError('Error en PayPal. Intenta de nuevo.'),
        });
        if (buttonInstance?.isEligible?.() === false) { setError('PayPal no está disponible.'); return; }
        await buttonInstance.render(containerRef.current);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No se pudo cargar PayPal.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => { cancelled = true; void buttonInstance?.close?.(); };
  }, [selectedCourse, canPay]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="max-w-[560px] w-full mx-auto mt-8 bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-[16px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-7 py-5 bg-[#0d0d0f] text-white">
          <div className="min-w-0">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#ffd23f] flex items-center gap-1.5"><Gift className="w-3.5 h-3.5" /> Gift Card</p>
            <h3 className="text-[20px] font-bold mt-0.5">Comprar Gift Card</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-7 py-5 space-y-4">
          {result ? (
            <div className="rounded-[12px] border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 p-4 space-y-2">
              <p className="font-semibold text-emerald-800 dark:text-emerald-200">¡Gift Card generada!</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 break-words [overflow-wrap:anywhere]">Curso: {result.courseTitle}</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">Código: <span className="font-mono font-bold">{result.code}</span></p>
              <p className="text-xs text-emerald-700/90 dark:text-emerald-300/90">{result.emailed ? `Enviamos el código a ${buyerEmail.trim()}.` : 'No pudimos enviar el correo automáticamente, pero tu código fue generado. Guárdalo.'}</p>
              <p className="text-xs text-stone-600 dark:text-zinc-400">Para canjearla, la persona debe registrarse/iniciar sesión en DB-ACADEMY.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1.5">Curso de la Gift Card</label>
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm min-h-[44px]">
                  {purchasableCourses.map((c) => <option key={c.id} value={c.id}>{c.title} — {formatCurrency(c.priceCents, c.currency)}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1.5">Tu nombre</label>
                  <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="w-full rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm min-h-[44px]" placeholder="Nombre" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1.5">Correo para recibir la Gift Card</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} className="w-full rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-3 py-2.5 text-sm min-h-[44px]" placeholder="correo@ejemplo.com" />
                  </div>
                </div>
              </div>

              {selectedCourse && (
                <div className="rounded-[12px] border border-stone-200 dark:border-zinc-800 p-4 bg-[#f7f5ef] dark:bg-zinc-900/80">
                  <div className="flex justify-between gap-4 text-sm"><span className="text-stone-600 dark:text-zinc-400">Curso</span><span className="font-medium text-right">{selectedCourse.title}</span></div>
                  <div className="flex justify-between gap-4 text-sm mt-2"><span className="text-stone-600 dark:text-zinc-400">Total</span><span className="text-lg font-bold">{formatCurrency(selectedCourse.priceCents, selectedCourse.currency)}</span></div>
                </div>
              )}

              <label className="flex items-start gap-3 cursor-pointer min-h-[44px] text-sm text-stone-700 dark:text-zinc-300">
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="w-5 h-5 shrink-0 mt-0.5" />
                <span>Acepto los términos y entiendo que la Gift Card se canjea iniciando sesión en DB-ACADEMY.</span>
              </label>

              {error && <p className="text-sm text-red-600 dark:text-red-400 break-words [overflow-wrap:anywhere]">{error}</p>}

              <div className="space-y-3">
                <div className="relative min-h-[50px]">
                  <div ref={containerRef} className={(!canPay || loading) ? 'opacity-40 pointer-events-none' : ''} />
                  {!selectedCourse && <p className="text-sm text-stone-500">No hay cursos disponibles para Gift Card.</p>}
                  {selectedCourse && !canPay && !loading && (
                    <p className="text-xs text-stone-500 mt-2">Completa correo y acepta términos para habilitar el pago.</p>
                  )}
                </div>
                <p className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-[#0b6b4a] dark:text-emerald-400 w-full"><ShieldCheck className="w-4 h-4" /> Pago seguro y cifrado</p>
                <p className="text-xs text-center text-stone-500 dark:text-zinc-400 flex items-center justify-center gap-1"><Lock className="w-3.5 h-3.5" /> Sin registro para comprar. Se requiere cuenta para canjear.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

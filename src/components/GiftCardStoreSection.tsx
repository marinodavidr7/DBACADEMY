import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Gift, Lock, Mail, Search, ShieldCheck, ShoppingBag, Trash2, X } from 'lucide-react';
import type { Course } from '../types';
import { formatCurrency } from '../utils/currency';
import { getPayPal, getPayPalCurrency, getPayPalValue, loadPayPalSdk, type PayPalButtonsInstance } from '../utils/paypalSdk';

const GRADIENTS: Array<[string, string]> = [
  ['#1f2937', '#3b82f6'],
  ['#1c1917', '#d97706'],
  ['#111827', '#22c55e'],
  ['#1e1b4b', '#8b5cf6'],
  ['#172554', '#06b6d4'],
  ['#3f1d2e', '#ec4899'],
];

function gradientFor(id: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

export type CartItem = {
  key: string;
  courseId: string;
  title: string;
  category: string;
  priceCents: number;
  currency: Course['currency'];
  qty: number;
};

interface Props {
  courses: Course[];
  cart: CartItem[];
  onCartChange: React.Dispatch<React.SetStateAction<CartItem[]>>;
  cartOpen: boolean;
  onCartOpenChange: (open: boolean) => void;
}

export const GiftCardStoreSection: React.FC<Props> = ({ courses, cart, onCartChange, cartOpen, onCartOpenChange }) => {
  const purchasableCourses = useMemo(() => courses.filter((c) => c.published && c.priceCents > 0), [courses]);
  const categories = useMemo(() => ['Todos', ...Array.from(new Set(purchasableCourses.map((c) => c.category || 'Otros')))], [purchasableCourses]);
  const [activeCat, setActiveCat] = useState('Todos');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ code: string; courseTitle: string; emailed: boolean } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cartDrawerRef = useRef<HTMLElement | null>(null);
  const buyerEmailRef = useRef(buyerEmail);
  const buyerNameRef = useRef(buyerName);
  const acceptedTermsRef = useRef(acceptedTerms);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);

  const addToCart = (course: Course, openCart = false) => {
    onCartChange((prev) => {
      const key = course.id;
      const existing = prev.find((i) => i.key === key);
      if (existing) return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { key, courseId: course.id, title: course.title, category: course.category || 'Curso', priceCents: course.priceCents, currency: course.currency, qty: 1 }];
    });
    if (openCart) onCartOpenChange(true);
  };

  const removeFromCart = (key: string) => {
    onCartChange((prev) => prev.filter((i) => i.key !== key));
    if (selectedId === key) {
      setSelectedId(null);
      setResult(null);
      setError('');
    }
  };

  const checkoutCartItem = (item: CartItem) => {
    setSelectedId(item.courseId);
    setResult(null);
    setError('');
    onCartOpenChange(true);
  };

  const filtered = useMemo(() => purchasableCourses.filter((c) => {
    const catOk = activeCat === 'Todos' || (c.category || 'Otros') === activeCat;
    const q = query.trim().toLowerCase();
    const qOk = !q || c.title.toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q);
    return catOk && qOk;
  }), [purchasableCourses, activeCat, query]);

  const selectedCourse = useMemo(() => purchasableCourses.find((c) => c.id === selectedId) || null, [purchasableCourses, selectedId]);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail.trim());
  const canPay = Boolean(selectedCourse && emailValid && acceptedTerms && !result);

  useEffect(() => { buyerEmailRef.current = buyerEmail; }, [buyerEmail]);
  useEffect(() => { buyerNameRef.current = buyerName; }, [buyerName]);
  useEffect(() => { acceptedTermsRef.current = acceptedTerms; }, [acceptedTerms]);
  useEffect(() => { setError(''); }, [selectedId, buyerEmail, acceptedTerms]);

  useEffect(() => {
    if (filtered.length === 1) {
      const onlyId = filtered[0].id;
      if (selectedId !== onlyId) {
        setSelectedId(onlyId);
        setResult(null);
      }
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    if (!cartOpen) return;
    if (!selectedId && cart.length > 0) {
      setSelectedId(cart[0].courseId);
      setResult(null);
      setError('');
    }
    const prev = document.activeElement as HTMLElement | null;
    setTimeout(() => cartDrawerRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCartOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [cartOpen, cart, selectedId, onCartOpenChange]);

  const openPurchase = (courseId: string) => {
    const course = purchasableCourses.find((c) => c.id === courseId);
    if (!course) return;
    onCartChange((prev) => {
      if (prev.some((i) => i.key === course.id)) return prev;
      return [...prev, { key: course.id, courseId: course.id, title: course.title, category: course.category || 'Curso', priceCents: course.priceCents, currency: course.currency, qty: 1 }];
    });
    setSelectedId(courseId);
    setResult(null);
    setError('');
    onCartOpenChange(true);
  };

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
        await loadPayPalSdk(clientId, ppCurrency, 'dba-paypal-giftcard-store-sdk');
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
              onCartChange((prev) => {
                const idx = prev.findIndex((i) => i.courseId === selectedCourse.id);
                if (idx === -1) return prev;
                const next = [...prev];
                const item = next[idx];
                if (item.qty <= 1) next.splice(idx, 1);
                else next[idx] = { ...item, qty: item.qty - 1 };
                return next;
              });
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
    <section id="gift-cards" className="bg-[var(--dba-bg-canvas)] text-[var(--dba-text-primary)]">
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-5 lg:px-8 2xl:px-10 pt-6 sm:pt-8 pb-12 sm:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center rounded-2xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-5 sm:p-6 shadow-sm mb-6">
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[var(--dba-accent-ink)] mb-2">Tienda de Gift Cards</p>
            <h1 className="text-2xl sm:text-[2rem] font-extrabold tracking-tight leading-tight text-[var(--dba-text-primary)] [text-wrap:balance]">
              Regala el curso que <span className="text-[var(--dba-accent-ink)]">cambia carreras</span>.
            </h1>
            <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-[var(--dba-text-secondary)] max-w-xl [text-wrap:balance]">
              Elige un curso, compra sin registrarte y envía el código por correo. Para canjearla se requiere iniciar sesión.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="#gift-cards-grid" className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-sm text-[var(--dba-accent-foreground)] bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] transition-colors">
                Ver catálogo
              </a>
              <button
                type="button"
                onClick={() => { if (purchasableCourses.length > 0) openPurchase(purchasableCourses[Math.floor(Math.random() * purchasableCourses.length)].id); }}
                className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl font-semibold text-sm border border-[var(--dba-border-strong)] bg-[var(--dba-bg-canvas)] text-[var(--dba-text-primary)] hover:bg-[var(--dba-bg-elevated)] transition-colors"
              >
                Sorpréndeme
              </button>
            </div>
          </div>

          <div className="hidden md:flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[420px] aspect-[1.65/1] rounded-2xl p-5 flex flex-col justify-between border border-[var(--dba-border)] bg-[linear-gradient(135deg,#111827,#1f2937_58%,#292524)] text-white shadow-md overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(240,181,1,0.18),transparent_55%)]" />
              <div className="relative flex justify-between items-start">
                <div className="flex items-center gap-2 font-extrabold text-[13px] tracking-[1px]">
                  <span className="w-[22px] h-[22px] rounded-[7px] bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)] text-[9px] grid place-items-center font-black">DB</span>
                  DB ACADEMY
                </div>
                <div className="text-[10px] tracking-[2px] text-amber-300 font-bold">GIFT CARD</div>
              </div>
              <div className="relative">
                <p className="text-xs text-zinc-300 mb-1">Valor de la gift card</p>
                <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">{selectedCourse ? formatCurrency(selectedCourse.priceCents, selectedCourse.currency) : formatCurrency(purchasableCourses[0]?.priceCents || 0, purchasableCourses[0]?.currency || 'USD')}</p>
              </div>
              <div className="relative flex justify-between items-center text-xs text-zinc-300">
                <span>Canje online · Con cuenta</span>
                <span className="w-[34px] h-[22px] rounded-[5px] bg-[linear-gradient(135deg,#f5d76e,#c9a227)] opacity-90" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-4 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center justify-between gap-3 md:min-w-[160px]">
              <div>
                <p className="text-sm font-bold text-[var(--dba-text-primary)]">Catálogo</p>
                {purchasableCourses.length > 1 && (
                  <p className="text-xs text-[var(--dba-text-secondary)]">{filtered.length} {filtered.length === 1 ? 'curso disponible' : 'cursos disponibles'}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onCartOpenChange(true)}
                className="md:hidden relative inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] text-sm font-semibold text-[var(--dba-text-primary)]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Carrito</span>
                {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)] text-[11px] font-bold grid place-items-center">{cartCount}</span>}
              </button>
            </div>
            <div className="flex-1 flex items-center gap-2 bg-[var(--dba-bg-canvas)] border border-[var(--dba-border)] rounded-xl px-3 py-2.5 min-h-[44px] focus-within:border-[var(--dba-accent)] transition-colors">
              <Search className="w-4 h-4 text-[var(--dba-text-secondary)] shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar curso..."
                className="w-full bg-transparent outline-none text-sm text-[var(--dba-text-primary)] placeholder:text-[var(--dba-text-secondary)]"
              />
            </div>
            {categories.length > 2 && (
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categories.map((cat) => {
                  const active = cat === activeCat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCat(cat)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full border text-[13px] font-semibold min-h-[40px] transition-colors ${
                        active
                          ? 'bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)] border-[var(--dba-accent)]'
                          : 'bg-[var(--dba-bg-canvas)] border-[var(--dba-border)] text-[var(--dba-text-secondary)] hover:text-[var(--dba-text-primary)] hover:border-[var(--dba-border-strong)]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}
            <button
              type="button"
              onClick={() => onCartOpenChange(true)}
              className="hidden md:inline-flex relative items-center gap-2 min-h-[44px] px-4 rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] text-sm font-semibold text-[var(--dba-text-primary)] hover:border-[var(--dba-border-strong)]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Carrito</span>
              {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)] text-[11px] font-bold grid place-items-center">{cartCount}</span>}
            </button>
          </div>
        </div>

        <div id="gift-cards-grid">
          {filtered.length === 1 ? (
            (() => {
              const c = filtered[0];
              const [g0, g1] = gradientFor(c.id);
              const active = c.id === selectedId;
              return (
                <article className={`bg-[var(--dba-bg-surface)] border rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[minmax(280px,420px)_1fr] transition-all duration-200 ${active ? 'border-[var(--dba-accent)] shadow-sm ring-1 ring-[var(--dba-accent)]/20' : 'border-[var(--dba-border)] shadow-[0_1px_2px_rgba(0,0,0,0.03)]'}`}>
                  <div className="relative min-h-[220px] md:min-h-[280px] p-5 flex flex-col justify-between overflow-hidden" style={{ background: `linear-gradient(135deg,${g0},${g1})` }}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.16),transparent_55%)]" />
                    <div className="relative flex justify-between items-start gap-3">
                      <span className="text-[10px] font-extrabold tracking-[2.4px] text-white/85">DB ACADEMY</span>
                      {active && <span className="text-[10px] font-bold bg-black/25 border border-white/25 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">Seleccionada</span>}
                    </div>
                    <div className="relative">
                      <p className="text-xs text-white/75 mb-1">Gift Card</p>
                      <p className="text-4xl leading-none font-extrabold tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.3)]">{formatCurrency(c.priceCents, c.currency)}</p>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col justify-center gap-4">
                    <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--dba-accent-ink)] uppercase">{c.category || 'Curso'}</span>
                    <h3 className="m-0 text-xl sm:text-2xl font-bold leading-snug text-[var(--dba-text-primary)] [text-wrap:balance]">{c.title}</h3>
                    <p className="text-sm text-[var(--dba-text-secondary)] leading-relaxed max-w-2xl">Regala acceso a este curso con una Gift Card. La compra se realiza sin registro y el código llega por correo.</p>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2 max-w-md">
                      <button type="button" onClick={() => addToCart(c)} className="min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-sm border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] text-[var(--dba-text-primary)] hover:border-[var(--dba-border-strong)] transition-colors">Añadir</button>
                      <button type="button" onClick={() => openPurchase(c.id)} className="min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-sm bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)] hover:bg-[var(--dba-accent-hover)] transition-colors">Comprar</button>
                    </div>
                  </div>
                </article>
              );
            })()
          ) : (
            <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
              {filtered.map((c) => {
                const [g0, g1] = gradientFor(c.id);
                const active = c.id === selectedId;
                return (
                  <article key={c.id} className={`group bg-[var(--dba-bg-surface)] border rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${active ? 'border-[var(--dba-accent)] shadow-sm ring-1 ring-[var(--dba-accent)]/20' : 'border-[var(--dba-border)] shadow-[0_1px_2px_rgba(0,0,0,0.03)]'}`}>
                    <div className="relative aspect-[1.6/1] p-4 flex flex-col justify-between overflow-hidden" style={{ background: `linear-gradient(135deg,${g0},${g1})` }}>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.16),transparent_55%)]" />
                      <div className="relative flex justify-between items-start gap-3">
                        <span className="text-[9px] font-extrabold tracking-[2.4px] text-white/85">DB ACADEMY</span>
                        {active && <span className="text-[10px] font-bold bg-black/25 border border-white/25 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">Seleccionada</span>}
                      </div>
                      <div className="relative">
                        <p className="text-[11px] text-white/75 mb-1">Gift Card</p>
                        <p className="text-[30px] leading-none font-extrabold tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.3)]">{formatCurrency(c.priceCents, c.currency)}</p>
                      </div>
                    </div>
                    <div className="p-5 flex flex-col gap-3 flex-1">
                      <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--dba-accent-ink)] uppercase">{c.category || 'Curso'}</span>
                      <h3 className="m-0 text-[15px] font-bold leading-snug min-h-[44px] text-[var(--dba-text-primary)]">{c.title}</h3>
                      <div className="mt-auto pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" onClick={() => addToCart(c)} className="min-h-[44px] px-3 py-2.5 rounded-xl font-bold text-sm border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] text-[var(--dba-text-primary)] hover:border-[var(--dba-border-strong)] transition-colors">Añadir</button>
                          <button type="button" onClick={() => openPurchase(c.id)} className="min-h-[44px] px-3 py-2.5 rounded-xl font-bold text-sm bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)] hover:bg-[var(--dba-accent-hover)] transition-colors">Comprar</button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-16 px-5 text-[var(--dba-text-secondary)] border border-dashed border-[var(--dba-border)] rounded-2xl bg-[var(--dba-bg-surface)]">
                  <strong className="block text-[var(--dba-text-primary)] text-[17px] mb-1.5">Sin resultados</strong>
                  Prueba con otro término o cambia de categoría.
                </div>
              )}
            </div>
          )}
        </div>

        {cartOpen && (
          <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Carrito de Gift Cards">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={() => onCartOpenChange(false)} />
            <aside ref={cartDrawerRef} tabIndex={-1} className="absolute inset-x-0 bottom-0 top-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-full sm:max-w-[480px] bg-[var(--dba-bg-surface)] border-t sm:border-t-0 sm:border-l border-[var(--dba-border)] shadow-2xl flex flex-col max-h-[100dvh] outline-none">
              <div className="px-5 py-5 border-b border-[var(--dba-border)] bg-[linear-gradient(180deg,var(--dba-bg-elevated),var(--dba-bg-surface))] shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--dba-accent)]/15 text-[var(--dba-accent-ink)] grid place-items-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-lg font-extrabold text-[var(--dba-text-primary)] tracking-tight">Tu carrito</p>
                      <p className="text-xs text-[var(--dba-text-secondary)]">{cartCount} {cartCount === 1 ? 'Gift Card seleccionada' : 'Gift Cards seleccionadas'}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => onCartOpenChange(false)} aria-label="Cerrar carrito" className="min-w-[44px] min-h-[44px] grid place-items-center rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] text-[var(--dba-text-secondary)] hover:text-[var(--dba-text-primary)] hover:border-[var(--dba-border-strong)] transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-[var(--dba-bg-canvas)]">
                {cart.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--dba-border)] bg-[var(--dba-bg-surface)] text-center py-14 px-6">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--dba-bg-canvas)] border border-[var(--dba-border)] grid place-items-center mx-auto mb-4 text-[var(--dba-text-secondary)]">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <p className="font-bold text-[var(--dba-text-primary)]">Tu carrito está vacío</p>
                    <p className="text-sm text-[var(--dba-text-secondary)] mt-1 max-w-xs mx-auto">Explora el catálogo y añade una Gift Card para regalar aprendizaje.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--dba-text-secondary)]">Gift Cards</p>
                        <span className="text-xs text-[var(--dba-text-secondary)]">Pago una por una</span>
                      </div>
                      {cart.map((item) => {
                        const isSelected = selectedId === item.courseId;
                        return (
                          <div key={item.key} className={`rounded-2xl border p-4 transition-all ${isSelected ? 'border-[var(--dba-accent)] bg-[var(--dba-bg-surface)] shadow-sm ring-1 ring-[var(--dba-accent)]/15' : 'border-[var(--dba-border)] bg-[var(--dba-bg-surface)]'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="inline-flex w-2 h-2 rounded-full bg-[var(--dba-accent)]" />
                                  <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--dba-accent-ink)]">{item.category}</p>
                                </div>
                                <p className="text-sm font-semibold text-[var(--dba-text-primary)] leading-snug [text-wrap:balance]">{item.title}</p>
                                <div className="mt-2 flex items-center gap-2 text-sm">
                                  <span className="font-bold text-[var(--dba-text-primary)]">{formatCurrency(item.priceCents, item.currency)}</span>
                                  {item.qty > 1 && <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--dba-bg-canvas)] border border-[var(--dba-border)] text-[var(--dba-text-secondary)]">x{item.qty}</span>}
                                </div>
                              </div>
                              <button type="button" onClick={() => removeFromCart(item.key)} aria-label="Quitar del carrito" className="min-w-[36px] min-h-[36px] grid place-items-center rounded-lg text-[var(--dba-text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <button type="button" onClick={() => checkoutCartItem(item)} className={`mt-3 w-full min-h-[40px] px-3 py-2 rounded-xl text-sm font-bold transition-colors ${isSelected ? 'bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)]' : 'border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] text-[var(--dba-text-primary)] hover:border-[var(--dba-border-strong)]'}`}>
                              {isSelected ? 'Seleccionada para pagar' : 'Pagar esta Gift Card'}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="rounded-2xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-4 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--dba-bg-canvas)] border border-[var(--dba-border)] grid place-items-center text-[var(--dba-text-secondary)]"><Mail className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-bold text-[var(--dba-text-primary)]">Datos de entrega</p>
                          <p className="text-xs text-[var(--dba-text-secondary)]">El código llegará a este correo.</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1.5">Tu nombre (opcional)</label>
                        <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="w-full rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-3 py-2.5 text-sm min-h-[44px] text-[var(--dba-text-primary)] placeholder:text-[var(--dba-text-secondary)] outline-none focus:border-[var(--dba-accent)] focus:ring-2 focus:ring-[var(--dba-accent)]/15 transition-all" placeholder="Nombre" autoComplete="name" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--dba-text-secondary)] mb-1.5">Correo para recibir la Gift Card *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dba-text-secondary)]" />
                          <input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} className="w-full rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] pl-9 pr-3 py-2.5 text-sm min-h-[44px] text-[var(--dba-text-primary)] placeholder:text-[var(--dba-text-secondary)] outline-none focus:border-[var(--dba-accent)] focus:ring-2 focus:ring-[var(--dba-accent)]/15 transition-all" placeholder="correo@ejemplo.com" autoComplete="email" />
                        </div>
                      </div>
                      <label className="flex items-start gap-3 cursor-pointer min-h-[44px] text-[13px] leading-relaxed text-[var(--dba-text-secondary)] bg-[var(--dba-bg-canvas)] border border-[var(--dba-border)] rounded-xl p-3">
                        <span className="relative mt-0.5 shrink-0">
                          <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="peer h-4 w-4 appearance-none rounded border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] checked:bg-[var(--dba-accent)] checked:border-[var(--dba-accent)] cursor-pointer transition-colors" />
                          <svg className="pointer-events-none absolute left-0 top-0 h-4 w-4 p-[2px] text-[var(--dba-accent-foreground)] opacity-0 peer-checked:opacity-100" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 10 8 14 16 6" /></svg>
                        </span>
                        <span>Acepto los términos y entiendo que la Gift Card se canjea iniciando sesión en DB-ACADEMY.</span>
                      </label>
                    </div>

                    {result && (
                      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-sm"><CheckCircle2 className="w-4 h-4" /> Gift Card generada</div>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 break-words [overflow-wrap:anywhere]">{result.courseTitle}</p>
                        <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">Código: <span className="font-mono font-bold">{result.code}</span></p>
                        <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">{result.emailed ? `Enviado a ${buyerEmail.trim()}.` : 'Correo no enviado automáticamente; guarda el código.'}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="px-5 py-4 border-t border-[var(--dba-border)] space-y-3 bg-[var(--dba-bg-surface)] shrink-0 shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--dba-text-secondary)] uppercase tracking-wide">Total a pagar</p>
                    <p className="text-xs text-[var(--dba-text-secondary)]">{selectedCourse ? selectedCourse.title : 'Selecciona una Gift Card'}</p>
                  </div>
                  <span className="text-xl font-extrabold text-[var(--dba-text-primary)]">
                    {selectedCourse ? formatCurrency(selectedCourse.priceCents, selectedCourse.currency) : (cart.length > 0 && Array.from(new Set(cart.map((i) => i.currency))).length === 1 ? formatCurrency(cart[0].priceCents, cart[0].currency) : formatCurrency(0, 'USD'))}
                  </span>
                </div>
                {error && <p className="text-sm text-red-600 dark:text-red-400 break-words [overflow-wrap:anywhere]">{error}</p>}
                <div ref={containerRef} className={`min-h-[45px] rounded-xl overflow-hidden ${(!canPay || loading) ? 'opacity-40 pointer-events-none' : ''}`} />
                {!canPay && !loading && (
                  <div className="rounded-xl border border-dashed border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] px-4 py-3 text-center">
                    <p className="text-sm font-medium text-[var(--dba-text-secondary)]">Completa un correo válido y acepta los términos para habilitar el pago.</p>
                  </div>
                )}
                {loading && canPay && <p className="text-xs text-[var(--dba-text-secondary)] text-center">Cargando PayPal...</p>}
                <p className="text-[11px] text-[var(--dba-text-secondary)] text-center flex items-center justify-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Pago seguro. Se requiere cuenta para canjear.</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
};

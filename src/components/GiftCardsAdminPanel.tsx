import React, { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  Gift,
  Plus,
  Search,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { isPlaceholderCampusEmail } from '../firebase';
import type { CurrencyCode, GiftCard } from '../types';
import { currencyLabel, formatCurrency } from '../utils/currency';

type CardEffectiveState = 'active' | 'expired' | 'redeemed' | 'disabled';
type GiftCardFilterStatus = 'all' | CardEffectiveState;

function parseDateMillis(val: unknown): number | null {
  if (!val) return null;
  if (
    typeof val === 'object' &&
    val !== null &&
    'toMillis' in val &&
    typeof (val as { toMillis: unknown }).toMillis === 'function'
  ) {
    const ms = (val as { toMillis: () => number }).toMillis();
    return Number.isFinite(ms) ? ms : null;
  }
  if (
    typeof val === 'object' &&
    val !== null &&
    'toDate' in val &&
    typeof (val as { toDate: unknown }).toDate === 'function'
  ) {
    const ms = (val as { toDate: () => Date }).toDate().getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof val === 'object' && val !== null && 'seconds' in val && typeof (val as { seconds: unknown }).seconds === 'number') {
    return (val as { seconds: number }).seconds * 1000;
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const ms = new Date(val).getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

function formatDate(val: unknown): string {
  const ms = parseDateMillis(val);
  if (ms === null) return '—';
  return new Date(ms).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getCardEffectiveState(card: GiftCard, nowMs: number): CardEffectiveState {
  if (card.status === 'redeemed' || card.remainingAmountCents <= 0) {
    return 'redeemed';
  }
  const expiresMs = parseDateMillis(card.expiresAt);
  if (expiresMs !== null && expiresMs < nowMs) {
    return 'expired';
  }
  if (!card.active || card.status === 'disabled') {
    return 'disabled';
  }
  return 'active';
}

export const GiftCardsAdminPanel: React.FC = () => {
  const {
    courses,
    giftCards,
    giftCardRedemptions,
    studentEmailsMap,
    createGiftCards,
    toggleGiftCardActive,
    deleteGiftCard,
  } = usePlatform();

  const [showForm, setShowForm] = useState(true);
  const [courseId, setCourseId] = useState('');
  const [amountInput, setAmountInput] = useState('600');
  const [currency, setCurrency] = useState<CurrencyCode>('DOP');
  const [singleUse, setSingleUse] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [customCode, setCustomCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [note, setNote] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [justCreated, setJustCreated] = useState<GiftCard[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [confirmDeleteCode, setConfirmDeleteCode] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<GiftCardFilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === courseId) || null,
    [courses, courseId]
  );

  const handleSelectCourse = (nextId: string) => {
    setCourseId(nextId);
    const match = courses.find((c) => c.id === nextId);
    if (match) {
      setCurrency(match.currency || 'DOP');
      if (match.priceCents > 0) {
        setAmountInput((match.priceCents / 100).toString());
      }
    }
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => {
        setCopiedCode((prev) => (prev === code ? null : prev));
      }, 2000);
    } catch {
      // Fallback ignored
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parsedAmount = Number(amountInput);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      setError('Ingresa un valor válido mayor o igual a 1.');
      return;
    }

    setSaving(true);
    try {
      const created = await createGiftCards({
        amountCents: Math.round(parsedAmount * 100),
        currency,
        courseId: courseId || undefined,
        courseTitle: selectedCourse?.title,
        singleUse,
        quantity,
        customCode: quantity === 1 ? customCode : undefined,
        expiresAtIso: expiresAt || undefined,
        note: note || undefined,
      });
      setJustCreated(created);
      setCustomCode('');
      setNote('');
      setQuantity(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la Gift Card.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (card: GiftCard) => {
    setError('');
    try {
      await toggleGiftCardActive(card);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la Gift Card.');
    }
  };

  const handleDelete = async (code: string) => {
    setError('');
    try {
      await deleteGiftCard(code);
      setConfirmDeleteCode(null);
      setJustCreated((prev) => prev.filter((c) => c.code !== code));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la Gift Card.');
    }
  };

  const nowMs = Date.now();

  const stats = useMemo(() => {
    const active: GiftCard[] = [];
    const expired: GiftCard[] = [];
    const redeemed: GiftCard[] = [];
    const disabled: GiftCard[] = [];

    giftCards.forEach((card) => {
      const state = getCardEffectiveState(card, nowMs);
      if (state === 'active') active.push(card);
      else if (state === 'expired') expired.push(card);
      else if (state === 'redeemed') redeemed.push(card);
      else disabled.push(card);
    });

    const balanceByCurrency = active.reduce<Partial<Record<CurrencyCode, number>>>((acc, c) => {
      acc[c.currency] = (acc[c.currency] || 0) + c.remainingAmountCents;
      return acc;
    }, {});

    const primaryCurrency: CurrencyCode =
      balanceByCurrency.DOP !== undefined
        ? 'DOP'
        : active[0]?.currency || 'DOP';

    const primaryBalanceCents = balanceByCurrency[primaryCurrency] || 0;

    return {
      total: giftCards.length,
      activeCount: active.length,
      expiredCount: expired.length,
      redeemedCount: redeemed.length,
      disabledCount: disabled.length,
      primaryCurrency,
      primaryBalanceCents,
      balanceByCurrency,
    };
  }, [giftCards, nowMs]);

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toUpperCase();
    return giftCards.filter((card) => {
      const state = getCardEffectiveState(card, nowMs);
      if (filterStatus !== 'all' && state !== filterStatus) {
        return false;
      }
      if (q) {
        const hay = `${card.code} ${card.courseTitle || ''} ${card.note || ''} ${card.purchasedByEmail || ''} ${card.purchasedByName || ''}`.toUpperCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [giftCards, filterStatus, searchQuery, nowMs]);

  const statusTabs: ReadonlyArray<{ id: GiftCardFilterStatus; label: string; count: number }> = [
    { id: 'all', label: 'Todas', count: stats.total },
    { id: 'active', label: 'Activas', count: stats.activeCount },
    { id: 'expired', label: 'Vencidas', count: stats.expiredCount },
    { id: 'redeemed', label: 'Canjeadas', count: stats.redeemedCount },
    { id: 'disabled', label: 'Desactivadas', count: stats.disabledCount },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-4">
          <p className="text-xs text-[var(--dba-text-secondary)]">Gift Cards emitidas</p>
          <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-[var(--dba-text-primary)]">
            {stats.total}
          </p>
          <p className="text-[11px] text-[var(--dba-text-secondary)] mt-0.5">
            {stats.activeCount} activas · {stats.expiredCount} vencidas · {stats.redeemedCount} canjeadas
          </p>
        </div>

        <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-4">
          <p className="text-xs text-[var(--dba-text-secondary)]">Saldo activo disponible</p>
          <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-[var(--dba-accent-ink)]">
            {formatCurrency(stats.primaryBalanceCents, stats.primaryCurrency)}
          </p>
          <p className="text-[11px] text-[var(--dba-text-secondary)] mt-0.5">
            Crédito vigente listo para canje en cursos
          </p>
        </div>

        <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-4">
          <p className="text-xs text-[var(--dba-text-secondary)]">Canjes completados</p>
          <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {giftCardRedemptions.length}
          </p>
          <p className="text-[11px] text-[var(--dba-text-secondary)] mt-0.5">
            Inscripciones activadas con código
          </p>
        </div>
      </div>

      {/* Creator Card */}
      <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--dba-text-primary)] flex items-center gap-2">
              <Gift className="w-4 h-4 text-[var(--dba-accent-ink)]" />
              <span>Generar Gift Cards (Códigos de Canje)</span>
            </h3>
            <p className="text-xs text-[var(--dba-text-secondary)] mt-0.5">
              Crea códigos por el valor de un curso (ej. RD$600.00) para que el estudiante lo canjee y acceda al instante.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] px-3.5 py-2 text-xs font-semibold text-[var(--dba-accent-foreground)] transition-colors min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? 'Ocultar formulario' : 'Nueva Gift Card'}</span>
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-300 flex items-center justify-between gap-2">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="p-1 hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {justCreated.length > 0 && (
          <div className="rounded-xl border border-amber-300/70 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/25 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[var(--dba-accent-ink)]" />
                <span>
                  {justCreated.length === 1
                    ? 'Gift Card generada lista para entregar al estudiante:'
                    : `${justCreated.length} Gift Cards generadas listas para entregar:`}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setJustCreated([])}
                className="text-xs text-[var(--dba-text-secondary)] hover:underline"
              >
                Cerrar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {justCreated.map((gc) => (
                <button
                  key={gc.code}
                  type="button"
                  onClick={() => void handleCopy(gc.code)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--dba-border-strong)] bg-[var(--dba-bg-surface)] px-3 py-2 text-xs font-mono font-bold text-[var(--dba-text-primary)] hover:border-[var(--dba-accent-ink)] transition-colors"
                >
                  <span>{gc.code}</span>
                  <span className="text-[11px] font-sans font-semibold text-emerald-700 dark:text-emerald-400">
                    ({formatCurrency(gc.initialAmountCents, gc.currency)})
                  </span>
                  {copiedCode === gc.code ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[var(--dba-text-secondary)]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 md:grid-cols-3 gap-3.5 p-4 rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)]"
          >
            <label className="text-xs font-medium text-[var(--dba-text-primary)] md:col-span-2">
              Curso válido para esta Gift Card
              <select
                value={courseId}
                onChange={(e) => handleSelectCourse(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] px-3 py-2 text-xs text-[var(--dba-text-primary)] min-h-[38px]"
              >
                <option value="">Cualquier curso del catálogo (Uso general)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — {formatCurrency(c.priceCents, c.currency)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-[var(--dba-text-primary)]">
              Moneda
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="mt-1 w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] px-3 py-2 text-xs text-[var(--dba-text-primary)] min-h-[38px]"
              >
                <option value="DOP">{currencyLabel('DOP')}</option>
                <option value="USD">{currencyLabel('USD')}</option>
                <option value="EUR">{currencyLabel('EUR')}</option>
                <option value="MXN">{currencyLabel('MXN')}</option>
              </select>
            </label>

            <label className="text-xs font-medium text-[var(--dba-text-primary)]">
              <span className="flex items-center justify-between gap-2">
                <span>Valor de la Gift Card ({currency})</span>
                {selectedCourse && selectedCourse.priceCents > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmountInput((selectedCourse.priceCents / 100).toString())}
                    className="text-[11px] font-semibold text-[var(--dba-accent-ink)] hover:underline"
                  >
                    Igualar ({formatCurrency(selectedCourse.priceCents, selectedCourse.currency)})
                  </button>
                )}
              </span>
              <input
                type="number"
                min={1}
                max={1000000}
                step="0.01"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="600"
                required
                className="mt-1 w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] px-3 py-2 text-xs font-mono text-[var(--dba-text-primary)] min-h-[38px]"
              />
            </label>

            <label className="text-xs font-medium text-[var(--dba-text-primary)]">
              Modalidad de saldo
              <select
                value={singleUse ? 'single' : 'balance'}
                onChange={(e) => setSingleUse(e.target.value === 'single')}
                className="mt-1 w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] px-3 py-2 text-xs text-[var(--dba-text-primary)] min-h-[38px]"
              >
                <option value="single">Uso único (cierra la tarjeta tras canje)</option>
                <option value="balance">Saldo reutilizable (conserva sobrante)</option>
              </select>
            </label>

            <label className="text-xs font-medium text-[var(--dba-text-primary)]">
              Cantidad de códigos (1–20)
              <input
                type="number"
                min={1}
                max={20}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                className="mt-1 w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] px-3 py-2 text-xs font-mono text-[var(--dba-text-primary)] min-h-[38px]"
              />
            </label>

            {quantity === 1 && (
              <label className="text-xs font-medium text-[var(--dba-text-primary)]">
                Código personalizado (opcional)
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  placeholder="Ej: EXCEL-600-VIP (vacío = automático)"
                  className="mt-1 w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] px-3 py-2 text-xs font-mono uppercase text-[var(--dba-text-primary)] min-h-[38px]"
                />
              </label>
            )}

            <label className="text-xs font-medium text-[var(--dba-text-primary)]">
              Fecha de expiración (opcional)
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] px-3 py-2 text-xs text-[var(--dba-text-primary)] min-h-[38px]"
              />
            </label>

            <label className={`text-xs font-medium text-[var(--dba-text-primary)] ${quantity > 1 ? 'md:col-span-2' : ''}`}>
              Nota interna / Destinatario (opcional)
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                placeholder="Ej: Beca completa · Alumno corporativo"
                className="mt-1 w-full rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] px-3 py-2 text-xs text-[var(--dba-text-primary)] min-h-[38px]"
              />
            </label>

            <div className="md:col-span-3 flex items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-[var(--dba-text-secondary)]">
                Equivale a{' '}
                <strong className="font-mono text-[var(--dba-text-primary)]">
                  {formatCurrency(Math.round((Number(amountInput) || 0) * 100), currency)}
                </strong>{' '}
                por código.
              </p>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] disabled:opacity-60 px-4 py-2 text-xs font-semibold text-[var(--dba-accent-foreground)] transition-colors min-h-[38px]"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>{saving ? 'Generando...' : quantity > 1 ? `Generar ${quantity} Gift Cards` : 'Generar Gift Card'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Gift Cards Table */}
      <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] overflow-hidden">
        <div className="p-4 border-b border-[var(--dba-border)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-[var(--dba-text-primary)]">
              Inventario de Gift Cards ({filteredCards.length})
            </h4>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--dba-text-secondary)] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar código o nota..."
                className="w-full sm:w-64 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] pl-8 pr-3 py-1.5 text-xs text-[var(--dba-text-primary)]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {statusTabs.map((tab) => {
              const active = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[var(--dba-accent)] text-[var(--dba-accent-foreground)]'
                      : 'border border-[var(--dba-border)] bg-[var(--dba-bg-canvas)] text-[var(--dba-text-secondary)] hover:text-[var(--dba-text-primary)]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="font-mono tabular-nums text-[11px] opacity-80">
                    ({tab.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--dba-border)] text-[var(--dba-text-secondary)]">
              <tr>
                <th className="py-2.5 px-4 font-medium">Código</th>
                <th className="py-2.5 px-4 font-medium">Saldo / Valor</th>
                <th className="py-2.5 px-4 font-medium">Alcance</th>
                <th className="py-2.5 px-4 font-medium">Uso</th>
                <th className="py-2.5 px-4 font-medium">Estado</th>
                <th className="py-2.5 px-4 font-medium">Expira</th>
                <th className="py-2.5 px-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--dba-border)]">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--dba-text-secondary)]">
                    {giftCards.length === 0
                      ? 'No hay Gift Cards generadas todavía. Crea tu primera Gift Card arriba.'
                      : 'No hay Gift Cards que coincidan con el filtro seleccionado.'}
                  </td>
                </tr>
              ) : (
                filteredCards.map((card) => {
                  const effectiveState = getCardEffectiveState(card, nowMs);
                  const isConfirming = confirmDeleteCode === card.code;
                  return (
                    <tr key={card.code} className="hover:bg-stone-50/70 dark:hover:bg-zinc-800/30">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[var(--dba-text-primary)]">
                            {card.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleCopy(card.code)}
                            title="Copiar código"
                            className="p-1 rounded hover:bg-stone-200/70 dark:hover:bg-zinc-700 text-[var(--dba-text-secondary)]"
                          >
                            {copiedCode === card.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {card.note && (
                          <p className="text-[11px] text-[var(--dba-text-secondary)] mt-0.5 truncate max-w-[200px]">
                            {card.note}
                          </p>
                        )}
                        {card.purchasedByEmail && (
                          <p className="text-[11px] text-[var(--dba-text-secondary)] mt-0.5 truncate max-w-[220px]">
                            Comprada por: {card.purchasedByName ? `${card.purchasedByName} · ` : ''}{card.purchasedByEmail}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums">
                        <span className="font-semibold text-[var(--dba-text-primary)]">
                          {formatCurrency(card.remainingAmountCents, card.currency)}
                        </span>
                        {card.remainingAmountCents !== card.initialAmountCents && (
                          <span className="text-[11px] text-[var(--dba-text-secondary)] ml-1">
                            / {formatCurrency(card.initialAmountCents, card.currency)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-[var(--dba-text-secondary)] max-w-[180px] truncate">
                        {card.courseId ? card.courseTitle || card.courseId : 'Cualquier curso'}
                      </td>
                      <td className="py-2.5 px-4 text-[var(--dba-text-secondary)]">
                        {card.singleUse ? 'Único' : 'Saldo'} ({card.redemptionCount})
                      </td>
                      <td className="py-2.5 px-4">
                        {effectiveState === 'redeemed' ? (
                          <span className="inline-flex items-center rounded bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                            Canjeada
                          </span>
                        ) : effectiveState === 'expired' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-red-50 dark:bg-red-950/40 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:text-red-400">
                            <Clock className="w-3 h-3" />
                            <span>Vencida</span>
                          </span>
                        ) : effectiveState === 'active' ? (
                          <span className="inline-flex items-center rounded bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-500">
                            Desactivada
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-2.5 px-4 ${
                          effectiveState === 'expired'
                            ? 'font-semibold text-red-600 dark:text-red-400'
                            : 'text-[var(--dba-text-secondary)]'
                        }`}
                      >
                        {formatDate(card.expiresAt)}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        {isConfirming ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => void handleDelete(card.code)}
                              className="px-2 py-1 rounded bg-red-600 text-white text-[11px] font-semibold hover:bg-red-700"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteCode(null)}
                              className="px-2 py-1 rounded border border-[var(--dba-border)] text-[11px]"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            {effectiveState !== 'redeemed' && effectiveState !== 'expired' && (
                              <button
                                type="button"
                                onClick={() => void handleToggle(card)}
                                title={card.active ? 'Desactivar' : 'Activar'}
                                className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-zinc-800"
                              >
                                {card.active ? (
                                  <ToggleRight className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4 text-zinc-400" />
                                )}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteCode(card.code)}
                              title="Eliminar Gift Card"
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Redemption History */}
      <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] overflow-hidden">
        <div className="p-4 border-b border-[var(--dba-border)]">
          <h4 className="text-sm font-bold text-[var(--dba-text-primary)]">
            Historial de Canjes ({giftCardRedemptions.length})
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--dba-border)] text-[var(--dba-text-secondary)]">
              <tr>
                <th className="py-2.5 px-4 font-medium">Código</th>
                <th className="py-2.5 px-4 font-medium">Estudiante</th>
                <th className="py-2.5 px-4 font-medium">Curso desbloqueado</th>
                <th className="py-2.5 px-4 font-medium text-right">Cubierto</th>
                <th className="py-2.5 px-4 font-medium text-right">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--dba-border)]">
              {giftCardRedemptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[var(--dba-text-secondary)]">
                    Aún no se ha canjeado ninguna Gift Card.
                  </td>
                </tr>
              ) : (
                giftCardRedemptions.map((r) => {
                  const resolvedEmail = !isPlaceholderCampusEmail(r.studentEmail)
                    ? r.studentEmail!.trim()
                    : !isPlaceholderCampusEmail(studentEmailsMap[r.studentId])
                      ? studentEmailsMap[r.studentId].trim()
                      : '';
                  return (
                  <tr key={r.id}>
                    <td className="py-2.5 px-4 font-mono font-semibold text-[var(--dba-text-primary)]">
                      {r.cardCode}
                    </td>
                    <td className="py-2.5 px-4 text-[var(--dba-text-primary)]">
                      <span>{r.studentName}</span>
                      {resolvedEmail && (
                        <span className="block text-[11px] text-[var(--dba-text-secondary)]">
                          {resolvedEmail}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-[var(--dba-text-secondary)] max-w-[220px] truncate">
                      {r.courseTitle}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(r.amountAppliedCents, r.currency)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--dba-text-secondary)]">
                      {formatDate(r.redeemedAt)}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

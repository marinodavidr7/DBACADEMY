import React, { useState } from 'react';
import { Check, Copy, Plus, Tag, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import type { Coupon, CurrencyCode } from '../types';
import { currencyLabel, formatCurrency } from '../utils/currency';

const emptyForm = {
  code: '',
  description: '',
  type: 'percent' as 'percent' | 'fixed',
  value: 10,
  currency: 'DOP' as CurrencyCode,
  appliesTo: 'all' as 'all' | 'courses',
  selectedCourseIds: [] as string[],
  maxRedemptions: '',
  maxPerUser: '1',
  minPurchaseCents: '',
  startsAt: '',
  expiresAt: '',
};

function formatDate(val: unknown): string {
  if (!val) return 'Sin límite';
  let date: Date | null = null;
  if (
    typeof val === 'object' &&
    val !== null &&
    'toDate' in val &&
    typeof (val as { toDate: unknown }).toDate === 'function'
  ) {
    date = (val as { toDate: () => Date }).toDate();
  } else if (typeof val === 'string' || typeof val === 'number') {
    date = new Date(val);
  }
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const CouponsAdminPanel: React.FC = () => {
  const { courses, coupons, createCoupon, toggleCouponActive, deleteCoupon, t } = usePlatform();
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [confirmDeleteCode, setConfirmDeleteCode] = useState<string | null>(null);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => {
        setCopiedCode((prev) => (prev === code ? null : prev));
      }, 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setForm((prev) => {
      const exists = prev.selectedCourseIds.includes(courseId);
      return {
        ...prev,
        selectedCourseIds: exists
          ? prev.selectedCourseIds.filter((id) => id !== courseId)
          : [...prev.selectedCourseIds, courseId],
      };
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createCoupon({
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        type: form.type,
        value: Number(form.value),
        currency: form.currency,
        appliesTo: form.appliesTo,
        courseIds: form.appliesTo === 'courses' ? form.selectedCourseIds : [],
        maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : undefined,
        maxPerUser: form.maxPerUser ? Number(form.maxPerUser) : 1,
        minPurchaseCents: form.minPurchaseCents ? Number(form.minPurchaseCents) : undefined,
        startsAtIso: form.startsAt || undefined,
        expiresAtIso: form.expiresAt || undefined,
      });
      setShowForm(false);
      setForm(emptyForm);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error creando cupón');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (coupon: Coupon) => {
    setError('');
    try {
      await toggleCouponActive(coupon);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error actualizando cupón');
    }
  };

  const confirmRemove = async (coupon: Coupon) => {
    setError('');
    try {
      await deleteCoupon(coupon.code);
      setConfirmDeleteCode(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error eliminando cupón');
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'DBA-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm((f) => ({ ...f, code }));
  };

  return (
    <div className="rounded-xl border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--dba-text-primary)] flex items-center gap-2">
            <Tag className="w-4 h-4 text-[var(--dba-accent-ink)]" />
            <span>{t('couponsTitle')}</span>
          </h3>
          <p className="text-xs text-[var(--dba-text-secondary)] mt-0.5">
            Administra cupones promocionales sincronizados directamente en Firestore.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] text-[var(--dba-accent-foreground)] text-xs font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> {t('createCoupon')}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300/80 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-700 dark:text-red-300 flex items-center justify-between gap-2">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="p-0.5 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={save}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-[var(--dba-bg-canvas)] border border-[var(--dba-border)]"
        >
          <label className="text-xs font-medium text-[var(--dba-text-primary)]">
            Código
            <div className="flex gap-1.5 mt-1">
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="EJ: DBA-VERANO20"
                className="flex-1 px-2.5 py-2 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] font-mono uppercase text-xs"
                required
              />
              <button
                type="button"
                onClick={generateCode}
                className="px-2.5 py-2 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] text-xs font-medium hover:bg-stone-100 dark:hover:bg-zinc-800"
              >
                {t('generateCode')}
              </button>
            </div>
          </label>

          <label className="text-xs font-medium text-[var(--dba-text-primary)]">
            Descripción
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ej: 20% de descuento lanzamiento"
              className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] text-xs"
              required
            />
          </label>

          <label className="text-xs font-medium text-[var(--dba-text-primary)]">
            Tipo
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'percent' | 'fixed' })}
              className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] text-xs"
            >
              <option value="percent">% Porcentaje</option>
              <option value="fixed">Monto fijo (centavos)</option>
            </select>
          </label>

          <label className="text-xs font-medium text-[var(--dba-text-primary)]">
            {form.type === 'percent' ? 'Porcentaje (1 - 100)' : 'Valor en centavos (ej: 5000 = $50)'}
            <input
              type="number"
              min={1}
              max={form.type === 'percent' ? 100 : 10000000}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
              className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] text-xs"
              required
            />
          </label>

          <label className="text-xs font-medium text-[var(--dba-text-primary)]">
            Moneda
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value as CurrencyCode })}
              className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] text-xs"
            >
              <option value="DOP">{currencyLabel('DOP')}</option>
              <option value="USD">{currencyLabel('USD')}</option>
              <option value="EUR">{currencyLabel('EUR')}</option>
              <option value="MXN">{currencyLabel('MXN')}</option>
            </select>
          </label>

          <label className="text-xs font-medium text-[var(--dba-text-primary)]">
            Aplica a
            <select
              value={form.appliesTo}
              onChange={(e) => setForm({ ...form, appliesTo: e.target.value as 'all' | 'courses' })}
              className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] text-xs"
            >
              <option value="all">Todos los cursos</option>
              <option value="courses">Cursos específicos</option>
            </select>
          </label>

          {form.appliesTo === 'courses' && (
            <div className="md:col-span-3 space-y-1.5">
              <p className="text-xs font-medium text-[var(--dba-text-primary)]">
                Selecciona los cursos válidos
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {courses.map((course) => {
                  const checked = form.selectedCourseIds.includes(course.id);
                  return (
                    <label
                      key={course.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer ${
                        checked
                          ? 'border-[var(--dba-accent-ink)] bg-amber-50/60 dark:bg-amber-950/20'
                          : 'border-[var(--dba-border)] bg-[var(--dba-bg-surface)]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCourseSelection(course.id)}
                      />
                      <span className="truncate font-medium">{course.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <label className="text-xs font-medium text-[var(--dba-text-primary)]">
            Máx. canjes total (opcional)
            <input
              type="number"
              min={1}
              value={form.maxRedemptions}
              onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
              placeholder="Ilimitado"
              className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] text-xs"
            />
          </label>

          <label className="text-xs font-medium text-[var(--dba-text-primary)]">
            Máx. por usuario
            <input
              type="number"
              min={1}
              value={form.maxPerUser}
              onChange={(e) => setForm({ ...form, maxPerUser: e.target.value })}
              className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] text-xs"
            />
          </label>

          <label className="text-xs font-medium text-[var(--dba-text-primary)]">
            Compra mínima en centavos (opcional)
            <input
              type="number"
              min={0}
              value={form.minPurchaseCents}
              onChange={(e) => setForm({ ...form, minPurchaseCents: e.target.value })}
              placeholder="0"
              className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] text-xs"
            />
          </label>

          <label className="text-xs font-medium text-[var(--dba-text-primary)]">
            Inicio (opcional)
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] text-xs"
            />
          </label>

          <label className="text-xs font-medium text-[var(--dba-text-primary)]">
            Expira (opcional)
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="mt-1 w-full px-2.5 py-2 rounded-lg border border-[var(--dba-border)] bg-[var(--dba-bg-surface)] text-xs"
            />
          </label>

          <div className="md:col-span-3 flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3.5 py-2 rounded-lg border border-[var(--dba-border)] text-xs font-medium hover:bg-stone-100 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[var(--dba-accent)] hover:bg-[var(--dba-accent-hover)] text-[var(--dba-accent-foreground)] text-xs font-semibold disabled:opacity-50"
            >
              {saving ? 'Guardando...' : t('saveCoupon')}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[var(--dba-text-secondary)] border-b border-[var(--dba-border)]">
              <th className="py-2 pr-3">Código</th>
              <th className="py-2 pr-3">Descuento</th>
              <th className="py-2 pr-3">Vigencia</th>
              <th className="py-2 pr-3">Usos</th>
              <th className="py-2 pr-3">Estado</th>
              <th className="py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-[var(--dba-border)]/70">
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-[var(--dba-text-primary)]">
                      {c.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleCopy(c.code)}
                      className="p-1 rounded hover:bg-stone-100 dark:hover:bg-zinc-800 text-[var(--dba-text-secondary)]"
                      title="Copiar código"
                    >
                      {copiedCode === c.code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--dba-text-secondary)]">{c.description}</p>
                </td>
                <td className="py-2.5 pr-3 font-mono font-semibold">
                  {c.type === 'percent' ? `${c.value}%` : formatCurrency(c.value, c.currency)}
                </td>
                <td className="py-2.5 pr-3 text-[var(--dba-text-secondary)]">
                  {formatDate(c.expiresAt)}
                </td>
                <td className="py-2.5 pr-3 font-mono">
                  {c.redemptionCount}/{c.maxRedemptions ?? '∞'}
                </td>
                <td className="py-2.5 pr-3">
                  {c.active ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Activo</span>
                  ) : (
                    <span className="text-[var(--dba-text-secondary)]">Inactivo</span>
                  )}
                </td>
                <td className="py-2.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => void toggle(c)}
                      className="p-1.5 rounded hover:bg-stone-100 dark:hover:bg-zinc-800"
                      title={c.active ? 'Desactivar' : 'Activar'}
                    >
                      {c.active ? (
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-[var(--dba-text-secondary)]" />
                      )}
                    </button>
                    {confirmDeleteCode === c.code ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void confirmRemove(c)}
                          className="px-2 py-1 rounded bg-red-600 text-white text-[11px] font-semibold"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCode(null)}
                          className="px-2 py-1 rounded border border-[var(--dba-border)] text-[11px]"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteCode(c.code)}
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                        title="Eliminar cupón"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-[var(--dba-text-secondary)]">
                  No hay cupones creados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

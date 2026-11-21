import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import type { Coupon } from '../types';

const emptyForm = {
  code: '',
  description: '',
  type: 'percent' as 'percent' | 'fixed',
  value: 10,
  currency: 'USD' as 'USD' | 'EUR' | 'MXN',
  appliesTo: 'all' as 'all' | 'courses',
  courseIds: '',
  maxRedemptions: '',
  maxPerUser: '1',
  minPurchaseCents: '',
  startsAt: '',
  expiresAt: '',
};

export const CouponsAdminPanel: React.FC = () => {
  const { user, courses, t } = usePlatform();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const authHeaders = async () => {
    const token = await user?.getIdToken();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/coupons', { headers: await authHeaders() });
      const data = (await res.json()) as { coupons?: Coupon[]; error?: string };
      if (!res.ok) throw new Error(data.error || 'Error cargando cupones');
      setCoupons(data.coupons || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando cupones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [user?.uid]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        type: form.type,
        value: Number(form.value),
        currency: form.currency,
        appliesTo: form.appliesTo,
        courseIds: form.courseIds.split(',').map((s) => s.trim()).filter(Boolean),
        maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : undefined,
        maxPerUser: form.maxPerUser ? Number(form.maxPerUser) : 1,
        minPurchaseCents: form.minPurchaseCents ? Number(form.minPurchaseCents) : undefined,
        startsAt: form.startsAt || undefined,
        expiresAt: form.expiresAt || undefined,
      };
      const res = await fetch('/api/coupons', { method: 'POST', headers: await authHeaders(), body: JSON.stringify(body) });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Error creando cupón');
      setShowForm(false);
      setForm(emptyForm);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error creando cupón');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/coupons/${coupon.code}/toggle`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ active: !coupon.active }),
      });
      if (!res.ok) throw new Error('Error actualizando cupón');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  };

  const remove = async (coupon: Coupon) => {
    if (!confirm(`¿Eliminar cupón ${coupon.code}?`)) return;
    try {
      const res = await fetch(`/api/coupons/${coupon.code}`, { method: 'DELETE', headers: await authHeaders() });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Error eliminando cupón');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'DBA-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm((f) => ({ ...f, code }));
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('couponsTitle')}</h3>
        <div className="flex gap-2">
          <button onClick={() => void load()} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium">
            <Plus className="w-4 h-4" /> {t('createCoupon')}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {showForm && (
        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
          <label className="text-xs">Código
            <div className="flex gap-1 mt-1">
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="flex-1 px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" required />
              <button type="button" onClick={generateCode} className="px-2 py-2 rounded border border-slate-300 dark:border-slate-700 text-xs">{t('generateCode')}</button>
            </div>
          </label>
          <label className="text-xs">Descripción<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" required /></label>
          <label className="text-xs">Tipo
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'percent' | 'fixed' })} className="mt-1 w-full px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
              <option value="percent">% Porcentaje</option>
              <option value="fixed">Monto fijo (centavos)</option>
            </select>
          </label>
          <label className="text-xs">Valor<input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} className="mt-1 w-full px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" required /></label>
          <label className="text-xs">Moneda
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as 'USD' | 'EUR' | 'MXN' })} className="mt-1 w-full px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
              <option>USD</option><option>EUR</option><option>MXN</option>
            </select>
          </label>
          <label className="text-xs">Aplica a
            <select value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value as 'all' | 'courses' })} className="mt-1 w-full px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
              <option value="all">Todos los cursos</option>
              <option value="courses">Cursos específicos</option>
            </select>
          </label>
          {form.appliesTo === 'courses' && (
            <label className="text-xs md:col-span-3">IDs de cursos (coma separados)
              <input value={form.courseIds} onChange={(e) => setForm({ ...form, courseIds: e.target.value })} placeholder={courses.map((c) => c.id).slice(0, 3).join(', ')} className="mt-1 w-full px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
            </label>
          )}
          <label className="text-xs">Máx. canjes total<input type="number" value={form.maxRedemptions} onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })} className="mt-1 w-full px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" /></label>
          <label className="text-xs">Máx. por usuario<input type="number" value={form.maxPerUser} onChange={(e) => setForm({ ...form, maxPerUser: e.target.value })} className="mt-1 w-full px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" /></label>
          <label className="text-xs">Compra mínima (centavos)<input type="number" value={form.minPurchaseCents} onChange={(e) => setForm({ ...form, minPurchaseCents: e.target.value })} className="mt-1 w-full px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" /></label>
          <label className="text-xs">Inicio<input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="mt-1 w-full px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" /></label>
          <label className="text-xs">Expira<input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="mt-1 w-full px-2 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" /></label>
          <div className="md:col-span-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 rounded border border-slate-300 dark:border-slate-700 text-xs">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-blue-600 text-white text-xs font-medium disabled:opacity-50">{saving ? 'Guardando...' : t('saveCoupon')}</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
            <th className="py-2 pr-2">Código</th><th className="py-2 pr-2">Tipo/Valor</th><th className="py-2 pr-2">Vigencia</th><th className="py-2 pr-2">Usos</th><th className="py-2 pr-2">Estado</th><th className="py-2">Acciones</th>
          </tr></thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="py-2 pr-2 font-mono font-semibold">{c.code}</td>
                <td className="py-2 pr-2">{c.type === 'percent' ? `${c.value}%` : `${c.value} ${c.currency}`}</td>
                <td className="py-2 pr-2">{c.expiresAt ? new Date(String(c.expiresAt)).toLocaleDateString() : '—'}</td>
                <td className="py-2 pr-2">{c.redemptionCount}/{c.maxRedemptions ?? '∞'}</td>
                <td className="py-2 pr-2">{c.active ? <span className="text-emerald-600">Activo</span> : <span className="text-slate-400">Inactivo</span>}</td>
                <td className="py-2 flex gap-1">
                  <button onClick={() => void toggle(c)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title={c.active ? 'Desactivar' : 'Activar'}>
                    {c.active ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                  </button>
                  <button onClick={() => void remove(c)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && !loading && (
              <tr><td colSpan={6} className="py-4 text-center text-slate-400">No hay cupones.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Mail, Save, User } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { AuthGateNotice } from './AuthGateNotice';

export const UserAccountView: React.FC = () => {
  const { user, profile, authenticatedEmail, updateUserProfile, t } = usePlatform();
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setDisplayName(profile?.displayName || user?.displayName || '');
  }, [profile?.displayName, user?.displayName]);

  if (!user) return <AuthGateNotice />;

  const email = authenticatedEmail || user.email || '';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateUserProfile({ displayName });
      setSuccess('Perfil actualizado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl lg:text-4xl 2xl:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Mi cuenta
        </h1>
        <p className="mt-2 text-sm 2xl:text-base text-slate-600 dark:text-slate-300">
          Administra tu información de perfil. Tu nombre se sincroniza en toda la plataforma.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSave(e)}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-5"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <User className="w-4 h-4" />
            Nombre de visualización
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            minLength={2}
            maxLength={100}
            required
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
            placeholder="Tu nombre"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Correo electrónico autenticado
          </label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Este correo proviene de tu sesión autenticada y se usa para sincronizar tu identidad en la plataforma.
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {success}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white min-h-[44px]"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
};

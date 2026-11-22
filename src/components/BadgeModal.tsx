import React, { useState } from 'react';
import {
  Award,
  Check,
  Copy,
  Download,
  ExternalLink,
  Flame,
  Linkedin,
  Lock,
  Share2,
  Shield,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import {
  buildLinkedInAddCertUrl,
  buildLinkedInShareFeedUrl,
  buildSuggestedPostText,
  downloadBadgeAsSvg,
  type DigitalBadge,
} from '../utils/badges';

interface BadgeModalProps {
  badge: DigitalBadge;
  onClose: () => void;
}

export const BadgeModal: React.FC<BadgeModalProps> = ({ badge, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const linkedinAddUrl = buildLinkedInAddCertUrl(badge);
  const linkedinShareFeedUrl = buildLinkedInShareFeedUrl(badge);
  const suggestedText = buildSuggestedPostText(badge);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(badge.verificationUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // fallback
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(suggestedText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2200);
    } catch {
      // fallback
    }
  };

  const themeStyles = {
    gold: {
      border: 'border-amber-500/40',
      glow: 'shadow-amber-500/20',
      gradient: 'from-amber-500/20 via-slate-900 to-[#0A0F1D]',
      accentText: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      ringColor: '#F59E0B',
    },
    blue: {
      border: 'border-blue-500/40',
      glow: 'shadow-blue-500/20',
      gradient: 'from-blue-500/20 via-slate-900 to-[#0A0F1D]',
      accentText: 'text-blue-400',
      badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
      ringColor: '#3B82F6',
    },
    cyan: {
      border: 'border-cyan-500/40',
      glow: 'shadow-cyan-500/20',
      gradient: 'from-cyan-500/20 via-slate-900 to-[#0A0F1D]',
      accentText: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      ringColor: '#06B6D4',
    },
    emerald: {
      border: 'border-emerald-500/40',
      glow: 'shadow-emerald-500/20',
      gradient: 'from-emerald-500/20 via-slate-900 to-[#0A0F1D]',
      accentText: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      ringColor: '#10B981',
    },
    purple: {
      border: 'border-purple-500/40',
      glow: 'shadow-purple-500/20',
      gradient: 'from-purple-500/20 via-slate-900 to-[#0A0F1D]',
      accentText: 'text-purple-400',
      badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      ringColor: '#8B5CF6',
    },
  }[badge.theme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0B1120] text-slate-100 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Linkedin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Insignia Digital Verificable
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${themeStyles.badgeBg}`}>
                {badge.category}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Emitida oficialmente por DB Academy con respaldo criptográfico SHA-256
            </p>
          </div>
        </div>

        {/* Visual Badge Preview */}
        <div
          className={`relative rounded-2xl border ${themeStyles.border} bg-gradient-to-b ${themeStyles.gradient} p-6 sm:p-8 text-center space-y-5 shadow-xl ${themeStyles.glow}`}
        >
          {/* Emblem Icon Shield */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-700/60 animate-spin-slow" />
            <div className={`w-20 h-20 rounded-2xl rotate-45 border-2 ${themeStyles.border} bg-slate-900/90 flex items-center justify-center shadow-lg`}>
              <div className="-rotate-45">
                {badge.iconType === 'award' && <Award className={`w-9 h-9 ${themeStyles.accentText}`} />}
                {badge.iconType === 'zap' && <Zap className={`w-9 h-9 ${themeStyles.accentText}`} />}
                {badge.iconType === 'shield' && <Shield className={`w-9 h-9 ${themeStyles.accentText}`} />}
                {badge.iconType === 'flame' && <Flame className={`w-9 h-9 ${themeStyles.accentText}`} />}
                {badge.iconType === 'sparkles' && <Sparkles className={`w-9 h-9 ${themeStyles.accentText}`} />}
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              DB ACADEMY · CREDENCIAL OFICIAL
            </p>
            <h3 className="mt-1 text-2xl font-black text-white leading-tight">
              {badge.title}
            </h3>
            <p className="text-sm font-medium text-slate-300 mt-1">
              {badge.subtitle}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-around gap-4 text-xs">
            <div>
              <p className="text-slate-500 font-semibold uppercase text-[10px]">Otorgado a</p>
              <p className={`font-bold text-sm ${themeStyles.accentText}`}>{badge.studentName}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold uppercase text-[10px]">Código de Credencial</p>
              <p className="font-mono font-bold text-white text-sm">{badge.code}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold uppercase text-[10px]">Emisión</p>
              <p className="font-semibold text-slate-200 text-sm">{badge.issueDate}</p>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 truncate pt-1">
            Firma SHA-256: {badge.hashSignature}
          </div>
        </div>

        {/* Primary LinkedIn Actions */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Comparte y acredita tu logro en LinkedIn
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1-Click Add to Profile */}
            <a
              href={linkedinAddUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white px-5 py-3 text-xs sm:text-sm font-semibold shadow-lg shadow-[#0A66C2]/20 transition"
            >
              <Linkedin className="w-4 h-4 fill-current shrink-0" />
              <span>Añadir a mi perfil de LinkedIn</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-auto" />
            </a>

            {/* Share to LinkedIn Feed */}
            <a
              href={linkedinShareFeedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 px-5 py-3 text-xs sm:text-sm font-semibold transition"
            >
              <Share2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Publicar en mi Feed</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-auto" />
            </a>
          </div>

          {/* Copy Verification Link & Download */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#101827] hover:bg-slate-800/60 px-4 py-2.5 text-xs font-medium text-slate-300 transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? '¡Enlace copiado al portapapeles!' : 'Copiar enlace verificable'}</span>
            </button>

            <button
              type="button"
              onClick={() => downloadBadgeAsSvg(badge)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#101827] hover:bg-slate-800/60 px-4 py-2.5 text-xs font-medium text-slate-300 transition"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Descargar Insignia Vectorial (.SVG)</span>
            </button>
          </div>
        </div>

        {/* Suggested Post Text Box */}
        <div className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Texto sugerido para tu publicación en LinkedIn:</span>
            <button
              type="button"
              onClick={() => void handleCopyText()}
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copiado' : 'Copiar texto'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-300 italic whitespace-pre-wrap leading-relaxed">
            {suggestedText}
          </p>
        </div>
      </div>
    </div>
  );
};

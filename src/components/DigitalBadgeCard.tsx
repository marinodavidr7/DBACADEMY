import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  ExternalLink,
  Flame,
  Linkedin,
  Lock,
  Share2,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  buildLinkedInAddCertUrl,
  type DigitalBadge,
} from '../utils/badges';

interface DigitalBadgeCardProps {
  badge: DigitalBadge;
  onOpenDetails: (badge: DigitalBadge) => void;
}

export const DigitalBadgeCard: React.FC<DigitalBadgeCardProps> = ({
  badge,
  onOpenDetails,
}) => {
  const linkedinAddUrl = buildLinkedInAddCertUrl(badge);

  const themeConfig = {
    gold: {
      border: 'border-amber-500/40 hover:border-amber-400',
      glow: 'hover:shadow-amber-500/10',
      bgGlow: 'from-amber-500/15 via-slate-900 to-[#0F172A]',
      accentText: 'text-amber-400',
      pill: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      badgeBorder: 'border-amber-400/80',
    },
    blue: {
      border: 'border-blue-500/40 hover:border-blue-400',
      glow: 'hover:shadow-blue-500/10',
      bgGlow: 'from-blue-500/15 via-slate-900 to-[#0F172A]',
      accentText: 'text-blue-400',
      pill: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      badgeBorder: 'border-blue-400/80',
    },
    cyan: {
      border: 'border-cyan-500/40 hover:border-cyan-400',
      glow: 'hover:shadow-cyan-500/10',
      bgGlow: 'from-cyan-500/15 via-slate-900 to-[#0F172A]',
      accentText: 'text-cyan-400',
      pill: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      badgeBorder: 'border-cyan-400/80',
    },
    emerald: {
      border: 'border-emerald-500/40 hover:border-emerald-400',
      glow: 'hover:shadow-emerald-500/10',
      bgGlow: 'from-emerald-500/15 via-slate-900 to-[#0F172A]',
      accentText: 'text-emerald-400',
      pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      badgeBorder: 'border-emerald-400/80',
    },
    purple: {
      border: 'border-purple-500/40 hover:border-purple-400',
      glow: 'hover:shadow-purple-500/10',
      bgGlow: 'from-purple-500/15 via-slate-900 to-[#0F172A]',
      accentText: 'text-purple-400',
      pill: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      badgeBorder: 'border-purple-400/80',
    },
  }[badge.theme];

  return (
    <div
      className={`group relative rounded-2xl border ${themeConfig.border} bg-[#0D1526] p-6 flex flex-col justify-between gap-5 transition-all duration-300 hover:shadow-xl ${themeConfig.glow} overflow-hidden`}
    >
      {/* Background Ambient Glow */}
      <div
        className={`absolute -right-20 -top-20 w-44 h-44 rounded-full bg-gradient-to-br ${themeConfig.bgGlow} blur-2xl opacity-50 group-hover:opacity-80 transition-opacity pointer-events-none`}
      />

      <div className="space-y-4 relative z-10">
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${themeConfig.pill}`}>
            {badge.category}
          </span>
          {badge.unlocked ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Desbloqueada</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5" />
              <span>{badge.progressPercent}%</span>
            </div>
          )}
        </div>

        {/* Badge Emblem Centerpiece */}
        <div className="flex items-center gap-4 pt-1">
          <div className="relative shrink-0 w-16 h-16 flex items-center justify-center">
            <div className={`w-14 h-14 rounded-xl rotate-45 border-2 ${themeConfig.badgeBorder} bg-slate-900/90 flex items-center justify-center shadow-md`}>
              <div className="-rotate-45">
                {badge.iconType === 'award' && <Award className={`w-7 h-7 ${themeConfig.accentText}`} />}
                {badge.iconType === 'zap' && <Zap className={`w-7 h-7 ${themeConfig.accentText}`} />}
                {badge.iconType === 'shield' && <Shield className={`w-7 h-7 ${themeConfig.accentText}`} />}
                {badge.iconType === 'flame' && <Flame className={`w-7 h-7 ${themeConfig.accentText}`} />}
                {badge.iconType === 'sparkles' && <Sparkles className={`w-7 h-7 ${themeConfig.accentText}`} />}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-bold text-white group-hover:text-blue-200 transition-colors line-clamp-2">
              {badge.title}
            </h3>
            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
              {badge.subtitle}
            </p>
          </div>
        </div>

        {/* Description & Criteria */}
        <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
          {badge.description}
        </p>

        {/* Verification Info */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-mono text-slate-300 font-medium">{badge.code}</span>
          <span>{badge.issueDate}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 relative z-10">
        {badge.unlocked ? (
          <>
            {/* 1-Click LinkedIn Add Button */}
            <a
              href={linkedinAddUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white px-3.5 py-2 text-xs font-semibold shadow-md shadow-[#0A66C2]/20 transition"
              title="Añadir credencial a tu perfil de LinkedIn"
            >
              <Linkedin className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>Añadir a LinkedIn</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>

            {/* View Full Badge Modal */}
            <button
              type="button"
              onClick={() => onOpenDetails(badge)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/70 hover:bg-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Ver e Compartir</span>
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-between text-xs text-slate-400">
            <span className="line-clamp-1">{badge.criteria}</span>
            <span className="font-mono text-cyan-400 font-bold ml-2 shrink-0">{badge.progressPercent}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

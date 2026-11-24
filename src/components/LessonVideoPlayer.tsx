import React from 'react';
import { Shield, Video } from 'lucide-react';
import { extractYouTubeId, extractVimeoId } from '../utils/courseEditor';

interface LessonVideoPlayerProps {
  videoUrl: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const LessonVideoPlayer: React.FC<LessonVideoPlayerProps> = ({
  videoUrl,
  title,
  subtitle,
  className = '',
}) => {
  const trimmedUrl = (videoUrl ?? '').trim();
  if (!trimmedUrl) return null;

  const ytid = extractYouTubeId(trimmedUrl);
  const vimeoId = extractVimeoId(trimmedUrl);
  const isDirectVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(trimmedUrl);

  const displayTitle = title || 'Video explicativo de la lección';

  return (
    <figure
      onContextMenu={(e) => e.preventDefault()}
      className={`rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden shadow-md my-4 transition-all select-none ${className}`}
    >
      <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-200 font-medium min-w-0">
          <div className="w-6 h-6 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center shrink-0 border border-red-500/30">
            <Video className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
              {displayTitle}
            </h4>
            {subtitle && (
              <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/50 text-[11px] font-medium text-slate-300 shrink-0 ml-2">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>Reproducción en Plataforma</span>
        </div>
      </div>

      <div className="relative aspect-video w-full bg-black overflow-hidden">
        {ytid ? (
          <>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytid}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&enablejsapi=1`}
              title={displayTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
              className="absolute inset-0 w-full h-full border-0"
            />
            {/* Bloqueador de clics en la barra superior (impide navegar a YouTube por el título o canal) */}
            <div
              className="absolute top-0 left-0 right-0 h-12 z-10 pointer-events-auto bg-transparent"
              aria-hidden="true"
              onClick={(e) => e.stopPropagation()}
            />
          </>
        ) : vimeoId ? (
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?dnt=1&title=0&byline=0&portrait=0`}
            title={displayTitle}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : isDirectVideo ? (
          <video
            src={trimmedUrl}
            controls
            playsInline
            controlsList="nodownload"
            className="w-full h-full"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-400">
            <p className="text-sm font-medium text-slate-200">
              Formato de video no compatible con el reproductor integrado
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-md truncate">
              {trimmedUrl}
            </p>
          </div>
        )}
      </div>
    </figure>
  );
};

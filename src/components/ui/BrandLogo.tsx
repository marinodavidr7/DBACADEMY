import React from 'react';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  surface?: 'auto' | 'light' | 'dark';
  wordmarkClassName?: string;
  className?: string;
}

const FULL_LIGHT_SRC = '/assets/aistudio/logo-db-academy-light.png';
const FULL_DARK_SRC = '/assets/aistudio/logo-db-academy-dark.png';
const MARK_LIGHT_SRC = '/assets/aistudio/logo-db-academy-mark-light.png';
const MARK_DARK_SRC = '/assets/aistudio/logo-db-academy-mark-dark.png';

const HEIGHT_CLASSES: Record<NonNullable<BrandLogoProps['size']>, string> = {
  xs: 'h-7 w-auto',
  sm: 'h-8 w-auto',
  md: 'h-9 w-auto',
  lg: 'h-24 w-auto',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showWordmark = true,
  surface = 'auto',
  wordmarkClassName = 'text-slate-900 dark:text-slate-50',
  className = '',
}) => {
  const useFullEmblem = !showWordmark && size === 'lg';
  const lightSrc = useFullEmblem ? FULL_LIGHT_SRC : MARK_LIGHT_SRC;
  const darkSrc = useFullEmblem ? FULL_DARK_SRC : MARK_DARK_SRC;
  const imgClass = `${HEIGHT_CLASSES[size]} object-contain select-none pointer-events-none shrink-0`;

  return (
    <span className={`inline-flex items-center gap-2.5 shrink-0 ${className}`.trim()}>
      {surface === 'light' && (
        <img
          src={lightSrc}
          alt="DB Academy"
          referrerPolicy="no-referrer"
          className={imgClass}
        />
      )}
      {surface === 'dark' && (
        <img
          src={darkSrc}
          alt="DB Academy"
          referrerPolicy="no-referrer"
          className={imgClass}
        />
      )}
      {surface === 'auto' && (
        <>
          <img
            src={lightSrc}
            alt="DB Academy"
            referrerPolicy="no-referrer"
            className={`${imgClass} dark:hidden`}
          />
          <img
            src={darkSrc}
            alt="DB Academy"
            referrerPolicy="no-referrer"
            className={`${imgClass} hidden dark:block`}
          />
        </>
      )}

      {showWordmark && (
        <span
          className={`font-display font-bold tracking-tight whitespace-nowrap ${
            size === 'xs' || size === 'sm' ? 'text-sm' : 'text-base'
          } ${wordmarkClassName}`.trim()}
        >
          DB Academy
        </span>
      )}
    </span>
  );
};

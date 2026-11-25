import React from 'react';
import { useSeasonalTheme } from '../../hooks/useSeasonalTheme';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  surface?: 'auto' | 'light' | 'dark';
  wordmarkClassName?: string;
  className?: string;
  christmasMode?: boolean;
}

/** Logo navideño oficial (el archivo ya incluye el gorro). */
const CHRISTMAS_SRC = '/logos/navidad/logo.png';

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
  christmasMode,
}) => {
  const seasonalTheme = useSeasonalTheme();
  const christmasActive = christmasMode ?? seasonalTheme.isChristmas;
  const useFullEmblem = !showWordmark && size === 'lg';
  const lightSrc = christmasActive ? CHRISTMAS_SRC : useFullEmblem ? FULL_LIGHT_SRC : MARK_LIGHT_SRC;
  const darkSrc = christmasActive ? CHRISTMAS_SRC : useFullEmblem ? FULL_DARK_SRC : MARK_DARK_SRC;
  const aspectClass = christmasActive
    ? 'aspect-square'
    : useFullEmblem
      ? 'aspect-[1349/940]'
      : 'aspect-[878/728]';
  const imgClass = `${HEIGHT_CLASSES[size]} ${aspectClass} object-contain select-none pointer-events-none shrink-0`;

  const imgWidth = christmasActive ? 1024 : useFullEmblem ? 1349 : 878;
  const imgHeight = christmasActive ? 1024 : useFullEmblem ? 940 : 728;

  return (
    <span className={`inline-flex items-center gap-2.5 shrink-0 ${className}`.trim()}>
      <span className="relative inline-flex items-center">
        {surface === 'light' && (
          <img
            src={lightSrc}
            alt="DB Academy"
            width={imgWidth}
            height={imgHeight}
            referrerPolicy="no-referrer"
            className={imgClass}
          />
        )}
        {surface === 'dark' && (
          <img
            src={darkSrc}
            alt="DB Academy"
            width={imgWidth}
            height={imgHeight}
            referrerPolicy="no-referrer"
            className={imgClass}
          />
        )}
        {surface === 'auto' && (
          <>
            <img
              src={lightSrc}
              alt="DB Academy"
              width={imgWidth}
              height={imgHeight}
              referrerPolicy="no-referrer"
              className={`${imgClass} dark:hidden`}
            />
            <img
              src={darkSrc}
              alt="DB Academy"
              width={imgWidth}
              height={imgHeight}
              referrerPolicy="no-referrer"
              className={`${imgClass} hidden dark:block`}
            />
          </>
        )}
      </span>

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

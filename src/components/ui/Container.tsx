import React from 'react';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Cuando true, limita el ancho del contenido a max-w-prose para párrafos largos */
  prose?: boolean;
  children: React.ReactNode;
}

/**
 * Contenedor único reutilizable para toda la landing.
 * - Borde a borde por defecto (w-full + padding responsivo).
 * - Tope generoso en 2xl: max-w-[1800px].
 * - Opción `prose` para limitar ancho de párrafos largos.
 */
export const Container: React.FC<ContainerProps> = ({
  children,
  className,
  prose = false,
}) => {
  return (
    <div
      className={`
        w-full
        px-4 sm:px-5 lg:px-8 2xl:px-10
        ${prose ? 'max-w-prose mx-auto' : 'max-w-[1680px] mx-auto'}
        ${className ?? ''}
      `}
    >
      {children}
    </div>
  );
};

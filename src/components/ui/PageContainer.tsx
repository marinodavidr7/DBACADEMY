import React from 'react';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  prose?: boolean;
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  prose = false,
  className = '',
  children,
  ...rest
}) => {
  return (
    <div
      className={`w-full px-4 sm:px-6 lg:px-8 2xl:px-12 ${prose ? 'max-w-prose mx-auto' : 'max-w-[2200px] mx-auto'} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
};

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
      className={`w-full px-3 sm:px-4 lg:px-5 2xl:px-6 ${prose ? 'max-w-prose mx-auto' : 'max-w-[2400px] mx-auto'} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
};

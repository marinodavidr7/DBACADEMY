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
      className={`w-full pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.25rem,env(safe-area-inset-left))] sm:pr-[max(1.25rem,env(safe-area-inset-right))] lg:px-6 ${prose ? 'max-w-prose mx-auto' : 'max-w-[2400px] mx-auto'} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
};

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface TextProps {
  children: ReactNode;
  tag?: keyof JSX.IntrinsicElements;
  className?: string;
  [key: string]: any;
}

interface HeadingProps extends TextProps {
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  variant?: 'default' | 'small';
}

interface ListProps extends TextProps {
  tag?: 'ul' | 'ol';
  variant?: 'unordered' | 'ordered';
}

export function Text({ children, tag = 'p', className, ...props }: TextProps) {
  const Component = tag;
  return (
    <Component className={cn('text-base leading-7', className)} {...props}>
      {children}
    </Component>
  );
}

export function Heading({
  children,
  tag = 'h2',
  variant = 'default',
  className,
  ...props
}: HeadingProps) {
  const Component = tag;
  return (
    <Component
      className={cn(
        'font-semibold tracking-tight',
        {
          'text-4xl lg:text-5xl': tag === 'h1',
          'text-3xl lg:text-4xl': tag === 'h2',
          'text-2xl lg:text-3xl': tag === 'h3',
          'text-xl lg:text-2xl': tag === 'h4' && variant === 'default',
          'text-lg lg:text-xl': tag === 'h4' && variant === 'small',
          'text-lg': tag === 'h5',
          'text-base': tag === 'h6',
        },
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function List({
  children,
  tag = 'ul',
  variant = 'unordered',
  className,
  ...props
}: ListProps) {
  const Component = tag;
  return (
    <Component
      className={cn(
        'pl-6 space-y-2',
        {
          'list-disc': variant === 'unordered',
          'list-decimal': variant === 'ordered',
        },
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

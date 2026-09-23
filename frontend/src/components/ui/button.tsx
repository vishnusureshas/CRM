import * as React from 'react';
import { cn } from '../../utils/cn.ts';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'glass';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none',
          variant === 'default' && 'bg-slate-900 text-white shadow-sm hover:bg-slate-900/90 hover:shadow-md hover:-translate-y-px',
          variant === 'outline' && 'border bg-white hover:bg-slate-50 hover:border-slate-300',
          variant === 'ghost' && 'hover:bg-slate-100',
          variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          variant === 'glass' && 'bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/15',
          size === 'default' && 'h-10 px-5 py-2',
          size === 'sm' && 'h-8 px-3 rounded-lg text-xs',
          size === 'lg' && 'h-11 px-8',
          size === 'icon' && 'h-9 w-9',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

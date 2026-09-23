import * as React from 'react';
import { cn } from '../../utils/cn.ts';
import { X } from 'lucide-react';
import { Button } from './button.tsx';

export const Dialog = ({ open, onOpenChange, children }: { open: boolean; onOpenChange: (o: boolean) => void; children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
};

export const DialogContent = ({ className, children, onClose }: { className?: string; children: React.ReactNode; onClose?: () => void }) => (
  <div className={cn('relative bg-white rounded-[20px] border shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden', className)}>
    {onClose && (
      <Button variant="ghost" size="icon" className="absolute right-3 top-3 h-8 w-8 rounded-full hover:bg-slate-100 z-10" onClick={onClose}>
        <X className="w-4 h-4" />
      </Button>
    )}
    {children}
  </div>
);

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6 pb-4', className)} {...props} />
);
export const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-lg font-bold tracking-tight', className)} {...props} />
);
export const DialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm text-muted-foreground mt-1.5', className)} {...props} />
);

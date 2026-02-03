import React from 'react';

// Simple utility for classes - assuming you might add clsx/tailwind-merge later to shared
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50 disabled:pointer-events-none active:scale-95';

        const variants = {
            primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-500/20 border border-transparent',
            secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm',
            ghost: 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100',
            danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20',
        };

        const sizes = {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-4 text-sm',
            lg: 'h-12 px-6 text-base',
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';

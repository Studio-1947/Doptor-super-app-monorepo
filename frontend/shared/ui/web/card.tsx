import React from 'react';

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

export const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => {
    return (
        <div className={cn('bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none p-6 shadow-sm', className)}>
            {children}
        </div>
    );
};

export const CardHeader = ({ title, description }: { title: string; description?: string }) => (
    <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
    </div>
);

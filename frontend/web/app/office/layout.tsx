'use client';

import { verticalTheme } from '@/contexts/VerticalContext';

export default function OfficeLayout({ children }: { children: React.ReactNode }) {
    const theme = verticalTheme.office;

    return (
        <div className={`min-h-full border-t-2 ${theme.borderClass}`}>
            {children}
        </div>
    );
}

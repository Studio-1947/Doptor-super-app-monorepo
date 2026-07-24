'use client';

import { verticalTheme } from '@/contexts/VerticalContext';

export default function CampusLayout({ children }: { children: React.ReactNode }) {
    const theme = verticalTheme.campus;

    return (
        <div className={`min-h-full border-t-2 ${theme.borderClass}`}>
            {children}
        </div>
    );
}

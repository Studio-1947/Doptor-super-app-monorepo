import { RoleProvider } from '@/features/auth/RoleContext';

import './globals.css';
import { Inter } from 'next/font/google';
import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.variable} font-sans bg-slate-50 text-slate-900 antialiased`}>
                <RoleProvider>
                    <AppShell>
                        {children}
                    </AppShell>
                </RoleProvider>
            </body>
        </html>
    );
}

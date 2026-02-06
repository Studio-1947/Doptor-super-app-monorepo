import { Providers } from './providers';
import { AppShell } from '@/components/layout/AppShell';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.variable} font-sans bg-slate-50 text-slate-900 antialiased`}>
                <Providers>
                    <AppShell>
                        {children}
                    </AppShell>
                </Providers>
            </body>
        </html>
    );
}

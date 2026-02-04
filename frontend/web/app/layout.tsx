import { RoleProvider } from '@/features/auth/RoleContext';
import './globals.css';
import { Inter } from 'next/font/google';
import { AppShell } from '@/components/layout/AppShell';
import { AuthProvider } from '../contexts/AuthContext';
import { VerticalProvider } from '@/contexts/VerticalContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.variable} font-sans bg-slate-50 text-slate-900 antialiased`}>
                <AuthProvider>
                    <VerticalProvider>
                        <RoleProvider>
                            <AppShell>
                                {children}
                            </AppShell>
                        </RoleProvider>
                    </VerticalProvider>
                </AuthProvider>
            </body>
        </html>
    );
}

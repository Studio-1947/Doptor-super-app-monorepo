import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

/**
 * The app shipped with no metadata at all until 2026-08-03 — no title, so every
 * browser tab and bookmark showed the bare URL, and no icon.
 *
 * `app/icon.png` and `app/apple-icon.png` are picked up by the App Router
 * convention and need no entry here; `app/manifest.ts` likewise emits its own
 * `<link rel="manifest">`.
 */
export const metadata: Metadata = {
    title: {
        default: 'Doptor',
        template: '%s · Doptor',
    },
    description:
        'Office operations — e-Dak file movement, tasks, attendance and approvals.',
    applicationName: 'Doptor',
    appleWebApp: {
        // iOS has no manifest support worth relying on; these are what make an
        // added-to-home-screen launch open standalone rather than in Safari.
        capable: true,
        title: 'Doptor',
        statusBarStyle: 'default',
    },
    formatDetection: { telephone: false },
};

export const viewport: Viewport = {
    // Must match `theme_color` in app/manifest.ts. The manifest value paints the
    // splash screen before any HTML exists and this one colours the browser
    // chrome afterwards, so a mismatch shows up as a colour change on launch.
    themeColor: '#7c3aed',
    width: 'device-width',
    initialScale: 1,
    // Not locked: pinch-zoom is an accessibility affordance, and disabling it to
    // make an installed app "feel native" takes that away from the people who
    // need it most.
    maximumScale: 5,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var theme = localStorage.getItem('theme');
                                    var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                                    if (!theme && supportDarkMode) theme = 'dark';
                                    if (theme === 'dark') {
                                        document.documentElement.classList.add('dark');
                                    } else {
                                        document.documentElement.classList.remove('dark');
                                    }
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
            </head>
            <body className={`${inter.variable} font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased`}>
                <ServiceWorkerRegistration />
                <Providers>
                    <AuthGuard>
                        <AppShell>
                            {children}
                        </AppShell>
                    </AuthGuard>
                </Providers>
            </body>
        </html>
    );
}

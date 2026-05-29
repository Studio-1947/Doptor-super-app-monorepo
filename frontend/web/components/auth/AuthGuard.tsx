'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const PUBLIC_ROUTES = ['/login', '/register', '/onboarding', '/forgot-password', '/reset-password', '/verify-email'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, pathname, router]);

    // If loading or not authenticated (and on a private route), show loader
    if (isLoading || (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname))) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary-100 dark:border-primary-900/30 rounded-none animate-spin border-t-primary-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 font-black text-xl">D</span>
                    </div>
                </div>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">
                    Authenticating...
                </p>
            </div>
        );
    }

    return <>{children}</>;
}

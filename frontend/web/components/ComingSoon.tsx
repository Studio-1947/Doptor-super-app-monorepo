"use client";

import { Construction, ArrowLeft } from 'lucide-react';
import { Button, Card } from '@doptor/shared';
import { useRouter } from 'next/navigation';

interface ComingSoonProps {
    title?: string;
    description?: string;
    moduleName?: string;
}

export function ComingSoon({
    title = "Under Construction",
    description = "We are currently working on this feature. Please check back later.",
    moduleName
}: ComingSoonProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
                <Construction size={40} />
            </div>

            {moduleName && (
                <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full mb-4 border border-primary-100">
                    {moduleName} Module
                </span>
            )}

            <h1 className="text-3xl font-bold text-slate-900 mb-3">{title}</h1>
            <p className="text-slate-500 max-w-md mb-8 text-lg">{description}</p>

            <div className="flex gap-4">
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="gap-2"
                >
                    <ArrowLeft size={18} />
                    Go Back
                </Button>
                <Button
                    variant="primary"
                    onClick={() => router.push('/')}
                >
                    Go to Dashboard
                </Button>
            </div>
        </div>
    );
}

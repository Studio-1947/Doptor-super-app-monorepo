"use client";

import { Construction, ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ComingSoonProps {
    title?: string;
    description?: string;
    moduleName?: string;
}

export function ComingSoon({
    title = "Under Construction",
    description = "We are currently working on this feature. It will be available in the next update.",
    moduleName
}: ComingSoonProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 max-w-2xl mx-auto text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="relative mb-8 group">
                <div className="absolute inset-0 bg-primary-200 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative w-24 h-24 bg-gradient-to-tr from-slate-50 to-white rounded-3xl flex items-center justify-center shadow-lg border border-slate-100 ring-4 ring-slate-50/50">
                    <Construction className="text-primary-600 w-10 h-10" strokeWidth={1.5} />
                </div>
                {moduleName && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg border border-slate-700">
                        {moduleName}
                    </div>
                )}
            </div>

            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-600 mb-4 tracking-tight">
                {title}
            </h1>

            <p className="text-slate-500 text-lg mb-10 max-w-md leading-relaxed">
                {description}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="group flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 font-medium"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span>Go Back</span>
                </button>

                <button
                    onClick={() => router.push('/')}
                    className="group flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95 font-medium"
                >
                    <Home size={18} />
                    <span>Dashboard</span>
                </button>
            </div>
        </div>
    );
}

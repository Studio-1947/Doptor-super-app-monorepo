'use client';

import React from 'react';

export default function Loading() {
    return (
        <div className="flex-1 h-full min-h-[400px] flex flex-col items-center justify-center bg-transparent">
            <div className="relative">
                {/* Sharp Loading Square */}
                <div className="w-12 h-12 border-2 border-primary-500/20 dark:border-primary-400/20 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-primary-500/10 animate-pulse"></div>
                    <div className="w-full h-[2px] bg-primary-500 absolute top-0 animate-[loading-bar_2s_infinite]"></div>
                    <span className="text-primary-600 dark:text-primary-400 font-black text-lg relative z-10">D</span>
                </div>
                
                {/* Floating Particles - Sharp Squares */}
                <div className="absolute -top-2 -right-2 w-2 h-2 bg-primary-400 animate-bounce delay-75"></div>
                <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-indigo-400 animate-bounce delay-300"></div>
            </div>
            
            <div className="mt-6 flex flex-col items-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 animate-pulse">
                    Loading Interface
                </p>
                <div className="mt-2 w-32 h-[1px] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="w-full h-full bg-primary-500 origin-left animate-[loading-progress_1.5s_infinite_ease-in-out]"></div>
                </div>
            </div>

            <style jsx>{`
                @keyframes loading-bar {
                    0% { transform: translateY(-100%); }
                    50% { transform: translateY(1200%); }
                    100% { transform: translateY(-100%); }
                }
                @keyframes loading-progress {
                    0% { transform: scaleX(0); transform-origin: left; }
                    40% { transform: scaleX(1); transform-origin: left; }
                    60% { transform: scaleX(1); transform-origin: right; }
                    100% { transform: scaleX(0); transform-origin: right; }
                }
            `}</style>
        </div>
    );
}

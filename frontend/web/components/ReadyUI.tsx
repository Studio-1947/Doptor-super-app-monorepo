"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
    Search, 
    Filter, 
    Plus, 
    MoreVertical, 
    Download, 
    ArrowUpRight, 
    ArrowDownRight,
    LucideIcon,
    ChevronRight,
    Zap,
    ShieldCheck,
    FileText,
    CheckCircle2,
    X,
    Info,
    Loader2
} from 'lucide-react';

// Local SharpButton to avoid monorepo build issues with shared components
const SharpButton = ({ 
    children, 
    variant = 'primary', 
    onClick, 
    className = '', 
    disabled = false,
    type = 'button'
}: { 
    children: React.ReactNode; 
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; 
    onClick?: (e: React.MouseEvent) => void; 
    className?: string;
    disabled?: boolean;
    type?: 'button' | 'submit';
}) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-none font-bold transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-95 cursor-pointer';
    
    const variants = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-500/20 border border-transparent',
        secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm',
        ghost: 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100',
        danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20',
    };

    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};

interface Stat {
    label: string;
    value: string;
    change?: string;
    trend?: 'up' | 'down';
    icon: LucideIcon;
    color: string;
}

interface ReadyUIProps {
    title: string;
    description: string;
    moduleName?: string;
    stats?: Stat[];
    children?: React.ReactNode;
    primaryAction?: {
        label: string;
        icon?: LucideIcon;
        onClick?: () => void;
    };
    onExport?: () => void;
}

export function ReadyUI({
    title,
    description,
    moduleName,
    stats = [],
    children,
    primaryAction,
    onExport
}: ReadyUIProps) {
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

    const showNotification = useCallback((message: string, type: 'success' | 'info' = 'info') => {
        setNotification({ message, type });
        console.log(`[ReadyUI Notification]: ${message} (${type})`);
    }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleActionWithFeedback = async (actionName: string, actionFn?: () => void, successMsg?: string) => {
        if (typeof window === 'undefined') return;
        
        setIsActionLoading(actionName);
        console.log(`[ReadyUI Action]: ${actionName} triggered`);
        
        // Simulate a small delay for feedback
        await new Promise(resolve => setTimeout(resolve, 600));
        
        if (actionFn) {
            actionFn();
        } else {
            showNotification(successMsg || `${actionName} feature is coming soon!`, 'info');
        }
        
        setIsActionLoading(null);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        handleActionWithFeedback("Search", undefined, "Search engine is initializing...");
    };

    return (
        <div className="flex flex-col h-full bg-white relative select-none">
            {/* High-Visibility Notification Toast */}
            {notification && (
                <div className="fixed top-8 right-8 z-[9999] animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className={`flex items-center gap-4 px-6 py-4 border-2 shadow-[0_20px_50px_rgba(0,0,0,0.2)] ${
                        notification.type === 'success' 
                            ? 'bg-emerald-500 border-emerald-400 text-white' 
                            : 'bg-slate-900 border-slate-700 text-white'
                    }`}>
                        <div className="p-1 bg-white/20 rounded">
                            {notification.type === 'success' ? <CheckCircle2 size={18} /> : <Info size={18} />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">System Message</span>
                            <span className="text-xs font-bold uppercase tracking-wider">{notification.message}</span>
                        </div>
                        <button 
                            onClick={() => setNotification(null)} 
                            className="ml-4 p-1 hover:bg-white/10 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Doptor Sharp Header */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            {moduleName && (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-600 bg-primary-50 px-2 py-0.5 border border-primary-100">
                                    {moduleName}
                                </span>
                            )}
                            <div className="h-px w-8 bg-slate-200" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Workspace</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
                        <p className="text-sm text-slate-500 font-medium">{description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <SharpButton 
                            variant="secondary" 
                            onClick={() => handleActionWithFeedback("Export", onExport, `${title} ledger export initiated...`)}
                            disabled={isActionLoading === "Export"}
                            className="text-[10px] h-10 px-5 uppercase tracking-widest"
                        >
                            {isActionLoading === "Export" ? <Loader2 size={14} className="animate-spin mr-2" /> : <Download size={14} className="mr-2" />}
                            Export
                        </SharpButton>
                        {primaryAction && (
                            <SharpButton 
                                variant="primary" 
                                onClick={() => handleActionWithFeedback(primaryAction.label, primaryAction.onClick)}
                                disabled={isActionLoading === primaryAction.label}
                                className="text-[10px] h-10 px-6 uppercase tracking-widest shadow-lg shadow-primary-500/20"
                            >
                                {isActionLoading === primaryAction.label ? (
                                    <Loader2 size={16} className="animate-spin mr-2" />
                                ) : (
                                    primaryAction.icon && <primaryAction.icon size={16} className="mr-2" />
                                )}
                                {primaryAction.label}
                            </SharpButton>
                        )}
                    </div>
                </div>

                {/* Doptor Sharp Stats */}
                {stats.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-slate-100">
                        {stats.map((stat, index) => (
                            <div 
                                key={index} 
                                onClick={() => showNotification(`${stat.label} synchronization in progress...`, 'info')}
                                className={`p-8 bg-white hover:bg-slate-50 transition-all border-slate-100 cursor-pointer group relative overflow-hidden ${
                                    index !== stats.length - 1 ? 'lg:border-r' : ''
                                } ${index >= 2 ? 'md:border-t lg:border-t-0' : ''}`}
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-primary-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`p-3 ${stat.color} bg-opacity-[0.08] border border-current border-opacity-20 group-hover:bg-opacity-20 transition-all duration-300`}>
                                        <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} strokeWidth={2.5} />
                                    </div>
                                    {stat.change && (
                                        <div className={`flex items-center gap-1 text-[11px] font-black ${
                                            stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
                                        }`}>
                                            {stat.trend === 'up' ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
                                            {stat.change}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                                    <h3 className="text-3xl font-bold text-slate-900 tracking-tighter">{stat.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Content Controls */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder={`Query database for ${title.toLowerCase()}...`}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all placeholder:text-slate-400 uppercase tracking-wider"
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <SharpButton 
                        type="button"
                        onClick={() => handleActionWithFeedback("Filter", undefined, "Filtering engine initializing...")}
                        variant="secondary" 
                        className="flex-1 sm:flex-none h-11 px-6 text-[10px] tracking-widest uppercase"
                    >
                        <Filter size={16} className="mr-2" />
                        Filter
                    </SharpButton>
                    <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />
                    <button 
                        type="button"
                        onClick={() => showNotification("Additional options restricted in preview.", 'info')}
                        className="p-3 border border-slate-200 text-slate-400 hover:text-slate-900 transition-all active:scale-90"
                    >
                        <MoreVertical size={20} />
                    </button>
                </div>
            </form>

            {/* Sharp Content Area */}
            <div className="flex-1 bg-white border border-slate-200 relative group">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                    style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '32px 32px' }} 
                />
                
                <div className="relative h-full min-h-[500px] flex flex-col items-center justify-center p-16 text-center">
                    {children || (
                        <>
                            <div className="mb-8 relative group/icon">
                                <div className="w-20 h-20 bg-slate-900 flex items-center justify-center relative z-10 shadow-2xl group-hover/icon:rotate-12 transition-transform duration-500">
                                    <Zap className="text-primary-400 w-10 h-10" fill="currentColor" />
                                </div>
                                <div className="absolute -inset-2 border-2 border-primary-500 opacity-10 group-hover/icon:opacity-30 transition-opacity" />
                            </div>
                            
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 uppercase tracking-tighter">Ready for Production Data</h3>
                            <p className="text-slate-500 max-w-md mx-auto mb-10 text-sm font-medium leading-relaxed uppercase tracking-wide opacity-80">
                                The {title.toLowerCase()} module is fully initialized within the Doptor OS ecosystem. Connect a live data source to populate this ledger.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                {primaryAction && (
                                    <SharpButton 
                                        variant="primary" 
                                        onClick={() => handleActionWithFeedback(primaryAction.label, primaryAction.onClick)}
                                        className="px-10 py-4 text-[10px] tracking-[0.2em] shadow-xl shadow-primary-500/20 uppercase"
                                    >
                                        {primaryAction.label}
                                    </SharpButton>
                                )}
                                <button 
                                    onClick={() => showNotification("Redirecting to API documentation...", 'info')}
                                    className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] transition-all flex items-center gap-3 group"
                                >
                                    Documentation <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform" />
                                </button>
                            </div>
                            
                            {/* Abstract Grid Placeholders */}
                            <div className="mt-20 w-full max-w-5xl opacity-[0.04] pointer-events-none select-none px-4">
                                <div className="space-y-px bg-slate-200 border border-slate-200">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="h-12 bg-white w-full" />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            {/* Sharp Footer Info */}
            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6 pb-2">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Link Active</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <ShieldCheck size={14} className="text-primary-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Session</span>
                    </div>
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
                    Doptor OS // Kernel v4.2.0-STABLE
                </div>
            </div>
        </div>
    );
}

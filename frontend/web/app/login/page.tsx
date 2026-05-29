'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const { login, isLoading } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await login({ email, password });
            router.push('/');
        } catch (err) {
            setError('Invalid email or password');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-500">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-800"
            >
                {/* Visual Side - SHARP */}
                <div className="hidden md:flex flex-col justify-between p-12 bg-slate-900 dark:bg-black text-white w-2/5 relative overflow-hidden border-r border-slate-800 dark:border-primary-900/30">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-primary-600 rounded-none flex items-center justify-center mb-12 shadow-lg border border-primary-500">
                            <span className="font-black text-2xl">D</span>
                        </div>
                        <h2 className="text-4xl font-black mb-6 leading-tight uppercase tracking-tighter">
                            Doptor <br/>
                            <span className="text-primary-500">OS v2.0</span>
                        </h2>
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-[0.2em] leading-loose max-w-[200px]">
                            Secure digital infrastructure for the modern enterprise.
                        </p>
                    </div>

                    {/* Decorative Geometric Patterns */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 -mr-32 -mt-32 rotate-45 border border-primary-600/20"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-600/5 -ml-16 -mb-16 rotate-12 border border-primary-600/10"></div>

                    <div className="relative z-10 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 p-4 border border-white/10 backdrop-blur-md">
                        <ShieldCheck size={16} className="text-primary-500" />
                        <span>Encrypted Session</span>
                    </div>
                </div>

                {/* Form Side */}
                <div className="flex-1 p-8 md:p-16 flex flex-col justify-center bg-white dark:bg-slate-900">
                    <div className="max-w-md mx-auto w-full">
                        <div className="text-center md:text-left mb-12">
                            <div className="inline-block px-3 py-1 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 text-primary-700 dark:text-primary-400 text-[10px] font-black uppercase tracking-widest mb-4">
                                AUTHENTICATION REQUIRED
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight">System Login</h1>
                            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Enter your credentials to access the workspace.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-3 border border-red-100 dark:border-red-900/30 rounded-none uppercase tracking-wider"
                                >
                                    <AlertCircle size={18} />
                                    {error}
                                </motion.div>
                            )}

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-[0.15em]">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-4 rounded-none border border-slate-200 dark:border-slate-800 focus:border-primary-500 dark:focus:border-primary-500 outline-none transition-all bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-bold placeholder:text-slate-400 dark:placeholder:text-slate-700"
                                        placeholder="user@demo.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Security Key</label>
                                        <Link href="/forgot-password" className="text-[10px] font-black text-primary-600 dark:text-primary-400 hover:underline uppercase tracking-widest">
                                            Reset Access
                                        </Link>
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-4 rounded-none border border-slate-200 dark:border-slate-800 focus:border-primary-500 dark:focus:border-primary-500 outline-none transition-all bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-bold placeholder:text-slate-400 dark:placeholder:text-slate-700"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-primary-500/10 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center border border-primary-500"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    'Initialize Access'
                                )}
                            </button>
                        </form>

                        <p className="mt-12 text-center text-slate-500 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            New to the system?{' '}
                            <Link href="/onboarding" className="text-primary-600 dark:text-primary-400 hover:underline">
                                Request Provisioning
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

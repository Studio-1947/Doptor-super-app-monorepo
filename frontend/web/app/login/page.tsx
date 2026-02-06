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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row"
            >
                {/* Visual Side */}
                <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-600 to-indigo-700 text-white w-2/5 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-lg rounded-xl flex items-center justify-center mb-8 shadow-inner border border-white/20">
                            <span className="font-bold text-xl">D</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Welcome Back</h2>
                        <p className="text-blue-100/90 leading-relaxed">
                            Sign in to access your digital workspace, manage tasks, and collaborate with your team.
                        </p>
                    </div>

                    {/* Decorative Circles */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/30 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/30 blur-3xl"></div>

                    <div className="relative z-10 flex items-center gap-3 text-sm font-medium bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                        <ShieldCheck size={20} className="text-blue-200" />
                        <span>Secure Enterprise Login</span>
                    </div>
                </div>

                {/* Form Side */}
                <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
                    <div className="max-w-md mx-auto w-full">
                        <div className="text-center md:text-left mb-10">
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">Sign in to Doptor</h1>
                            <p className="text-slate-500">Please enter your credentials to continue.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="p-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-3 border border-red-100"
                                >
                                    <AlertCircle size={18} />
                                    {error}
                                </motion.div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-slate-50/50 focus:bg-white"
                                        placeholder="name@company.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-end mb-1.5">
                                        <label className="block text-sm font-medium text-slate-700">Password</label>
                                        <Link href="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-slate-50/50 focus:bg-white"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <p className="mt-8 text-center text-slate-500 text-sm">
                            Don&apos;t have an account?{' '}
                            <Link href="/onboarding" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline">
                                Get Started
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

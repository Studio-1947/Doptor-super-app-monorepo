'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle2, Building2, GraduationCap, Globe2, ArrowLeft } from 'lucide-react';
import { RegisterData, RegisterOrganisationData } from '@/services/auth.service';

type RegisterMode = 'join' | 'create';

import { Suspense } from 'react';

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = (searchParams.get('mode') as RegisterMode) || 'join';

    const { register, registerOrganisation } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Common Fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Join Mode Fields
    const [organisationId, setOrganisationId] = useState('');

    // Create Org Mode Fields
    const [orgName, setOrgName] = useState('');
    const [orgSlug, setOrgSlug] = useState('');
    const [enabledVerticals, setEnabledVerticals] = useState<string[]>(['core']);

    const verticals = [
        { id: 'office', label: 'Office', description: 'File management, e-Dak, Registry', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
        { id: 'campus', label: 'Campus', description: 'Student & Faculty management, Academics', icon: GraduationCap, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        { id: 'network', label: 'Network', description: 'Volunteer management, Campaigns', icon: Globe2, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
    ];

    const toggleVertical = (id: string) => {
        setEnabledVerticals(prev =>
            prev.includes(id)
                ? prev.filter(v => v !== id)
                : [...prev, id]
        );
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            if (mode === 'join') {
                if (!organisationId) {
                    setError('Organisation ID is required');
                    setIsLoading(false);
                    return;
                }
                await register({
                    email,
                    password,
                    organisation_id: organisationId
                });
            } else {
                if (!orgName || !orgSlug) {
                    setError('Organisation details are required');
                    setIsLoading(false);
                    return;
                }
                // Generate slug if empty? For now assume user typed it or we auto-gen it elsewhere.
                // Simple slugify for safety if user typed spaces
                const safeSlug = orgSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

                await registerOrganisation({
                    email,
                    password,
                    organisation_name: orgName,
                    slug: safeSlug,
                    enabled_verticals: enabledVerticals
                });
            }
            router.push('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
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
                <div className={`
                    hidden md:flex flex-col justify-between p-12 text-white w-2/5
                    ${mode === 'create' ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-indigo-600 to-violet-700'}
                `}>
                    <div>
                        <Link href="/onboarding" className="inline-flex items-center text-white/80 hover:text-white transition-colors text-sm mb-8">
                            <ArrowLeft size={16} className="mr-2" /> Back
                        </Link>
                        <h2 className="text-3xl font-bold mb-4">
                            {mode === 'create' ? 'Build Your Digital Ecosystem' : 'Join Your Team'}
                        </h2>
                        <p className="text-blue-100/90 leading-relaxed">
                            {mode === 'create'
                                ? 'Set up a workspace tailored to your needs. Enable powerful verticals like Office, Campus, or Network to streamline your operations.'
                                : 'Collaborate with your team, manage workflows, and stay connected in one unified platform.'
                            }
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm font-medium bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                            <CheckCircle2 size={18} className="text-emerald-300" />
                            <span>Enterprise-grade Security</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                            <CheckCircle2 size={18} className="text-emerald-300" />
                            <span>Integrated Workflows</span>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="flex-1 p-8 md:p-12">
                    <div className="max-w-md mx-auto">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            {mode === 'create' ? 'Create Account & Organisation' : 'Create your Account'}
                        </h1>
                        <p className="text-slate-500 mb-8">
                            {mode === 'create' ? 'Get started with a new workspace.' : 'Enter your details to join.'}
                        </p>

                        <form onSubmit={handleRegister} className="space-y-5">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2"
                                >
                                    <AlertCircle size={16} />
                                    {error}
                                </motion.div>
                            )}

                            {/* Organisation Details (Only for Create Mode) */}
                            {mode === 'create' && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Organisation Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="Organisation Name"
                                                value={orgName}
                                                onChange={(e) => setOrgName(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="Workspace Slug"
                                                value={orgSlug}
                                                onChange={(e) => setOrgSlug(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                                                required
                                            />
                                            <p className="mt-1 text-xs text-slate-400">doptor.com/{orgSlug || 'slug'}</p>
                                        </div>
                                    </div>

                                    {/* Vertical Selection */}
                                    <div className="py-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-3">Enable Verticals</label>
                                        <div className="grid gap-3">
                                            {verticals.map((v) => {
                                                const isSelected = enabledVerticals.includes(v.id);
                                                return (
                                                    <div
                                                        key={v.id}
                                                        onClick={() => toggleVertical(v.id)}
                                                        className={`
                                                            cursor-pointer relative flex items-start p-3 rounded-xl border-2 transition-all duration-200
                                                            ${isSelected ? v.border + ' ' + v.bg : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'}
                                                        `}
                                                    >
                                                        <div className={`mr-4 mt-0.5 p-2 rounded-lg ${isSelected ? 'bg-white shadow-sm' : 'bg-slate-200'}`}>
                                                            <v.icon size={20} className={isSelected ? v.color : 'text-slate-400'} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className={`text-sm font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>{v.label}</h4>
                                                                {isSelected && <CheckCircle2 size={16} className={v.color} />}
                                                            </div>
                                                            <p className="text-xs text-slate-500 mt-0.5">{v.description}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="h-px bg-slate-100 my-4" />
                                </div>
                            )}

                            {/* Join Mode Fields */}
                            {mode === 'join' && (
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Organisation ID / Invite Code"
                                        value={organisationId}
                                        onChange={(e) => setOrganisationId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                        required
                                    />
                                </div>
                            )}

                            {/* User Account Fields (Common) */}
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Account Details</h3>
                            <div>
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-${mode === 'create' ? 'emerald' : 'indigo'}-500 focus:ring-2 focus:ring-${mode === 'create' ? 'emerald' : 'indigo'}-200 outline-none transition-all`}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-${mode === 'create' ? 'emerald' : 'indigo'}-500 focus:ring-2 focus:ring-${mode === 'create' ? 'emerald' : 'indigo'}-200 outline-none transition-all`}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-${mode === 'create' ? 'emerald' : 'indigo'}-500 focus:ring-2 focus:ring-${mode === 'create' ? 'emerald' : 'indigo'}-200 outline-none transition-all`}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`
                                    w-full py-3.5 rounded-lg text-white font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all
                                    disabled:opacity-70 disabled:cursor-not-allowed
                                    ${mode === 'create'
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-200'
                                        : 'bg-gradient-to-r from-indigo-500 to-violet-600 shadow-indigo-200'
                                    }
                                `}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Creating Account...</span>
                                    </div>
                                ) : (
                                    <span>{mode === 'create' ? 'Create Organisation' : 'Join Team'}</span>
                                )}
                            </button>

                            <p className="text-center text-slate-500">
                                Already have an account?{' '}
                                <Link href="/login" className={`font-medium hover:underline ${mode === 'create' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}

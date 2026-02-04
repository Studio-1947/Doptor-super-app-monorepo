'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Building2, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function OnboardingChoice() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 text-center">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Welcome to Doptor
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    How would you like to get started?
                </p>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 sm:px-0">

                    {/* Join Existing Team Option */}
                    <Link href="/register?mode=join" className="group relative block p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-300">
                        <div className="absolute top-6 right-6 text-slate-300 group-hover:text-indigo-500 transition-colors">
                            <Users size={28} />
                        </div>
                        <div className="mt-4">
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Join a Team</h3>
                            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                                I have an invite code or email from my administrator. I want to join an existing workspace.
                            </p>
                        </div>
                        <div className="mt-8 flex items-center text-sm font-medium text-indigo-600 group-hover:translate-x-1 transition-transform">
                            Continue <ArrowRight size={16} className="ml-2" />
                        </div>
                    </Link>

                    {/* Create New Organisation Option */}
                    <Link href="/register?mode=create" className="group relative block p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-50/50 transition-all duration-300">
                        <div className="absolute top-6 right-6 text-slate-300 group-hover:text-emerald-500 transition-colors">
                            <Building2 size={28} />
                        </div>
                        <div className="mt-4">
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Create Organisation</h3>
                            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                                I want to set up a new workspace for my company, school, or network.
                            </p>
                        </div>
                        <div className="mt-8 flex items-center text-sm font-medium text-emerald-600 group-hover:translate-x-1 transition-transform">
                            Get Started <ArrowRight size={16} className="ml-2" />
                        </div>
                    </Link>

                </div>

                <div className="mt-10 text-center">
                    <span className="text-slate-500 text-sm">Already have an account? </span>
                    <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}

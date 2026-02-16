'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth.service';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

function VerifyEmailForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [verifying, setVerifying] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (token) {
            verifyEmail();
        } else {
            setVerifying(false);
            setError('Invalid or missing verification token');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const verifyEmail = async () => {
        if (!token) return;

        try {
            await authService.verifyEmail(token);
            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Verification failed. The link may have expired.');
        } finally {
            setVerifying(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8"
                >
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Loader2 className="text-blue-600 animate-spin" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying Your Email</h2>
                        <p className="text-slate-600">
                            Please wait while we verify your email address...
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8"
                >
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-green-600" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Email Verified!</h2>
                        <p className="text-slate-600 mb-6">
                            Your email has been successfully verified. You can now access all features of your account.
                        </p>
                        <p className="text-sm text-slate-500 mb-6">
                            Redirecting to login page...
                        </p>
                        <Link
                            href="/login"
                            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5"
                        >
                            Go to Login
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
                {/* Header */}
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="text-red-600" size={24} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h1>
                        <p className="text-slate-600 mb-6">
                            {error}
                        </p>

                        <div className="space-y-3">
                            <p className="text-sm text-slate-500">
                                The verification link may have expired or is invalid.
                            </p>
                            <Link
                                href="/login"
                                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5"
                            >
                                Go to Login
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100">
                    <p className="text-center text-sm text-slate-600">
                        Need help?{' '}
                        <Link href="/support" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline">
                            Contact Support
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <VerifyEmailForm />
        </Suspense>
    );
}

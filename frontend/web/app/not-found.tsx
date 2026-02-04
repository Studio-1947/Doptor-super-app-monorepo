'use client';

import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Page Not Found</h2>
            <p className="text-slate-500 mb-6">Could not find requested resource</p>
            <Link
                href="/"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
                Return Home
            </Link>
        </div>
    );
}

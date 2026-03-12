import { Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
                <span className="text-4xl font-bold text-slate-300">404</span>
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-3">Page Not Found</h2>
            <p className="text-slate-500 mb-8 max-w-md text-lg">
                The page you are looking for doesn&apos;t exist or has been moved.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm shadow-indigo-100"
                >
                    <Home size={18} />
                    Return Home
                </Link>
            </div>
        </div>
    );
}

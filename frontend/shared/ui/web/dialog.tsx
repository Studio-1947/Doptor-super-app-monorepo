import React, { Fragment, useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export function Dialog({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: DialogProps) {
    const [show, setShow] = useState(isOpen);

    useEffect(() => {
        setShow(isOpen);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Content */}
            <div className={`relative bg-white w-full ${maxWidth} rounded-xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200`}>
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
            {children}
        </div>
    );
}

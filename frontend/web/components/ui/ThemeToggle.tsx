'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-none hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 overflow-hidden group"
            aria-label="Toggle Theme"
        >
            <div className="relative w-5 h-5">
                <AnimatePresence mode="wait" initial={false}>
                    {theme === 'light' ? (
                        <motion.div
                            key="sun"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <Sun size={20} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="moon"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <Moon size={20} className="text-primary-400" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Hover Indicator Line - Sharp Style */}
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary-500 transition-all duration-300 group-hover:w-full" />
        </button>
    );
}

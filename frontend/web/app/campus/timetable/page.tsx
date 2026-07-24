'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { campusService, CampusClass } from '@/services/campus.service';
import TimeTable from '@/features/campus/TimeTable';
import { Loader2 } from 'lucide-react';

export default function CampusTimetablePage() {
    const router = useRouter();
    const [classes, setClasses] = useState<CampusClass[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        campusService
            .getClasses()
            .then(setClasses)
            .catch(() => setClasses([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Timetable</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Weekly schedule across all classes.</p>
            </div>
            <TimeTable
                classes={classes}
                onClassClick={(cls) => router.push(`/campus/academics/classes?highlight=${cls.id}`)}
            />
        </div>
    );
}

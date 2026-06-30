"use client";

import { useCallback, useEffect, useState } from 'react';
import { Card, Button } from '@doptor/shared';
import { Plus, Calendar, MoreVertical, Loader2 } from 'lucide-react';
import { academicYearService, AcademicYear } from '../../../services/academic-year.service';
import { useAuth } from '../../../contexts/AuthContext';
import { CreateAcademicYearDialog } from './dialogs/CreateAcademicYearDialog';

export function AcademicYearList() {
    const { user } = useAuth();
    const [years, setYears] = useState<AcademicYear[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const loadYears = useCallback(async () => {
        if (!user?.organisation_id) return;
        try {
            setIsLoading(true);
            const data = await academicYearService.list(user.organisation_id);
            setYears(data);
        } catch (error) {
            console.error('Failed to load academic years', error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.organisation_id]);

    useEffect(() => {
        loadYears();
    }, [loadYears]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Academic Years</h2>
                    <p className="text-slate-500">Manage your institution's sessions and terms.</p>
                </div>
                <Button
                    className="bg-primary-600 hover:bg-primary-700 text-white gap-2"
                    onClick={() => setIsCreateOpen(true)}
                >
                    <Plus size={18} /> New Session
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-primary-600" size={28} />
                </div>
            ) : years.length === 0 ? (
                <Card className="p-8 text-center text-slate-400">No academic years yet</Card>
            ) : (
                <div className="grid gap-4">
                    {years.map((year) => (
                        <Card key={year.id} className="p-4 flex items-center justify-between group hover:border-primary-200 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${year.is_current ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg text-slate-900">{year.name}</h3>
                                        {year.is_current && (
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        {year.start_date} - {year.end_date}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="text-slate-500">Edit</Button>
                                <Button variant="ghost" size="sm" className="text-slate-400">
                                    <MoreVertical size={18} />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <CreateAcademicYearDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={loadYears}
            />
        </div>
    );
}

"use client";

import { useState } from 'react';
import { Card, Button } from '@doptor/shared';
import { Plus, Calendar, Check, MoreVertical } from 'lucide-react';
import { MOCK_ACADEMIC_YEARS, AcademicYear } from '../campus-mock.db';
import { CreateAcademicYearDialog } from './dialogs/CreateAcademicYearDialog';

export function AcademicYearList() {
    const [years, setYears] = useState<AcademicYear[]>(MOCK_ACADEMIC_YEARS);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

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

            <div className="grid gap-4">
                {years.map((year) => (
                    <Card key={year.id} className="p-4 flex items-center justify-between group hover:border-primary-200 transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${year.isCurrent ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                <Calendar size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg text-slate-900">{year.name}</h3>
                                    {year.isCurrent && (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                            Current
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500">
                                    {year.startDate} - {year.endDate}
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

            <CreateAcademicYearDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
            />
        </div>
    );
}

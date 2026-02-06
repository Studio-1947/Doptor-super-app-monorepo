"use client";

import { useState } from 'react';
import { Card, Button } from '@doptor/shared';
import { Plus, BookOpen, MoreVertical, Users } from 'lucide-react';
import { MOCK_DEPARTMENTS, Department } from '../campus-mock.db';
import { CreateDepartmentDialog } from './dialogs/CreateDepartmentDialog';

export function DepartmentList() {
    const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Departments</h2>
                    <p className="text-slate-500">Manage faculties and subject departments.</p>
                </div>
                <Button
                    className="bg-primary-600 hover:bg-primary-700 text-white gap-2"
                    onClick={() => setIsCreateOpen(true)}
                >
                    <Plus size={18} /> New Department
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => (
                    <Card key={dept.id} className="p-6 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <BookOpen size={24} />
                            </div>
                            <Button variant="ghost" size="sm" className="text-slate-400 -mr-2 -mt-2">
                                <MoreVertical size={18} />
                            </Button>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-1">{dept.name}</h3>
                        <p className="text-sm font-medium text-slate-500 mb-4">Code: {dept.code}</p>

                        <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                {dept.headOfDept.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-500">Head of Dept.</p>
                                <p className="text-sm font-medium text-slate-900 truncate">{dept.headOfDept}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <CreateDepartmentDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
            />
        </div >
    );
}

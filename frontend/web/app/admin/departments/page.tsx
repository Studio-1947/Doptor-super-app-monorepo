"use client";

import { ReadyUI } from '@/components/ReadyUI';
import { Building2, Users, Layers, Settings, Plus, ArrowRight } from 'lucide-react';

export default function DepartmentsPage() {
    const stats = [
        { label: 'Total Departments', value: '8', icon: Building2, color: 'bg-indigo-500' },
        { label: 'Total Employees', value: '156', change: '+12', trend: 'up', icon: Users, color: 'bg-emerald-500' },
        { label: 'Sub-units', value: '24', icon: Layers, color: 'bg-blue-500' },
        { label: 'HODs Assigned', value: '8', icon: Settings, color: 'bg-orange-500' },
    ] as any[];

    const departments = [
        { id: 1, name: 'Engineering', hod: 'Amit Sharma', employees: 42, subUnits: 4, budget: '$450k' },
        { id: 2, name: 'Marketing', hod: 'Priya Patel', employees: 18, subUnits: 2, budget: '$120k' },
        { id: 3, name: 'Human Resources', hod: 'Sonia Gill', employees: 12, subUnits: 1, budget: '$85k' },
        { id: 4, name: 'Operations', hod: 'Rahul Verma', employees: 34, subUnits: 5, budget: '$310k' },
        { id: 5, name: 'Sales', hod: 'Vikram Singh', employees: 50, subUnits: 3, budget: '$200k' },
    ];

    return (
        <ReadyUI 
            title="Departments Management" 
            description="Manage your organization's structure, departments, and sub-units."
            moduleName="Admin"
            stats={stats}
            primaryAction={{
                label: "Add Department",
                icon: Plus
            }}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Head of Dept</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Employees</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sub-units</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {departments.map((dept) => (
                            <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] border border-indigo-100 uppercase">
                                            {dept.name[0]}
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">{dept.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600">{dept.hod}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1">{dept.employees}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-bold text-slate-500">{dept.subUnits}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-emerald-600">{dept.budget}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-1 ml-auto group-hover:gap-2 transition-all">
                                        Details <ArrowRight size={12} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ReadyUI>
    );
}

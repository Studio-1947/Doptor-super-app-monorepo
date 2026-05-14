"use client";

import { ReadyUI } from '@/components/ReadyUI';
import { 
    Users, 
    BookOpen, 
    Award, 
    Calendar, 
    Plus, 
    ArrowRight,
    Briefcase,
    Mail
} from 'lucide-react';

export default function FacultyPage() {
    const stats = [
        { label: 'Total Faculty', value: '184', change: '+4', trend: 'up', icon: Users, color: 'bg-primary-500' },
        { label: 'On Campus', value: '162', change: '92%', trend: 'up', icon: Calendar, color: 'bg-emerald-500' },
        { label: 'Publications', value: '1,240', change: '+24', trend: 'up', icon: BookOpen, color: 'bg-indigo-500' },
        { label: 'Research Grants', value: '12', icon: Award, color: 'bg-amber-500' },
    ] as any[];

    const faculty = [
        { id: 'FAC-101', name: 'Dr. Sarah Connor', designation: 'Professor', department: 'Computer Science', specialization: 'Artificial Intelligence', status: 'Available' },
        { id: 'FAC-102', name: 'Dr. James Smith', designation: 'Asst. Professor', department: 'Mathematics', specialization: 'Number Theory', status: 'In Class' },
        { id: 'FAC-103', name: 'Prof. Elena Gilbert', designation: 'HOD', department: 'Electrical Eng.', specialization: 'Smart Grids', status: 'Available' },
        { id: 'FAC-104', name: 'Dr. Robert Brown', designation: 'Associate Prof.', department: 'Physics', specialization: 'Quantum Mechanics', status: 'Meeting' },
        { id: 'FAC-105', name: 'Dr. Linda White', designation: 'Professor', department: 'Computer Science', specialization: 'Cybersecurity', status: 'Available' },
    ];

    return (
        <ReadyUI 
            title="Faculty Directory" 
            description="Manage academic staff records, designations, and departmental assignments."
            moduleName="Campus"
            stats={stats}
            primaryAction={{
                label: "Add Faculty",
                icon: Plus
            }}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Faculty ID</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name & Designation</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Specialization</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {faculty.map((member) => (
                            <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="text-xs font-black text-primary-600 tracking-tighter">{member.id}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900">{member.name}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{member.designation}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600">{member.department}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-500">{member.specialization}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border ${
                                        member.status === 'Available' ? 'text-emerald-600 border-emerald-100 bg-emerald-50' :
                                        member.status === 'In Class' ? 'text-indigo-600 border-indigo-100 bg-indigo-50' :
                                        'text-orange-600 border-orange-100 bg-orange-50'
                                    }`}>
                                        {member.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1 ml-auto group-hover:gap-3 transition-all hover:text-primary-600">
                                        Contact <Mail size={14} />
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

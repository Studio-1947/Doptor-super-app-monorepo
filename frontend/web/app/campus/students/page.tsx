"use client";

import { ReadyUI } from '@/components/ReadyUI';
import { 
    Users, 
    GraduationCap, 
    UserPlus, 
    Search, 
    Filter, 
    Download, 
    ArrowRight,
    BookOpen,
    School,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function StudentsPage() {
    const stats = [
        { label: 'Total Students', value: '2,840', change: '+142', trend: 'up', icon: Users, color: 'bg-primary-500' },
        { label: 'Active Today', value: '2,612', change: '+54', trend: 'up', icon: CheckCircle2, color: 'bg-emerald-500' },
        { label: 'New Admissions', value: '45', change: '+8', trend: 'up', icon: UserPlus, color: 'bg-indigo-500' },
        { label: 'Avg. Attendance', value: '92%', change: '-1%', trend: 'down', icon: BookOpen, color: 'bg-amber-500' },
    ] as any[];

    const students = [
        { id: 'STU-1001', name: 'Aarav Sharma', department: 'Computer Science', batch: '2022-26', status: 'Active', roll: 'CS-001' },
        { id: 'STU-1002', name: 'Ishani Gupta', department: 'Electrical Eng.', batch: '2023-27', status: 'Active', roll: 'EE-045' },
        { id: 'STU-1003', name: 'Kabir Verma', department: 'Mechanical Eng.', batch: '2021-25', status: 'On Leave', roll: 'ME-012' },
        { id: 'STU-1004', name: 'Meera Reddy', department: 'Civil Eng.', batch: '2022-26', status: 'Active', roll: 'CE-089' },
        { id: 'STU-1005', name: 'Rohan Mehra', department: 'Computer Science', batch: '2023-27', status: 'Active', roll: 'CS-156' },
    ];

    return (
        <ReadyUI 
            title="Students Registry" 
            description="Manage student records, academic progress, and institutional enrollment."
            moduleName="Campus"
            stats={stats}
            primaryAction={{
                label: "Enroll Student",
                icon: UserPlus
            }}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll No</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {students.map((student) => (
                            <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="text-xs font-black text-primary-600 tracking-tighter">{student.roll}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200">
                                            {student.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">{student.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600">{student.department}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-500">{student.batch}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border ${
                                        student.status === 'Active' ? 'text-emerald-600 border-emerald-100 bg-emerald-50' : 'text-orange-600 border-orange-100 bg-orange-50'
                                    }`}>
                                        {student.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1 ml-auto group-hover:gap-3 transition-all hover:text-primary-600">
                                        Profile <ArrowRight size={14} />
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

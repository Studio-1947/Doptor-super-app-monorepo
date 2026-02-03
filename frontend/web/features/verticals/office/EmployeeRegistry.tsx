"use client";

import { Card, Button } from '@doptor/shared';
import { Search, MapPin, Mail, Phone, MoreHorizontal, Briefcase, Filter, Download } from 'lucide-react';

const EMPLOYEES = [
    { id: 1, name: 'Dr. Sarah Smith', role: 'Head of Department', dept: 'Computer Science', location: 'Block A, Room 304', email: 'sarah.smith@doptor.edu', phone: '+1 (555) 123-4567', status: 'Active' },
    { id: 2, name: 'Prof. John Doe', role: 'Senior Professor', dept: 'Mathematics', location: 'Block B, Room 102', email: 'john.doe@doptor.edu', phone: '+1 (555) 234-5678', status: 'On Leave' },
    { id: 3, name: 'Ms. Emily Chen', role: 'Admin Officer', dept: 'Registrar Office', location: 'Admin Block, Room 12', email: 'emily.chen@doptor.edu', phone: '+1 (555) 345-6789', status: 'Active' },
    { id: 4, name: 'Mr. Michael Brown', role: 'Lab Assistant', dept: 'Physics', location: 'Science Block, Lab 3', email: 'michael.brown@doptor.edu', phone: '+1 (555) 456-7890', status: 'Active' },
    { id: 5, name: 'Mrs. Linda Johnson', role: 'Librarian', dept: 'Central Library', location: 'Library Building', email: 'linda.johnson@doptor.edu', phone: '+1 (555) 567-8901', status: 'Retired' },
];

export function EmployeeRegistry() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Employee Registry</h1>
                    <p className="text-slate-500">Centralized database of all staff and faculty members.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2">
                        <Download size={16} />
                        Export
                    </Button>
                    <Button variant="primary">Add Employee</Button>
                </div>
            </div>

            <Card className="p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>
                    <div className="h-6 w-px bg-slate-300 mx-2"></div>
                    <div className="flex gap-2">
                        <select className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-2 outline-none focus:border-primary-500">
                            <option>All Departments</option>
                            <option>Computer Science</option>
                            <option>Mathematics</option>
                            <option>Admin</option>
                        </select>
                        <select className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-2 outline-none focus:border-primary-500">
                            <option>All Status</option>
                            <option>Active</option>
                            <option>On Leave</option>
                            <option>Retired</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-slate-200">
                    {EMPLOYEES.map((employee) => (
                        <div key={employee.id} className="bg-white p-6 hover:shadow-md transition-shadow group relative">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-500">
                                        {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{employee.name}</h3>
                                        <p className="text-sm text-primary-600 font-medium">{employee.role}</p>
                                    </div>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <Briefcase size={16} className="text-slate-400" />
                                    <span>{employee.dept}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500">
                                    <MapPin size={16} className="text-slate-400" />
                                    <span>{employee.location}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500">
                                    <Mail size={16} className="text-slate-400" />
                                    <a href={`mailto:${employee.email}`} className="hover:text-primary-600 hover:underline">{employee.email}</a>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500">
                                    <Phone size={16} className="text-slate-400" />
                                    <span>{employee.phone}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${employee.status === 'Active' ? 'bg-green-50 text-green-700' :
                                        employee.status === 'On Leave' ? 'bg-amber-50 text-amber-700' :
                                            'bg-slate-100 text-slate-500'
                                    }`}>
                                    {employee.status}
                                </span>
                                <Button variant="outline" size="sm">View Profile</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

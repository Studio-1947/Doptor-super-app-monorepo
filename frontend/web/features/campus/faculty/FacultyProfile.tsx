"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Mail, Phone, MapPin, Calendar, User, GraduationCap, FileText, Clock, BookOpen } from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import Link from 'next/link';
import {
    getFacultyById,
    getFacultyFullName,
    getFacultyInitials,
    calculateAge,
    Faculty
} from './faculty-mock.db';
import { MOCK_CLASSES } from '../campus-mock.db';

export function FacultyProfile() {
    const params = useParams();
    const router = useRouter();
    const facultyId = params?.id as string;
    const faculty = getFacultyById(facultyId);

    const [activeTab, setActiveTab] = useState<'personal' | 'classes' | 'schedule' | 'documents'>('personal');

    if (!faculty) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-slate-500 mb-4">Faculty member not found</p>
                <Button variant="outline" onClick={() => router.push('/campus/faculty')}>
                    Back to Faculty
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Back Button */}
            <div className="mb-6">
                <Link
                    href="/campus/faculty"
                    className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Faculty
                </Link>
            </div>

            {/* Header Card */}
            <Card className="p-6 mb-6 border-slate-200">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-3xl shrink-0">
                        {getFacultyInitials(faculty)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{getFacultyFullName(faculty)}</h1>
                                <p className="text-sm text-slate-500 mt-1">{faculty.designation} • {faculty.department}</p>
                                <p className="text-xs text-slate-400 mt-1">Employee ID: {faculty.employeeId}</p>
                            </div>
                            <Button variant="outline" size="sm" className="gap-2 self-start">
                                <Edit2 size={16} />
                                Edit Profile
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <GraduationCap size={16} className="text-slate-400" />
                                <div>
                                    <p className="text-slate-500 text-xs">Qualification</p>
                                    <p className="text-slate-900 font-medium">{faculty.qualification}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <Calendar size={16} className="text-slate-400" />
                                <div>
                                    <p className="text-slate-500 text-xs">Experience</p>
                                    <p className="text-slate-900 font-medium">{faculty.experience} years</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <Mail size={16} className="text-slate-400" />
                                <div>
                                    <p className="text-slate-500 text-xs">Email</p>
                                    <p className="text-slate-900 font-medium truncate">{faculty.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <div className={`w-3 h-3 rounded-full ${faculty.status === 'active' ? 'bg-emerald-500' :
                                        faculty.status === 'on-leave' ? 'bg-orange-500' : 'bg-slate-400'
                                    }`} />
                                <div>
                                    <p className="text-slate-500 text-xs">Status</p>
                                    <p className="text-slate-900 font-medium capitalize">{faculty.status.replace('-', ' ')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto">
                {[
                    { id: 'personal', label: 'Personal Info', icon: User },
                    { id: 'classes', label: 'Assigned Classes', icon: BookOpen },
                    { id: 'schedule', label: 'Schedule', icon: Clock },
                    { id: 'documents', label: 'Documents', icon: FileText },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'personal' && <PersonalInfoTab faculty={faculty} />}
                {activeTab === 'classes' && <AssignedClassesTab faculty={faculty} />}
                {activeTab === 'schedule' && <ScheduleTab faculty={faculty} />}
                {activeTab === 'documents' && <DocumentsTab faculty={faculty} />}
            </div>
        </div>
    );
}

// Personal Info Tab
function PersonalInfoTab({ faculty }: { faculty: Faculty }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                    <InfoRow label="Full Name" value={getFacultyFullName(faculty)} />
                    <InfoRow label="Employee ID" value={faculty.employeeId} />
                    <InfoRow label="Date of Birth" value={new Date(faculty.dateOfBirth).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    })} />
                    <InfoRow label="Age" value={`${calculateAge(faculty.dateOfBirth)} years`} />
                    <InfoRow label="Gender" value={faculty.gender.charAt(0).toUpperCase() + faculty.gender.slice(1)} />
                    <InfoRow label="Blood Group" value={faculty.bloodGroup || 'Not specified'} />
                </div>
            </Card>

            <Card className="p-6 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                    <InfoRow label="Email" value={faculty.email} icon={Mail} />
                    <InfoRow label="Phone" value={faculty.phone} icon={Phone} />
                    <InfoRow label="Address" value={faculty.address} icon={MapPin} />
                </div>
            </Card>

            <Card className="p-6 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Professional Details</h3>
                <div className="space-y-4">
                    <InfoRow label="Department" value={faculty.department} />
                    <InfoRow label="Designation" value={faculty.designation} />
                    <InfoRow label="Qualification" value={faculty.qualification} />
                    <InfoRow label="Specialization" value={faculty.specialization} />
                    <InfoRow label="Experience" value={`${faculty.experience} years`} />
                    <InfoRow label="Join Date" value={new Date(faculty.joinDate).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    })} />
                </div>
            </Card>

            <Card className="p-6 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Emergency Contact</h3>
                <div className="space-y-4">
                    <InfoRow label="Name" value={faculty.emergencyContact.name} icon={User} />
                    <InfoRow label="Relation" value={faculty.emergencyContact.relation} />
                    <InfoRow label="Phone" value={faculty.emergencyContact.phone} icon={Phone} />
                </div>
            </Card>

            <Card className="p-6 border-slate-200 lg:col-span-2">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Subjects Taught</h3>
                <div className="flex flex-wrap gap-2">
                    {faculty.subjects.map((subject, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-100 text-sm font-medium">
                            {subject}
                        </span>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// Assigned Classes Tab
function AssignedClassesTab({ faculty }: { faculty: Faculty }) {
    const getClassName = (classId: string) => {
        const classData = MOCK_CLASSES.find(c => c.id === classId);
        return classData?.name || 'Unknown';
    };

    const getSectionName = (classId: string, sectionId: string) => {
        const classData = MOCK_CLASSES.find(c => c.id === classId);
        const section = classData?.sections.find(s => s.id === sectionId);
        return section?.name || 'Unknown';
    };

    if (faculty.assignedClasses.length === 0) {
        return (
            <Card className="p-12 border-slate-200 text-center">
                <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">No classes assigned yet</p>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {faculty.assignedClasses.map((assignment, idx) => (
                <Card key={idx} className="p-4 border-slate-200 hover:border-primary-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                                {getClassName(assignment.classId)[0]}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">{getClassName(assignment.classId)}</p>
                                <p className="text-xs text-slate-500">Section {getSectionName(assignment.classId, assignment.sectionId)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="pt-3 border-t border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Subject</p>
                        <p className="text-sm font-medium text-slate-900">{assignment.subject}</p>
                    </div>
                </Card>
            ))}
        </div>
    );
}

// Schedule Tab
function ScheduleTab({ faculty }: { faculty: Faculty }) {
    if (faculty.schedule.length === 0) {
        return (
            <Card className="p-12 border-slate-200 text-center">
                <Clock size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">No schedule available</p>
                <p className="text-xs text-slate-400 mt-1">Schedule will be displayed once classes are assigned</p>
            </Card>
        );
    }

    const getClassName = (classId: string) => {
        const classData = MOCK_CLASSES.find(c => c.id === classId);
        return classData?.name || 'Unknown';
    };

    const getSectionName = (classId: string, sectionId: string) => {
        const classData = MOCK_CLASSES.find(c => c.id === classId);
        const section = classData?.sections.find(s => s.id === sectionId);
        return section?.name || 'Unknown';
    };

    return (
        <div className="space-y-4">
            {faculty.schedule.map((daySchedule, idx) => (
                <Card key={idx} className="p-6 border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">{daySchedule.day}</h3>
                    <div className="space-y-3">
                        {daySchedule.periods.map((period, periodIdx) => (
                            <div key={periodIdx} className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200">
                                <div className="flex items-center gap-2 min-w-[120px]">
                                    <Clock size={16} className="text-slate-400" />
                                    <span className="text-sm font-medium text-slate-700">{period.time}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-900">{period.subject}</p>
                                    <p className="text-xs text-slate-500">
                                        {getClassName(period.classId)} - Section {getSectionName(period.classId, period.sectionId)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            ))}
        </div>
    );
}

// Documents Tab
function DocumentsTab({ faculty }: { faculty: Faculty }) {
    const documents = [
        { id: 1, name: 'Degree Certificate', type: 'PDF', uploadedOn: '2024-01-15', size: '450 KB' },
        { id: 2, name: 'Experience Certificate', type: 'PDF', uploadedOn: '2024-01-15', size: '280 KB' },
        { id: 3, name: 'ID Proof (Aadhar)', type: 'PDF', uploadedOn: '2024-01-15', size: '320 KB' },
        { id: 4, name: 'Resume', type: 'PDF', uploadedOn: '2024-01-15', size: '520 KB' },
    ];

    return (
        <div className="space-y-6">
            <Card className="p-6 border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Uploaded Documents</h3>
                    <Button variant="outline" size="sm" className="gap-2">
                        <FileText size={16} />
                        Upload Document
                    </Button>
                </div>

                <div className="space-y-3">
                    {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border border-slate-200 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-semibold text-xs">
                                    {doc.type}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">{doc.name}</p>
                                    <p className="text-xs text-slate-500">Uploaded on {new Date(doc.uploadedOn).toLocaleDateString('en-IN')} • {doc.size}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1.5 text-xs border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
                                    View
                                </button>
                                <button className="px-3 py-1.5 text-xs border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
                                    Download
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card className="p-6 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Required Documents</h3>
                <div className="space-y-2">
                    <DocumentChecklistItem label="Degree Certificate" completed />
                    <DocumentChecklistItem label="Experience Certificate" completed />
                    <DocumentChecklistItem label="ID Proof" completed />
                    <DocumentChecklistItem label="Resume/CV" completed />
                    <DocumentChecklistItem label="Police Verification" completed={false} />
                    <DocumentChecklistItem label="Medical Certificate" completed={false} />
                </div>
            </Card>
        </div>
    );
}

// Helper Components
function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
    return (
        <div className="flex items-start gap-3">
            {Icon && <Icon size={16} className="text-slate-400 mt-0.5 shrink-0" />}
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm text-slate-900 font-medium mt-0.5 break-words">{value}</p>
            </div>
        </div>
    );
}

function DocumentChecklistItem({ label, completed }: { label: string; completed: boolean }) {
    return (
        <div className="flex items-center gap-3 py-2">
            <div className={`w-5 h-5 border-2 flex items-center justify-center ${completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                }`}>
                {completed && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </div>
            <span className={`text-sm ${completed ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
        </div>
    );
}

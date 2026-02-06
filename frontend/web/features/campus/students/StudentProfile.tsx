"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Mail, Phone, MapPin, Calendar, User, GraduationCap, FileText, Upload } from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import Link from 'next/link';
import {
    getStudentById,
    getStudentFullName,
    getStudentInitials,
    calculateAge,
    Student
} from './student-mock.db';
import { MOCK_CLASSES } from '../campus-mock.db';

export function StudentProfile() {
    const params = useParams();
    const router = useRouter();
    const studentId = params?.id as string;
    const student = getStudentById(studentId);

    const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'attendance' | 'documents'>('personal');

    if (!student) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-slate-500 mb-4">Student not found</p>
                <Button variant="secondary" onClick={() => router.push('/campus/students')}>
                    Back to Students
                </Button>
            </div>
        );
    }

    const classData = MOCK_CLASSES.find(c => c.id === student.classId);
    const section = classData?.sections.find(s => s.id === student.sectionId);

    return (
        <div className="flex flex-col h-full">
            {/* Back Button */}
            <div className="mb-6">
                <Link
                    href="/campus/students"
                    className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Students
                </Link>
            </div>

            {/* Header Card */}
            <Card className="p-6 mb-6 border-slate-200">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 text-white flex items-center justify-center font-bold text-3xl shrink-0">
                        {getStudentInitials(student)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{getStudentFullName(student)}</h1>
                                <p className="text-sm text-slate-500 mt-1">Roll Number: {student.rollNumber}</p>
                            </div>
                            <Button variant="secondary" size="sm" className="gap-2 self-start">
                                <Edit2 size={16} />
                                Edit Profile
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <GraduationCap size={16} className="text-slate-400" />
                                <div>
                                    <p className="text-slate-500 text-xs">Class</p>
                                    <p className="text-slate-900 font-medium">{classData?.name} - {section?.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <Calendar size={16} className="text-slate-400" />
                                <div>
                                    <p className="text-slate-500 text-xs">Age</p>
                                    <p className="text-slate-900 font-medium">{calculateAge(student.dateOfBirth)} years</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <Mail size={16} className="text-slate-400" />
                                <div>
                                    <p className="text-slate-500 text-xs">Email</p>
                                    <p className="text-slate-900 font-medium truncate">{student.email || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <div className={`w-3 h-3 rounded-full ${student.status === 'active' ? 'bg-emerald-500' :
                                    student.status === 'inactive' ? 'bg-orange-500' : 'bg-slate-400'
                                    }`} />
                                <div>
                                    <p className="text-slate-500 text-xs">Status</p>
                                    <p className="text-slate-900 font-medium capitalize">{student.status}</p>
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
                    { id: 'academic', label: 'Academic Info', icon: GraduationCap },
                    { id: 'attendance', label: 'Attendance', icon: Calendar },
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
                {activeTab === 'personal' && <PersonalInfoTab student={student} />}
                {activeTab === 'academic' && <AcademicInfoTab student={student} classData={classData} />}
                {activeTab === 'attendance' && <AttendanceTab student={student} />}
                {activeTab === 'documents' && <DocumentsTab student={student} />}
            </div>
        </div>
    );
}

// Personal Info Tab
function PersonalInfoTab({ student }: { student: Student }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                    <InfoRow label="Full Name" value={`${student.firstName} ${student.lastName}`} />
                    <InfoRow label="Date of Birth" value={new Date(student.dateOfBirth).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    })} />
                    <InfoRow label="Age" value={`${calculateAge(student.dateOfBirth)} years`} />
                    <InfoRow label="Gender" value={student.gender.charAt(0).toUpperCase() + student.gender.slice(1)} />
                    <InfoRow label="Blood Group" value={student.bloodGroup || 'Not specified'} />
                </div>
            </Card>

            <Card className="p-6 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                    <InfoRow label="Email" value={student.email || 'Not provided'} icon={Mail} />
                    <InfoRow label="Phone" value={student.phone || 'Not provided'} icon={Phone} />
                    <InfoRow label="Address" value={student.address} icon={MapPin} />
                </div>
            </Card>

            <Card className="p-6 border-slate-200 lg:col-span-2">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Parent/Guardian Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow label="Parent Name" value={student.parentName} icon={User} />
                    <InfoRow label="Parent Phone" value={student.parentPhone} icon={Phone} />
                    <InfoRow label="Parent Email" value={student.parentEmail || 'Not provided'} icon={Mail} />
                </div>
            </Card>
        </div>
    );
}

// Academic Info Tab
function AcademicInfoTab({ student, classData }: { student: Student; classData: any }) {
    const section = classData?.sections.find((s: any) => s.id === student.sectionId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Current Academic Details</h3>
                <div className="space-y-4">
                    <InfoRow label="Roll Number" value={student.rollNumber} />
                    <InfoRow label="Class" value={classData?.name || 'Unknown'} />
                    <InfoRow label="Section" value={section?.name || 'Unknown'} />
                    <InfoRow label="Enrollment Date" value={new Date(student.enrollmentDate).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    })} />
                    <InfoRow label="Academic Status" value={student.status.charAt(0).toUpperCase() + student.status.slice(1)} />
                </div>
            </Card>

            <Card className="p-6 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Previous Education</h3>
                <div className="space-y-4">
                    <InfoRow label="Previous School" value={student.previousSchool || 'Not specified'} />
                    <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500 mb-2">Academic History</p>
                        <p className="text-sm text-slate-700">No transfer records available</p>
                    </div>
                </div>
            </Card>

            <Card className="p-6 border-slate-200 lg:col-span-2">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Summary</h3>
                <div className="bg-slate-50 p-4 text-center">
                    <p className="text-sm text-slate-500">Performance data will be available after first assessment</p>
                </div>
            </Card>
        </div>
    );
}

// Attendance Tab
function AttendanceTab({ student }: { student: Student }) {
    // Mock attendance data
    const attendancePercentage = 92.5;
    const totalDays = 120;
    const presentDays = 111;
    const absentDays = 9;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-2">Overall Attendance</h3>
                <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-slate-900">{attendancePercentage}%</p>
                </div>
                <div className="mt-4 h-2 bg-slate-100 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                        style={{ width: `${attendancePercentage}%` }}
                    />
                </div>
            </Card>

            <Card className="p-6 border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-2">Present Days</h3>
                <p className="text-4xl font-bold text-emerald-600">{presentDays}</p>
                <p className="text-sm text-slate-500 mt-2">out of {totalDays} days</p>
            </Card>

            <Card className="p-6 border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-2">Absent Days</h3>
                <p className="text-4xl font-bold text-orange-600">{absentDays}</p>
                <p className="text-sm text-slate-500 mt-2">including 2 excused</p>
            </Card>

            <Card className="p-6 border-slate-200 lg:col-span-3">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Attendance</h3>
                <div className="bg-slate-50 p-8 text-center">
                    <Calendar size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">Calendar view coming soon</p>
                    <p className="text-xs text-slate-400 mt-1">Will display color-coded attendance for each day</p>
                </div>
            </Card>
        </div>
    );
}

// Documents Tab
function DocumentsTab({ student }: { student: Student }) {
    const documents = [
        { id: 1, name: 'Birth Certificate', type: 'PDF', uploadedOn: '2024-06-01', size: '245 KB' },
        { id: 2, name: 'Transfer Certificate', type: 'PDF', uploadedOn: '2024-06-01', size: '180 KB' },
        { id: 3, name: 'Aadhar Card', type: 'PDF', uploadedOn: '2024-06-01', size: '320 KB' },
    ];

    return (
        <div className="space-y-6">
            <Card className="p-6 border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Uploaded Documents</h3>
                    <Button variant="secondary" size="sm" className="gap-2">
                        <Upload size={16} />
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
                    <DocumentChecklistItem label="Birth Certificate" completed />
                    <DocumentChecklistItem label="Transfer Certificate" completed />
                    <DocumentChecklistItem label="Aadhar Card" completed />
                    <DocumentChecklistItem label="Passport Size Photo" completed={false} />
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

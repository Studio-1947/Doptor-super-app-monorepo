"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Mail, Phone, MapPin, Calendar, User, GraduationCap, FileText, Upload } from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import Link from 'next/link';
import { campusService, Student } from '../../../services/campus.service';
import { toast } from 'sonner';

export function StudentProfile() {
    const params = useParams();
    const router = useRouter();
    const studentId = params?.id as string;

    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'attendance' | 'documents'>('personal');

    useEffect(() => {
        if (studentId) {
            loadStudent();
        }
    }, [studentId]);

    const loadStudent = async () => {
        try {
            setLoading(true);
            const data = await campusService.getStudentById(studentId);
            setStudent(data);
        } catch (error) {
            console.error("Failed to load student profile", error);
            toast.error("Failed to load student profile");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
    }

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

    const initials = `${student.first_name[0]}${student.last_name[0]}`.toUpperCase();
    const fullName = `${student.first_name} ${student.last_name}`;

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
                        {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
                                <p className="text-sm text-slate-500 mt-1">Roll Number: {student.rollNumber || 'N/A'}</p>
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
                                    <p className="text-slate-900 font-medium">{student.className || 'Not Assigned'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <Calendar size={16} className="text-slate-400" />
                                <div>
                                    <p className="text-slate-500 text-xs">Age</p>
                                    {/* Simplified Age Calculation or Placeholder */}
                                    <p className="text-slate-900 font-medium">{student.dateOfBirth ? 'Unknown' : 'N/A'}</p>
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
                                <div className={`w-3 h-3 rounded-full ${student.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
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
                {activeTab === 'academic' && <AcademicInfoTab student={student} />}
                {activeTab === 'attendance' && <AttendanceTab student={student} />}
                {activeTab === 'documents' && <DocumentsTab student={student} />}
            </div>
        </div>
    );
}

// Personal Info Tab
function PersonalInfoTab({ student }: { student: Student }) {
    const dob = student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                    <InfoRow label="Full Name" value={`${student.first_name} ${student.last_name}`} />
                    <InfoRow label="Date of Birth" value={dob} />
                    <InfoRow label="Gender" value={student.gender || 'N/A'} />
                    <InfoRow label="Blood Group" value={student.bloodGroup || 'Not specified'} />
                </div>
            </Card>

            <Card className="p-6 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                    <InfoRow label="Email" value={student.email || 'Not provided'} icon={Mail} />
                    <InfoRow label="Phone" value={student.phone || 'Not provided'} icon={Phone} />
                    <InfoRow label="Address" value={student.address || 'N/A'} icon={MapPin} />
                </div>
            </Card>

            <Card className="p-6 border-slate-200 lg:col-span-2">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Parent/Guardian Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow label="Parent Name" value={student.parentName || 'N/A'} icon={User} />
                    <InfoRow label="Parent Phone" value={student.parentPhone || 'N/A'} icon={Phone} />
                    <InfoRow label="Parent Email" value={student.parentEmail || 'Not provided'} icon={Mail} />
                </div>
            </Card>
        </div>
    );
}

// Academic Info Tab
function AcademicInfoTab({ student }: { student: Student }) {
    const enrollmentDate = student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'N/A';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Current Academic Details</h3>
                <div className="space-y-4">
                    <InfoRow label="Roll Number" value={student.rollNumber || 'N/A'} />
                    <InfoRow label="Class" value={student.className || 'Not Assigned'} />
                    <InfoRow label="Section" value={'N/A'} /> {/* Section not yet in backend */}
                    <InfoRow label="Enrollment Date" value={enrollmentDate} />
                    <InfoRow label="Academic Status" value={student.status || 'Unknown'} />
                </div>
            </Card>

            <Card className="p-6 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Previous Education</h3>
                <div className="space-y-4">
                    <InfoRow label="Previous School" value={student.previousSchool || 'Not specified'} />
                </div>
            </Card>
        </div>
    );
}

// Attendance Tab
function AttendanceTab({ student }: { student: Student }) {
    // Mocking summary stats for now as backend returns raw records
    const attendancePercentage = 0;
    const totalDays = 0;
    const presentDays = 0;
    const absentDays = 0;

    // We can calculate this from student.attendanceStats if available

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
            </Card>

            <Card className="p-6 border-slate-200 lg:col-span-3">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Attendance</h3>
                <div className="bg-slate-50 p-8 text-center">
                    <Calendar size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500">Calendar view coming soon</p>
                </div>
            </Card>
        </div>
    );
}

// Documents Tab - Placeholder
function DocumentsTab({ student }: { student: Student }) {
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
                <div className="p-8 text-center text-slate-500">
                    No documents uploaded
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

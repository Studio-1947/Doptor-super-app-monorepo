"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Mail, Phone, MapPin, Calendar, User, GraduationCap, FileText, Clock, BookOpen } from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import Link from 'next/link';
import { campusService, Instructor } from '../../../services/campus.service';
import { toast } from 'sonner';

export function FacultyProfile() {
    const params = useParams();
    const router = useRouter();
    const facultyId = params?.id as string;

    const [faculty, setFaculty] = useState<Instructor | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'personal' | 'classes' | 'schedule' | 'documents'>('personal');

    useEffect(() => {
        if (facultyId) {
            loadFaculty();
        }
    }, [facultyId]);

    const loadFaculty = async () => {
        try {
            setLoading(true);
            const data = await campusService.getFacultyById(facultyId);
            setFaculty(data);
        } catch (error) {
            console.error("Failed to load faculty profile", error);
            toast.error("Failed to load faculty profile");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
    }

    if (!faculty) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-slate-500 mb-4">Faculty member not found</p>
                <Button variant="secondary" onClick={() => router.push('/campus/faculty')}>
                    Back to Faculty
                </Button>
            </div>
        );
    }

    const { first_name, last_name } = faculty;
    const fullName = `${first_name} ${last_name}`;
    const initials = `${first_name[0]}${last_name[0]}`.toUpperCase();

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
                        {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
                                <p className="text-sm text-slate-500 mt-1">{faculty.designation} • {faculty.department}</p>
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
                                <div className={`w-3 h-3 rounded-full ${faculty.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                <div>
                                    <p className="text-slate-500 text-xs">Status</p>
                                    <p className="text-slate-900 font-medium capitalize">{faculty.status}</p>
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
function PersonalInfoTab({ faculty }: { faculty: Instructor }) {
    const joinDate = faculty.joinDate ? new Date(faculty.joinDate).toLocaleDateString() : 'N/A';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                    <InfoRow label="Full Name" value={`${faculty.first_name} ${faculty.last_name}`} />
                    <InfoRow label="Join Date" value={joinDate} />
                    {/* Add other fields as available from backend */}
                </div>
            </Card>

            <Card className="p-6 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                    <InfoRow label="Email" value={faculty.email} icon={Mail} />
                    <InfoRow label="Phone" value={faculty.phone || 'N/A'} icon={Phone} />
                    <InfoRow label="Address" value={faculty.address || 'N/A'} icon={MapPin} />
                </div>
            </Card>
        </div>
    );
}

// Assigned Classes Tab
function AssignedClassesTab({ faculty }: { faculty: Instructor }) {
    if (!faculty.assignedClasses || faculty.assignedClasses.length === 0) {
        return (
            <Card className="p-12 border-slate-200 text-center">
                <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">No classes assigned yet</p>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {faculty.assignedClasses.map((assignment: any, idx: number) => (
                <Card key={idx} className="p-4 border-slate-200 hover:border-primary-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="font-semibold text-slate-900">{assignment.subject}</p>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

// Schedule Tab - Placeholder for now as backend doesn't support full schedule yet
function ScheduleTab({ faculty }: { faculty: Instructor }) {
    return (
        <Card className="p-12 border-slate-200 text-center">
            <Clock size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">Schedule data not available</p>
        </Card>
    );
}

// Documents Tab - Placeholder
function DocumentsTab({ faculty }: { faculty: Instructor }) {
    return (
        <Card className="p-12 border-slate-200 text-center">
            <FileText size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No documents uploaded</p>
        </Card>
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

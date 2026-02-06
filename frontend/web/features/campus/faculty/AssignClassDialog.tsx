"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_FACULTY, getFacultyFullName } from './faculty-mock.db';
import { MOCK_CLASSES } from '../campus-mock.db';

interface AssignClassDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AssignClassDialog({ isOpen, onClose, onSuccess }: AssignClassDialogProps) {
    const [formData, setFormData] = useState({
        facultyId: '',
        classId: '',
        sectionId: '',
        subject: '',
        days: [] as string[],
        startTime: '',
        endTime: '',
    });

    const [assigning, setAssigning] = useState(false);

    const selectedClass = MOCK_CLASSES.find(c => c.id === formData.classId);
    const selectedFaculty = MOCK_FACULTY.find(f => f.id === formData.facultyId);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // Reset section when class changes
            ...(name === 'classId' ? { sectionId: '' } : {})
        }));
    };

    const handleDayToggle = (day: string) => {
        setFormData(prev => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.facultyId || !formData.classId || !formData.sectionId || !formData.subject) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.days.length === 0) {
            toast.error('Please select at least one day');
            return;
        }

        if (!formData.startTime || !formData.endTime) {
            toast.error('Please specify class timings');
            return;
        }

        setAssigning(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast.success(`Class assigned to ${getFacultyFullName(selectedFaculty!)} successfully`);
        setAssigning(false);
        onClose();
        if (onSuccess) onSuccess();

        // Reset form
        setFormData({
            facultyId: '',
            classId: '',
            sectionId: '',
            subject: '',
            days: [],
            startTime: '',
            endTime: '',
        });
    };

    if (!isOpen) return null;

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white max-w-2xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Assign Class to Faculty</h3>
                        <p className="text-sm text-slate-500 mt-1">Assign a class and schedule to a faculty member</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Faculty Selection */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                Select Faculty <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="facultyId"
                                value={formData.facultyId}
                                onChange={handleChange}
                                required
                                className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            >
                                <option value="">Choose a faculty member</option>
                                {MOCK_FACULTY.filter(f => f.status === 'active').map(faculty => (
                                    <option key={faculty.id} value={faculty.id}>
                                        {getFacultyFullName(faculty)} - {faculty.department}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Class & Section Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                    Class <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="classId"
                                    value={formData.classId}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                >
                                    <option value="">Select Class</option>
                                    {MOCK_CLASSES.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                    Section <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="sectionId"
                                    value={formData.sectionId}
                                    onChange={handleChange}
                                    required
                                    disabled={!formData.classId}
                                    className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">Select Section</option>
                                    {selectedClass?.sections.map(section => (
                                        <option key={section.id} value={section.id}>{section.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                Subject <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                                disabled={!formData.facultyId}
                                className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Select Subject</option>
                                {selectedFaculty?.subjects.map((subject, idx) => (
                                    <option key={idx} value={subject}>{subject}</option>
                                ))}
                            </select>
                            {!formData.facultyId && (
                                <p className="text-xs text-slate-400 mt-1">Select a faculty member first</p>
                            )}
                        </div>

                        {/* Schedule */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-2">
                                Days <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {weekDays.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => handleDayToggle(day)}
                                        className={`py-2 px-3 text-sm font-medium border transition-colors ${formData.days.includes(day)
                                                ? 'bg-primary-600 text-white border-primary-600'
                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {day.slice(0, 3)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                    Start Time <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                    End Time <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                />
                            </div>
                        </div>

                        {/* Summary */}
                        {formData.facultyId && formData.classId && formData.sectionId && formData.subject && (
                            <div className="p-4 bg-blue-50 border border-blue-100">
                                <p className="text-sm font-medium text-blue-900 mb-2">Assignment Summary</p>
                                <div className="text-xs text-blue-700 space-y-1">
                                    <p><strong>Faculty:</strong> {getFacultyFullName(selectedFaculty!)}</p>
                                    <p><strong>Class:</strong> {selectedClass?.name} - Section {selectedClass?.sections.find(s => s.id === formData.sectionId)?.name}</p>
                                    <p><strong>Subject:</strong> {formData.subject}</p>
                                    {formData.days.length > 0 && (
                                        <p><strong>Days:</strong> {formData.days.join(', ')}</p>
                                    )}
                                    {formData.startTime && formData.endTime && (
                                        <p><strong>Time:</strong> {formData.startTime} - {formData.endTime}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={assigning}
                        className="flex-1 px-4 py-2.5 bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {assigning ? 'Assigning...' : 'Assign Class'}
                    </button>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { campusService } from '../../../services/campus.service';

interface AddFacultyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AddFacultyDialog({ isOpen, onClose, onSuccess }: AddFacultyDialogProps) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: 'male',
        address: '',
        department: '',
        designation: '',
        qualification: '',
        specialization: '',
        experience: '',
        joinDate: '',
        subjects: '',
        salary: '',
        bloodGroup: '',
        emergencyContactName: '',
        emergencyContactRelation: '',
        emergencyContactPhone: '',
    });

    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSubmitting(true);

        try {
            // Map form data to API structure if needed, or send as is
            // For now, simulate sending all formData. In a real app, map to Instructor interface.
            const payload = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                ...formData
            }

            await campusService.createFaculty(payload);

            toast.success('Faculty member added successfully');
            setSubmitting(false);
            onClose();
            if (onSuccess) onSuccess();

            // Reset form
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                dateOfBirth: '',
                gender: 'male',
                address: '',
                department: '',
                designation: '',
                qualification: '',
                specialization: '',
                experience: '',
                joinDate: '',
                subjects: '',
                salary: '',
                bloodGroup: '',
                emergencyContactName: '',
                emergencyContactRelation: '',
                emergencyContactPhone: '',
            });
        } catch (error) {
            console.error(error);
            toast.error('Failed to add faculty member');
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white max-w-4xl w-full max-h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Add Faculty Member</h3>
                        <p className="text-sm text-slate-500 mt-1">Fill in the details to add a new faculty member</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Personal Information */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs">1</span>
                                Personal Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Date of Birth <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Gender <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg bg-white"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Blood Group
                                    </label>
                                    <input
                                        type="text"
                                        name="bloodGroup"
                                        value={formData.bloodGroup}
                                        onChange={handleChange}
                                        placeholder="e.g., O+, A-, AB+"
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Address <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                        rows={2}
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs">2</span>
                                Contact Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Phone <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        placeholder="+91 98765 43210"
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Professional Details */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs">3</span>
                                Professional Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Department <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg bg-white"
                                    >
                                        <option value="">Select Department</option>
                                        <option value="Mathematics">Mathematics</option>
                                        <option value="Science">Science</option>
                                        <option value="Languages">Languages</option>
                                        <option value="Computer Science">Computer Science</option>
                                        <option value="Social Studies">Social Studies</option>
                                        <option value="Commerce">Commerce</option>
                                        <option value="Physical Education">Physical Education</option>
                                        <option value="Arts">Arts</option>
                                        <option value="Music">Music</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Designation <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="designation"
                                        value={formData.designation}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg bg-white"
                                    >
                                        <option value="">Select Designation</option>
                                        <option value="Senior Professor">Senior Professor</option>
                                        <option value="Associate Professor">Associate Professor</option>
                                        <option value="Assistant Professor">Assistant Professor</option>
                                        <option value="Lecturer">Lecturer</option>
                                        <option value="Lab Instructor">Lab Instructor</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Qualification <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="qualification"
                                        value={formData.qualification}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., M.Sc. in Physics"
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Specialization
                                    </label>
                                    <input
                                        type="text"
                                        name="specialization"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        placeholder="e.g., Quantum Physics"
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Experience (years) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Join Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="joinDate"
                                        value={formData.joinDate}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Subjects (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        name="subjects"
                                        value={formData.subjects}
                                        onChange={handleChange}
                                        placeholder="e.g., Mathematics, Physics, Chemistry"
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Salary (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="salary"
                                        value={formData.salary}
                                        onChange={handleChange}
                                        min="0"
                                        placeholder="e.g., 50000"
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs">4</span>
                                Emergency Contact
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="emergencyContactName"
                                        value={formData.emergencyContactName}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Relation <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="emergencyContactRelation"
                                        value={formData.emergencyContactRelation}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., Spouse, Father, Mother"
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Phone <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="emergencyContactPhone"
                                        value={formData.emergencyContactPhone}
                                        onChange={handleChange}
                                        required
                                        placeholder="+91 98765 43210"
                                        className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Document Upload */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs">5</span>
                                Documents
                            </h4>
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                                <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                                <p className="text-sm text-slate-600 mb-1 font-medium">Click to upload or drag and drop</p>
                                <p className="text-xs text-slate-400">Degree, Experience Certificate, ID Proof, etc.</p>
                                <input type="file" multiple className="hidden" />
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 flex gap-3 bg-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors font-medium rounded-lg shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 px-4 py-2.5 bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Adding...
                            </>
                        ) : 'Add Faculty'}
                    </button>
                </div>
            </div>
        </div>
    );
}

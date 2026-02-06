"use client";

import { useState } from 'react';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Laptop,
    Bell,
    Shield,
    Save,
    Camera
} from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import { toast } from 'sonner';

export function ProfileSettings() {
    const [formData, setFormData] = useState({
        firstName: 'Soumya',
        lastName: 'Dip',
        email: 'soumya@doptor.io',
        phone: '+91 98765 43210',
        designation: 'Senior Developer',
        notifications: {
            email: true,
            push: true,
            updates: false
        },
        theme: 'system' // light, dark, system
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSaving(false);
        toast.success('Profile updated successfully');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500 mt-1">Manage your profile and preferences</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Left Column: Avatar & Basic Info */}
                    <div className="space-y-6">
                        <Card className="p-6 text-center border-slate-200">
                            <div className="relative inline-block mb-4 group cursor-pointer">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-3xl font-bold border-4 border-white shadow-md">
                                    SD
                                </div>
                                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera size={24} className="text-white" />
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-900">{formData.firstName} {formData.lastName}</h3>
                            <p className="text-sm text-slate-500">{formData.designation}</p>
                        </Card>
                    </div>

                    {/* Right Column: Form Fields */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="p-6 border-slate-200">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <User size={18} className="text-slate-500" />
                                Personal Information
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            disabled
                                            className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-slate-50 text-slate-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 border-slate-200">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Bell size={18} className="text-slate-500" />
                                Notifications
                            </h3>

                            <div className="space-y-3">
                                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded">
                                            <Mail size={16} />
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-900 block text-sm">Email Notifications</span>
                                            <span className="text-xs text-slate-500">Receive updates via email</span>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.notifications.email}
                                        onChange={(e) => setFormData({ ...formData, notifications: { ...formData.notifications, email: e.target.checked } })}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 border-slate-300"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-50 text-purple-600 rounded">
                                            <Laptop size={16} />
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-900 block text-sm">Push Notifications</span>
                                            <span className="text-xs text-slate-500">Receive browser alerts</span>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.notifications.push}
                                        onChange={(e) => setFormData({ ...formData, notifications: { ...formData.notifications, push: e.target.checked } })}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 border-slate-300"
                                    />
                                </label>
                            </div>
                        </Card>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={isSaving}
                                className="gap-2"
                            >
                                {isSaving ? (
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save size={18} />
                                )}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

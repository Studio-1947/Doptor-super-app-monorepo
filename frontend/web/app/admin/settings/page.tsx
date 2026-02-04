'use client';

import { useState, useEffect } from 'react';
import { organisationService, Organisation } from '../../../services/organisation.service';
import { Building2, Globe, Settings, CheckCircle2, XCircle } from 'lucide-react';

export default function OrganisationSettingsPage() {
    const [organisation, setOrganisation] = useState<Organisation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const verticals = [
        { id: 'office', name: 'Office', description: 'Office administration and file management', icon: Building2 },
        { id: 'campus', name: 'Campus', description: 'Academic institution management', icon: Globe },
        { id: 'network', name: 'Network', description: 'Volunteer network management', icon: Settings },
    ];

    useEffect(() => {
        loadOrganisation();
    }, []);

    const loadOrganisation = async () => {
        try {
            // For now, get the first organisation (in production, get from user context)
            const orgs = await organisationService.getAll();
            if (orgs.length > 0) {
                setOrganisation(orgs[0]);
            }
        } catch (error) {
            console.error('Failed to load organisation:', error);
            setMessage({ type: 'error', text: 'Failed to load organisation settings' });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleVertical = async (verticalId: string) => {
        if (!organisation) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const isEnabled = organisation.enabled_verticals?.includes(verticalId);

            let updated;
            if (isEnabled) {
                updated = await organisationService.disableVertical(organisation.id, verticalId);
                setMessage({ type: 'success', text: `${verticalId} vertical disabled successfully` });
            } else {
                updated = await organisationService.enableVertical(organisation.id, verticalId);
                setMessage({ type: 'success', text: `${verticalId} vertical enabled successfully` });
            }

            setOrganisation(updated);
        } catch (error) {
            console.error('Failed to toggle vertical:', error);
            setMessage({ type: 'error', text: 'Failed to update vertical settings' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!organisation) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No organisation found</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{organisation.name}</h1>
                        <p className="text-gray-500 mt-1">Organisation Settings</p>
                    </div>
                    <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">{organisation.slug}</span>
                    </div>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg border ${message.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Vertical Activation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Vertical Activation</h2>
                    <p className="text-gray-500 mt-1">Enable or disable feature verticals for your organisation</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {verticals.map((vertical) => {
                        const Icon = vertical.icon;
                        const isEnabled = organisation.enabled_verticals?.includes(vertical.id) || false;

                        return (
                            <div
                                key={vertical.id}
                                className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${isEnabled
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                onClick={() => !isSaving && toggleVertical(vertical.id)}
                            >
                                {/* Status Badge */}
                                <div className="absolute top-4 right-4">
                                    {isEnabled ? (
                                        <CheckCircle2 className="w-6 h-6 text-blue-600" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-gray-400" />
                                    )}
                                </div>

                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${isEnabled ? 'bg-blue-100' : 'bg-gray-100'
                                    }`}>
                                    <Icon className={`w-6 h-6 ${isEnabled ? 'text-blue-600' : 'text-gray-600'}`} />
                                </div>

                                {/* Content */}
                                <h3 className={`text-lg font-semibold mb-2 ${isEnabled ? 'text-blue-900' : 'text-gray-900'
                                    }`}>
                                    {vertical.name}
                                </h3>
                                <p className={`text-sm ${isEnabled ? 'text-blue-700' : 'text-gray-600'}`}>
                                    {vertical.description}
                                </p>

                                {/* Status Text */}
                                <div className="mt-4">
                                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${isEnabled
                                            ? 'bg-blue-200 text-blue-800'
                                            : 'bg-gray-200 text-gray-700'
                                        }`}>
                                        {isEnabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Organisation Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Organisation Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Organisation Name</label>
                        <input
                            type="text"
                            value={organisation.name}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                        <input
                            type="text"
                            value={organisation.slug}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Created At</label>
                        <input
                            type="text"
                            value={new Date(organisation.created_at).toLocaleDateString()}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Organisation ID</label>
                        <input
                            type="text"
                            value={organisation.id}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-mono text-sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { ReadyUI } from '@/components/ReadyUI';
import { Settings, Globe, Bell, ShieldCheck, Save } from 'lucide-react';

export default function AdminSettingsPage() {
    const stats = [
        { label: 'System Status', value: 'Healthy', icon: ShieldCheck, color: 'bg-emerald-500' },
        { label: 'Active Modules', value: '14', icon: Settings, color: 'bg-indigo-500' },
        { label: 'Integrations', value: '5', icon: Globe, color: 'bg-blue-500' },
        { label: 'Notifications', value: 'Active', icon: Bell, color: 'bg-orange-500' },
    ] as any[];

    return (
        <ReadyUI 
            title="Organisation Settings" 
            description="Configure your organization's global settings, branding, and system preferences."
            moduleName="Admin"
            stats={stats}
            primaryAction={{
                label: "Save Changes",
                icon: Save
            }}
        />
    );
}

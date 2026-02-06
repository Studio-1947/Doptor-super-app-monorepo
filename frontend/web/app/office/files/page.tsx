'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Inbox, Send, Activity, Clock, AlertCircle } from 'lucide-react';
import { filesService, File } from '@/services/files.service';
import FileList from '@/features/office/FileList';
import FileDetails from '@/features/office/FileDetails';
import FileCreateForm from '@/features/office/FileCreateForm';

export default function OfficeFilesPage() {
    const [activeTab, setActiveTab] = useState<'inbox' | 'outbox'>('inbox');
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const loadFiles = useCallback(async () => {
        try {
            setLoading(true);
            const data = activeTab === 'inbox'
                ? await filesService.getInbox()
                : await filesService.getOutbox();
            setFiles(data);
        } catch (error) {
            console.error('Failed to load files', error);
            setFiles([]);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    const filteredFiles = files.filter(f =>
        f.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.file_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Stats Calculation
    const pendingCount = files.filter(f => f.status === 'active').length;
    const urgentCount = files.filter(f => f.priority === 'urgent' || f.priority === 'immediate').length;
    const todayCount = files.filter(f => new Date(f.created_at).toDateString() === new Date().toDateString()).length;

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-3xl font-light text-slate-900 tracking-tight">e-Dak Files</h1>
                    <p className="text-slate-500 mt-1 font-light">Digital file tracking and correspondence system</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-2 rounded-sm shadow-sm"
                >
                    <Plus size={18} />
                    <span>Create File</span>
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    label="Pending Actions"
                    value={pendingCount}
                    icon={Activity}
                    color="text-indigo-600"
                />
                <StatCard
                    label="Urgent Priority"
                    value={urgentCount}
                    icon={AlertCircle}
                    color="text-orange-600"
                />
                <StatCard
                    label="Received Today"
                    value={todayCount}
                    icon={Clock}
                    color="text-emerald-600"
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-slate-100 gap-4">
                    {/* Minimal Tabs */}
                    <div className="flex bg-slate-100/50 p-1 rounded-sm border border-slate-100">
                        <TabButton
                            active={activeTab === 'inbox'}
                            onClick={() => setActiveTab('inbox')}
                            icon={Inbox}
                            label="Inbox"
                            count={activeTab === 'inbox' ? files.length : undefined}
                        />
                        <TabButton
                            active={activeTab === 'outbox'}
                            onClick={() => setActiveTab('outbox')}
                            icon={Send}
                            label="Outbox"
                        />
                    </div>

                    {/* Search & Filter */}
                    <div className="flex w-full sm:w-auto gap-2">
                        <div className="relative group flex-1 sm:flex-none">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-slate-400 rounded-sm text-sm outline-none transition-all placeholder:text-slate-400 font-light"
                            />
                        </div>
                        <button className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-sm transition-colors">
                            <Filter size={16} />
                        </button>
                    </div>
                </div>

                {/* File List */}
                <div className="flex-1 overflow-auto bg-slate-50/30 p-4">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white h-20 rounded-sm border border-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <FileList
                            files={filteredFiles}
                            onFileClick={setSelectedFile}
                        />
                    )}
                </div>
            </div>

            {/* Modals */}
            {selectedFile && (
                <FileDetails
                    fileId={selectedFile.id}
                    onClose={() => setSelectedFile(null)}
                    onUpdate={loadFiles}
                />
            )}

            {showCreateForm && (
                <FileCreateForm
                    onClose={() => setShowCreateForm(false)}
                    onSuccess={loadFiles}
                />
            )}
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all">
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-light text-slate-900 mt-1">{value}</p>
            </div>
            <div className={`p-2.5 bg-slate-50 rounded-sm ${color} group-hover:bg-opacity-80 transition-colors`}>
                <Icon size={20} />
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label, count }: any) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-4 py-1.5 rounded-sm text-sm transition-all
                ${active
                    ? 'bg-white text-slate-900 shadow-sm font-medium'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }
            `}
        >
            <Icon size={16} />
            {label}
            {count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ml-1 ${active ? 'bg-slate-100 text-slate-700' : 'bg-slate-200 text-slate-600'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

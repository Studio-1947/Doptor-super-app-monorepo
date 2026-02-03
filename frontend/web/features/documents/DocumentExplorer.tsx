"use client";

import { Card } from '@doptor/shared';
import { Search, Folder, FileText, Image as ImageIcon, MoreVertical, Grid, List, ChevronRight, UploadCloud } from 'lucide-react';
import { useState } from 'react';

const FOLDERS = [
    { id: 1, name: 'Marketing Assets', items: 24, size: '1.2 GB' },
    { id: 2, name: 'Legal Contracts', items: 8, size: '450 MB' },
    { id: 3, name: 'Employee Records', items: 156, size: '3.4 GB' },
    { id: 4, name: 'Financial Reports', items: 42, size: '890 MB' },
    { id: 5, name: 'Project Specs', items: 12, size: '120 MB' },
];

const FILES = [
    { id: 1, name: 'Q3_Brand_Guidelines.pdf', type: 'pdf', size: '4.5 MB', date: 'Oct 24, 2023', owner: 'John Doe' },
    { id: 2, name: 'Campaign_Banner_Huge.png', type: 'image', size: '12.8 MB', date: 'Oct 23, 2023', owner: 'Sarah Smith' },
    { id: 3, name: 'Meeting_Notes_Oct22.docx', type: 'doc', size: '24 KB', date: 'Oct 22, 2023', owner: 'John Doe' },
    { id: 4, name: 'Budget_Q4_Draft.xlsx', type: 'sheet', size: '1.2 MB', date: 'Oct 20, 2023', owner: 'Mike Jones' },
];

export function DocumentExplorer() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="hover:text-primary-600 cursor-pointer">Documents</span>
                    <ChevronRight size={14} />
                    <span className="font-semibold text-slate-900">Marketing Assets</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search files..."
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>

                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>

                    <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
                        <UploadCloud size={18} />
                        <span className="hidden md:inline">Upload</span>
                    </button>
                </div>
            </div>

            {/* Folders Row */}
            <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Folders</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {FOLDERS.map((folder) => (
                        <Card key={folder.id} className="p-4 flex flex-col items-center text-center gap-3 hover:border-primary-300 hover:shadow-md cursor-pointer transition-all group">
                            <Folder size={40} className="text-amber-400 fill-amber-50 group-hover:scale-110 transition-transform" />
                            <div>
                                <p className="text-sm font-medium text-slate-900 truncate w-full">{folder.name}</p>
                                <p className="text-xs text-slate-400">{folder.items} items</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Files Grid */}
            <div className="flex-1">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recent Files</h3>
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {FILES.map((file) => (
                            <Card key={file.id} className="p-3 hover:border-primary-300 hover:shadow-md cursor-pointer transition-all flex flex-col gap-3 group">
                                <div className="aspect-square rounded-lg bg-slate-50 flex items-center justify-center relative overflow-hidden">
                                    {file.type === 'image' ? (
                                        <div className="w-full h-full bg-purple-100 flex items-center justify-center text-purple-500"><ImageIcon size={32} /></div>
                                    ) : (
                                        <FileText size={32} className={file.type === 'pdf' ? 'text-red-500' : file.type === 'sheet' ? 'text-green-500' : 'text-blue-500'} />
                                    )}

                                    <button className="absolute top-2 right-2 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-slate-600">
                                        <MoreVertical size={14} />
                                    </button>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 truncate" title={file.name}>{file.name}</p>
                                    <p className="text-xs text-slate-400 flex justify-between mt-1">
                                        <span>{file.size}</span>
                                        <span>{file.owner}</span>
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="divide-y divide-slate-100">
                        {FILES.map((file) => (
                            <div key={file.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 transition-colors cursor-pointer group">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${file.type === 'pdf' ? 'bg-red-50 text-red-500' :
                                        file.type === 'sheet' ? 'bg-green-50 text-green-500' :
                                            file.type === 'image' ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'
                                    }`}>
                                    {file.type === 'image' ? <ImageIcon size={20} /> : <FileText size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                                    <p className="text-xs text-slate-500">Modified {file.date} by {file.owner}</p>
                                </div>
                                <div className="hidden md:block text-sm text-slate-500 w-24 text-right">{file.size}</div>
                                <button className="p-2 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        ))}
                    </Card>
                )}
            </div>
        </div>
    );
}

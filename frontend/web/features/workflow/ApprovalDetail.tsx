"use client";

import { Card, Button } from '@doptor/shared';
import { Check, X, CornerUpLeft, FileText, Download, History, User } from 'lucide-react';

export function ApprovalDetail() {
    return (
        <Card className="h-full flex flex-col p-0 overflow-hidden border-l border-slate-200 rounded-none md:rounded-xl shadow-none md:shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Equipment Purchase Request</h1>
                        <p className="text-sm text-slate-500">REQ-2023-089 • Submitted 2 hours ago</p>
                    </div>
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Pending Review</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                    <Button variant="primary" className="flex-1 bg-green-600 hover:bg-green-700 border-green-600">
                        <Check size={18} className="mr-2" /> Approve
                    </Button>
                    <Button variant="secondary" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
                        <X size={18} className="mr-2" /> Reject
                    </Button>
                    <Button variant="ghost" className="text-slate-500">
                        <CornerUpLeft size={18} />
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Details */}
                <section>
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Request Details</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <div>
                            <p className="text-slate-500 mb-1">Applicant</p>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">JD</div>
                                <span className="font-medium text-slate-900">John Doe</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-slate-500 mb-1">Department</p>
                            <span className="font-medium text-slate-900">Marketing</span>
                        </div>
                        <div>
                            <p className="text-slate-500 mb-1">Amount</p>
                            <span className="font-medium text-slate-900 text-lg">$2,400.00</span>
                        </div>
                        <div>
                            <p className="text-slate-500 mb-1">Vendor</p>
                            <span className="font-medium text-slate-900">Apple Store, Inc.</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-slate-500 mb-1 text-sm">Reason / Justification</p>
                        <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                            Upgrade of design team workstations. Current machines are 4 years old and struggling with 4K video rendering tasks. Requesting 2x MacBook Pro M3 Max.
                        </p>
                    </div>
                </section>

                {/* Attachments */}
                <section>
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Attachments (1)</h3>
                    <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:border-primary-500 transition-colors cursor-pointer group bg-white">
                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                            <FileText size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 group-hover:text-primary-600 transition-colors">Vendor_Quote_Q344.pdf</p>
                            <p className="text-xs text-slate-500">2.4 MB • PDF</p>
                        </div>
                        <button className="p-2 text-slate-400 hover:text-slate-600">
                            <Download size={18} />
                        </button>
                    </div>
                </section>

                {/* Approval Chain timeline */}
                <section>
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Approval Chain</h3>
                    <div className="space-y-6 relative pl-2">
                        {/* Line */}
                        <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-slate-200"></div>

                        <TimelineItem
                            status="approved"
                            title="Submitted"
                            user="John Doe"
                            date="Oct 24, 10:30 AM"
                            note="Request created"
                        />
                        <TimelineItem
                            status="approved"
                            title="Dept Head Approval"
                            user="Sarah Manager"
                            date="Oct 24, 02:15 PM"
                            note="Approved. Essential for Q4 projects."
                        />
                        <TimelineItem
                            status="current"
                            title="Finance Review"
                            user="Needs Approval"
                            date="Pending"
                            note="Awaiting finance department sign-off"
                        />
                        <TimelineItem
                            status="pending"
                            title="Final Release"
                            user="CFO"
                            date="Pending"
                        />
                    </div>
                </section>
            </div>
        </Card>
    );
}

function TimelineItem({ status, title, user, date, note }: any) {
    const isApproved = status === 'approved';
    const isCurrent = status === 'current';

    return (
        <div className="flex gap-4 relative z-10">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0 ${isApproved ? 'bg-green-500 border-green-500 text-white' :
                isCurrent ? 'bg-white border-primary-500 text-primary-600' :
                    'bg-slate-100 border-slate-200 text-slate-300'
                }`}>
                {isApproved ? <Check size={16} strokeWidth={3} /> : <User size={16} />}
            </div>
            <div>
                <p className={`text-sm font-bold ${isCurrent ? 'text-primary-700' : 'text-slate-900'}`}>{title}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="font-medium text-slate-700">{user}</span>
                    <span>•</span>
                    <span>{date}</span>
                </div>
                {note && <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 inline-block">{note}</p>}
            </div>
        </div>
    );
}

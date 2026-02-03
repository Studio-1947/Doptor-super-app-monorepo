"use client";

import { ApprovalInbox } from '@/features/workflow/ApprovalInbox';
import { ApprovalDetail } from '@/features/workflow/ApprovalDetail';

export default function ApprovalsPage() {
    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            <div className="flex-1 min-w-0">
                <ApprovalInbox />
            </div>

            {/* Split View for Desktop */}
            <div className="hidden lg:block w-[450px] xl:w-[500px] border-l border-slate-200 pl-6 h-full">
                <ApprovalDetail />
            </div>
        </div>
    );
}

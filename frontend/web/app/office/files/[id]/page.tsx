"use client";

import FileDetails from '@/features/office/FileDetails';
import { useRouter } from 'next/navigation';

export default function FileDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-50 p-4">
            {/* 
        Reuse the FileDetails component. 
        Since it has 'fixed inset-0', it will cover the screen.
        We handle onClose to go back to the list.
      */}
            <FileDetails
                fileId={params.id}
                onClose={() => router.back()}
                onUpdate={() => {
                    // In a real app we might revalidate data here
                    console.log('File updated');
                }}
            />
        </div>
    );
}

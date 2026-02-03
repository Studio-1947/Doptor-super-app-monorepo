"use client";

import { AttendanceCheckIn, AttendanceHistory } from '@/features/attendance/AttendanceComponents';

export default function AttendancePage() {
    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
            <div className="flex-1 flex flex-col justify-center">
                <AttendanceCheckIn />
            </div>

            <div className="w-full lg:w-[400px] xl:w-[450px]">
                <AttendanceHistory />
            </div>
        </div>
    );
}

import { redirect } from 'next/navigation';

export default function AttendanceIndexPage() {
    // Redirect to mark attendance for faculty, calendar for admins
    // This is a fallback - ideally navigation should go directly to the right page
    redirect('/campus/attendance/mark');
}

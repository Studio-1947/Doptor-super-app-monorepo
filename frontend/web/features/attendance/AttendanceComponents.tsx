"use client";

import { Card, Button } from '@doptor/shared';
import { MapPin, Clock, Calendar, ShieldCheck, History, XCircle, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export function AttendanceCheckIn() {
    const [currentTime, setCurrentTime] = useState<string>('');
    const [isCheckedIn, setIsCheckedIn] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col gap-6 max-w-md mx-auto w-full">
            <Card className="p-6 text-center border-slate-200 shadow-sm">
                <div className="mb-2 text-slate-500 font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                <div className="text-5xl font-bold text-slate-900 mb-8 font-mono">{currentTime}</div>

                <div className="flex justify-center mb-8">
                    <button
                        onClick={() => setIsCheckedIn(!isCheckedIn)}
                        className={`w-48 h-48 rounded-full flex flex-col items-center justify-center gap-2 border-8 transition-all shadow-lg active:scale-95 ${isCheckedIn
                            ? 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100/50'
                            : 'bg-primary-50 border-primary-100 text-primary-600 hover:bg-primary-100/50 hover:shadow-primary-500/20'
                            }`}
                    >
                        {isCheckedIn ? <XCircle size={48} /> : <ShieldCheck size={48} />}
                        <span className="font-bold text-lg">{isCheckedIn ? 'Check Out' : 'Check In'}</span>
                    </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-slate-500 bg-slate-50 py-2 px-4 rounded-full inline-flex mx-auto">
                    <MapPin size={16} className="text-primary-500" />
                    <span>Office Location • <span className="text-green-600 font-medium">Inside Geo-Fence</span></span>
                </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 flex flex-col items-center justify-center gap-1">
                    <span className="text-xs text-slate-500 uppercase font-medium">Check In</span>
                    <span className="text-xl font-bold text-slate-900">09:12 AM</span>
                    <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">On Time</span>
                </Card>
                <Card className="p-4 flex flex-col items-center justify-center gap-1">
                    <span className="text-xs text-slate-500 uppercase font-medium">Check Out</span>
                    <span className="text-xl font-bold text-slate-400">--:--</span>
                    <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">Pending</span>
                </Card>
            </div>
        </div>
    );
}

const HISTORY = [
    { id: 1, date: 'Oct 23, Mon', checkIn: '09:05 AM', checkOut: '06:15 PM', status: 'Present', duration: '9h 10m' },
    { id: 2, date: 'Oct 22, Sun', checkIn: '--:--', checkOut: '--:--', status: 'Weekly Off', duration: '-' },
    { id: 3, date: 'Oct 21, Sat', checkIn: '09:30 AM', checkOut: '02:00 PM', status: 'Half Day', duration: '4h 30m' },
    { id: 4, date: 'Oct 20, Fri', checkIn: '09:00 AM', checkOut: '06:00 PM', status: 'Present', duration: '9h 00m' },
];

export function AttendanceHistory() {
    return (
        <Card className="h-full flex flex-col p-0 overflow-hidden shadow-none md:shadow-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <History size={18} />
                    <h3>Attendance History</h3>
                </div>
                <Button variant="secondary" size="sm">View Calendar</Button>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto">
                {HISTORY.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-900">{item.date}</span>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${item.status === 'Present' ? 'bg-green-100 text-green-700' :
                                item.status === 'Weekly Off' ? 'bg-slate-100 text-slate-500' :
                                    'bg-amber-100 text-amber-700'
                                }`}>{item.status}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-500">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500" /> {item.checkIn}</span>
                                <span className="flex items-center gap-1.5"><XCircle size={14} className="text-red-500" /> {item.checkOut}</span>
                            </div>
                            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{item.duration}</span>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

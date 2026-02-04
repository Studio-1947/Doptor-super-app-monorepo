'use client';

import { motion } from 'framer-motion';
import { Clock, MapPin } from 'lucide-react';
import { CampusClass } from '../../services/campus.service';

interface TimeTableProps {
    classes: CampusClass[];
    onClassClick: (cls: CampusClass) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TimeTable({ classes, onClassClick }: TimeTableProps) {
    // Simple grouping by day
    const getClassesForDay = (day: string) => {
        return classes.filter(c => c.schedule.some(s => s.day === day))
            .sort((a, b) => {
                const timeA = a.schedule.find(s => s.day === day)?.startTime || '';
                const timeB = b.schedule.find(s => s.day === day)?.startTime || '';
                return timeA.localeCompare(timeB);
            });
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Weekly Schedule</h3>
            </div>
            <div className="flex-1 overflow-x-auto">
                <div className="min-w-[800px] grid grid-cols-5 divide-x divide-slate-100 h-full min-h-[400px]">
                    {DAYS.map(day => (
                        <div key={day} className="flex flex-col">
                            <div className="p-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                                {day.slice(0, 3)}
                            </div>
                            <div className="p-2 space-y-2 flex-1 bg-slate-50/10">
                                {getClassesForDay(day).map(cls => {
                                    const schedule = cls.schedule.find(s => s.day === day);
                                    return (
                                        <motion.div
                                            key={cls.id + day}
                                            whileHover={{ y: -2 }}
                                            onClick={() => onClassClick(cls)}
                                            className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <p className="font-bold text-indigo-900 text-sm truncate">{cls.course.code}</p>
                                            <p className="text-xs text-indigo-700 truncate mb-2">{cls.course.name}</p>
                                            <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-medium">
                                                <Clock size={10} />
                                                {schedule?.startTime} - {schedule?.endTime}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-indigo-500 mt-0.5">
                                                <MapPin size={10} />
                                                {cls.location}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                {getClassesForDay(day).length === 0 && (
                                    <div className="h-full flex items-center justify-center">
                                        {/* <div className="text-slate-300 text-2xl font-bold opacity-20">Free</div> */}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

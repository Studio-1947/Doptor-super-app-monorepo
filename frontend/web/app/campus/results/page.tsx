'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card } from '@doptor/shared';
import { Download, BarChart3, ShieldCheck, Award, ArrowRight } from 'lucide-react';
import { ReadyUI } from '@/components/ReadyUI';

interface ResultRow {
  exam: string;
  className: string;
  average: string;
  passRate: string;
  status: string;
}

interface SummaryCard {
  label: string;
  value: string;
  icon: typeof Award;
}

const initialResults: ResultRow[] = [
  { exam: 'Midterm 1', className: 'CS 101', average: '89%', passRate: '96%', status: 'Published' },
  { exam: 'Semester 1', className: 'KS 204', average: '82%', passRate: '90%', status: 'Review Pending' },
  { exam: 'Final Exam', className: 'EE 309', average: '77%', passRate: '88%', status: 'Draft' },
  { exam: 'Lab Assessment', className: 'PH 112', average: '91%', passRate: '98%', status: 'Published' },
];

const initialSummary: SummaryCard[] = [
  { label: 'Published Results', value: '18', icon: Award },
  { label: 'Pending Reviews', value: '3', icon: ShieldCheck },
  { label: 'Top GPA', value: '4.0', icon: BarChart3 },
  { label: 'Upcoming Release', value: 'Friday', icon: Download },
];

export default function CampusResultsPage() {
  const [loading, setLoading] = useState(true);
  const [resultRows, setResultRows] = useState<ResultRow[]>([]);
  const [summaryCards, setSummaryCards] = useState<SummaryCard[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setResultRows(initialResults);
      setSummaryCards(initialSummary);
      setLoading(false);
    }, 600);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <ReadyUI
      title="Exam Results"
      description="Track grade publication status, review performance trends, and download result reports for your campus."
      moduleName="Campus"
      primaryAction={{ label: 'Download Summary', icon: Download }}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {(loading ? initialSummary : summaryCards).map(card => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] font-black text-slate-500 dark:text-slate-400">
                        {card.label}
                      </p>
                      <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                        {loading ? <span className="inline-block h-10 w-20 rounded-none bg-slate-200 dark:bg-slate-800" /> : card.value}
                      </p>
                    </div>
                    <div className="p-3 rounded-none bg-slate-100 dark:bg-slate-950/30 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                      <Icon size={20} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] font-black text-slate-500 dark:text-slate-400">Result Insights</p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Campus performance snapshot</h3>
              </div>
            </div>
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-none border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/40">
                    <div className="h-4 w-3/4 rounded-none bg-slate-200 dark:bg-slate-800 mb-2" />
                    <div className="h-3 w-full rounded-none bg-slate-200 dark:bg-slate-800" />
                  </div>
                ))
              ) : (
                <>
                  <div className="rounded-none border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/40">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Top performing discipline</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Applied Sciences — average score 92%</p>
                  </div>
                  <div className="rounded-none border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/40">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Performance uplift</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">+6% average improvement compared to last exam.</p>
                  </div>
                  <div className="rounded-none border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/40">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Review focus</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Strengthen lab application in engineering sections.</p>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Result summary</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Review published and pending exam outcomes across your academic units.</p>
            </div>
            <Link href="/campus/attendance/reports" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 hover:underline">
              Review attendance reports <ArrowRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3 uppercase tracking-[0.2em]">Exam</th>
                  <th className="px-4 py-3 uppercase tracking-[0.2em]">Class</th>
                  <th className="px-4 py-3 uppercase tracking-[0.2em]">Average</th>
                  <th className="px-4 py-3 uppercase tracking-[0.2em]">Pass Rate</th>
                  <th className="px-4 py-3 uppercase tracking-[0.2em]">Status</th>
                </tr>
              </thead>
              <tbody>
                {(loading ? Array.from({ length: 4 }).map((_, index) => ({
                  exam: '',
                  className: '',
                  average: '',
                  passRate: '',
                  status: 'Loading',
                })) : resultRows).map((row, index) => {
                  const isPlaceholder = loading;
                  return (
                    <tr key={`${row.exam || 'placeholder'}-${row.className || index}`} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/50 transition">
                      <td className="px-4 py-4 text-slate-900 dark:text-white font-semibold">
                        {isPlaceholder ? <div className="h-4 w-32 rounded-none bg-slate-200 dark:bg-slate-800" /> : row.exam}
                      </td>
                      <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                        {isPlaceholder ? <div className="h-4 w-28 rounded-none bg-slate-200 dark:bg-slate-800" /> : row.className}
                      </td>
                      <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                        {isPlaceholder ? <div className="h-4 w-16 rounded-none bg-slate-200 dark:bg-slate-800" /> : row.average}
                      </td>
                      <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                        {isPlaceholder ? <div className="h-4 w-16 rounded-none bg-slate-200 dark:bg-slate-800" /> : row.passRate}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center rounded-none px-2 py-1 text-[10px] font-black uppercase tracking-[0.28em] ${row.status === 'Published' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : row.status === 'Review Pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' : row.status === 'Draft' ? 'bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-300'}`}>
                          {isPlaceholder ? 'Loading' : row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </ReadyUI>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@doptor/shared';
import { Download, BarChart3, ShieldCheck, Award, Users } from 'lucide-react';
import { ReadyUI } from '@/components/ReadyUI';
import { campusService, ResultRow, ResultsSummaryResponse } from '@/services/campus.service';

export default function CampusResultsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ResultsSummaryResponse | null>(null);

  useEffect(() => {
    campusService
      .getResultsSummary()
      .then(setData)
      .catch(() => setData({ summary: { publishedCount: 0, draftCount: 0, highestAverage: null, totalStudentsGraded: 0 }, rows: [] }))
      .finally(() => setLoading(false));
  }, []);

  const summaryCards = [
    { label: 'Published Results', value: data ? String(data.summary.publishedCount) : '-', icon: Award },
    { label: 'Draft Exams', value: data ? String(data.summary.draftCount) : '-', icon: ShieldCheck },
    { label: 'Highest Average', value: data?.summary.highestAverage != null ? `${data.summary.highestAverage}%` : '—', icon: BarChart3 },
    { label: 'Students Graded', value: data ? String(data.summary.totalStudentsGraded) : '-', icon: Users },
  ];

  const rows: ResultRow[] = data?.rows ?? [];

  return (
    <ReadyUI
      title="Exam Results"
      description="Track grade publication status and review performance across your campus."
      moduleName="Campus"
      primaryAction={{ label: 'Download Summary', icon: Download }}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {summaryCards.map(card => {
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

        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Result summary</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Review published and draft exam outcomes across your classes.</p>
            </div>
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
                {loading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <tr key={index} className="border-b border-slate-200 dark:border-slate-800">
                      <td className="px-4 py-4"><div className="h-4 w-32 rounded-none bg-slate-200 dark:bg-slate-800" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-28 rounded-none bg-slate-200 dark:bg-slate-800" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-16 rounded-none bg-slate-200 dark:bg-slate-800" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-16 rounded-none bg-slate-200 dark:bg-slate-800" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-20 rounded-none bg-slate-200 dark:bg-slate-800" /></td>
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                      No exams recorded yet.
                    </td>
                  </tr>
                ) : rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/50 transition">
                    <td className="px-4 py-4 text-slate-900 dark:text-white font-semibold">{row.exam}</td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">{row.className}</td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">{row.average != null ? `${row.average}%` : '—'}</td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300">{row.passRate != null ? `${row.passRate}%` : '—'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-none px-2 py-1 text-[10px] font-black uppercase tracking-[0.28em] ${row.status === 'published' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-300'}`}>
                        {row.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </ReadyUI>
  );
}

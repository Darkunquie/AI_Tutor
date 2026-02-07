'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface ErrorAnalysisProps {
  errorBreakdown: {
    GRAMMAR: number;
    VOCABULARY: number;
    STRUCTURE: number;
    FLUENCY: number;
  };
}

const COLORS: Record<string, string> = {
  GRAMMAR: '#3c83f6',
  VOCABULARY: '#f59e0b',
  STRUCTURE: '#10b981',
  FLUENCY: '#8b5cf6',
};

const LABELS: Record<string, string> = {
  GRAMMAR: 'Grammar',
  VOCABULARY: 'Vocabulary',
  STRUCTURE: 'Structure',
  FLUENCY: 'Fluency',
};

export function ErrorAnalysis({ errorBreakdown }: ErrorAnalysisProps) {
  const data = Object.entries(errorBreakdown)
    .map(([key, value]) => ({
      name: LABELS[key],
      value,
      color: COLORS[key],
    }))
    .filter((d) => d.value > 0);

  const total = Object.values(errorBreakdown).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Error Breakdown
        </h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-emerald-500">celebration</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-bold">No errors recorded!</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Keep up the great work</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
        Error Breakdown
      </h3>

      {/* Donut chart with center label */}
      <div className="relative h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '8px 14px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value) => [`${value} errors`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black text-slate-900 dark:text-white">{total}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2.5">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">{item.name}</span>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

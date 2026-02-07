'use client';

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface ProgressData {
  date: string;
  sessions: number;
  duration: number;
  score: number;
  fillerWords: number;
}

interface ProgressChartProps {
  data: ProgressData[];
}

export function ProgressChart({ data }: ProgressChartProps) {
  const filteredData = data.filter((d) => d.sessions > 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (filteredData.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Performance Over Time
          </h3>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3c83f6]" />
              Speaking
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              Listening
            </span>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-slate-400">trending_up</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">No data to display yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Complete some sessions to see your progress</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Performance Over Time
        </h3>
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3c83f6]" />
            Score
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
            Sessions
          </span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3c83f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3c83f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '12px 16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
              labelFormatter={(label) => formatDate(String(label))}
            />
            <Area
              type="monotone"
              dataKey="score"
              name="Score"
              stroke="#3c83f6"
              strokeWidth={2.5}
              fill="url(#scoreGradient)"
              dot={{ fill: '#3c83f6', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: '#3c83f6', strokeWidth: 2, fill: 'white' }}
            />
            <Area
              type="monotone"
              dataKey="sessions"
              name="Sessions"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#sessionsGradient)"
              dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2, fill: 'white' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

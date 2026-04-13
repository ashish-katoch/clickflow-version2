import React, { useState, useEffect, useCallback } from 'react';
import { getDashboardStats } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { ListChecks, Timer, Target, TrendUp, Warning, FolderOpen, CheckCircle, Clock } from '@phosphor-icons/react';

const PRIORITY_COLORS = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-blue-400',
};

const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <div className="p-8 text-slate-500" data-testid="dashboard-loading">Loading dashboard...</div>;
  if (!stats) return <div className="p-8 text-slate-500">Failed to load dashboard</div>;

  const completionRate = stats.total_tasks > 0 ? Math.round((stats.done_tasks / stats.total_tasks) * 100) : 0;

  return (
    <div className="p-6 md:p-8 space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your workspace activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<ListChecks size={20} weight="duotone" />} label="Total Tasks" value={stats.total_tasks} color="bg-blue-50 text-blue-700" />
        <StatCard icon={<CheckCircle size={20} weight="duotone" />} label="Completed" value={stats.done_tasks} color="bg-emerald-50 text-emerald-700" />
        <StatCard icon={<FolderOpen size={20} weight="duotone" />} label="Projects" value={stats.total_projects} color="bg-violet-50 text-violet-700" />
        <StatCard icon={<Timer size={20} weight="duotone" />} label="Time Today" value={formatDuration(stats.total_time_today)} color="bg-amber-50 text-amber-700" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Completion Rate */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-2">
              <TrendUp size={16} weight="duotone" /> Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>{completionRate}%</div>
            <Progress value={completionRate} className="mt-3 h-2" />
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>{stats.done_tasks} done</span>
              <span>{stats.total_tasks} total</span>
            </div>
          </CardContent>
        </Card>

        {/* Task Status Breakdown */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-500">Task Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: 'todo', count: stats.todo_tasks, color: 'bg-slate-300' },
              { key: 'in_progress', count: stats.in_progress, color: 'bg-blue-500' },
              { key: 'in_review', count: stats.in_review, color: 'bg-amber-400' },
              { key: 'done', count: stats.done_tasks, color: 'bg-emerald-500' },
            ].map(s => (
              <div key={s.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <span className="text-sm text-slate-700">{STATUS_LABELS[s.key]}</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">{s.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-500">By Priority</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.priority_breakdown).map(([key, count]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${PRIORITY_COLORS[key]}`} />
                  <span className="text-sm text-slate-700 capitalize">{key}</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Overdue Alert */}
        {stats.overdue_tasks > 0 && (
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <Warning size={24} weight="duotone" className="text-red-500" />
              <div>
                <div className="text-sm font-semibold text-red-800">{stats.overdue_tasks} overdue task{stats.overdue_tasks > 1 ? 's' : ''}</div>
                <div className="text-xs text-red-600">Tasks past their due date</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Goals */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Target size={20} weight="duotone" className="text-amber-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">{stats.total_goals} Active Goals</div>
              <div className="text-xs text-slate-500">Track your team's objectives</div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card className="border-slate-200 shadow-sm md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-2">
              <Clock size={16} weight="duotone" /> Recent Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recent_tasks.length === 0 ? (
              <p className="text-sm text-slate-400">No tasks yet. Create your first project!</p>
            ) : (
              <div className="space-y-2">
                {stats.recent_tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${task.status === 'done' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                      <span className="text-sm text-slate-800">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.priority !== 'none' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full text-white ${PRIORITY_COLORS[task.priority] || 'bg-slate-400'}`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <Card className="border-slate-200 shadow-sm" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <CardContent className="p-4">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
          {icon}
        </div>
        <div className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>{value}</div>
        <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}

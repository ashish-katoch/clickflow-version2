import React, { useMemo } from 'react';
import { Flag } from '@phosphor-icons/react';

const STATUS_COLORS = {
  todo: '#94a3b8', in_progress: '#3b82f6', in_review: '#f59e0b', done: '#10b981',
};
const PRIORITY_BORDER = {
  urgent: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6', none: '#e2e8f0',
};

export default function TaskGanttView({ tasks, onSelect }) {
  const today = useMemo(() => new Date(), []);

  const { startBound, endBound, totalDays, taskBars } = useMemo(() => {
    const tasksWithDates = tasks.filter(t => t.due_date || t.start_date);
    if (tasksWithDates.length === 0) {
      const s = new Date(today); s.setDate(s.getDate() - 7);
      const e = new Date(today); e.setDate(e.getDate() + 30);
      return { startBound: s, endBound: e, totalDays: 37, taskBars: [] };
    }
    let minDate = new Date(today), maxDate = new Date(today);
    tasksWithDates.forEach(t => {
      const sd = t.start_date ? new Date(t.start_date) : (t.due_date ? new Date(new Date(t.due_date).getTime() - 7 * 86400000) : null);
      const ed = t.due_date ? new Date(t.due_date) : (t.start_date ? new Date(new Date(t.start_date).getTime() + 7 * 86400000) : null);
      if (sd && sd < minDate) minDate = sd;
      if (ed && ed > maxDate) maxDate = ed;
    });
    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 7);
    const total = Math.max(14, Math.ceil((maxDate - minDate) / 86400000));

    const bars = tasks.map(t => {
      const sd = t.start_date ? new Date(t.start_date) : (t.due_date ? new Date(new Date(t.due_date).getTime() - 5 * 86400000) : null);
      const ed = t.due_date ? new Date(t.due_date) : (t.start_date ? new Date(new Date(t.start_date).getTime() + 5 * 86400000) : null);
      if (!sd || !ed) return null;
      const startOffset = Math.max(0, (sd - minDate) / 86400000);
      const duration = Math.max(1, (ed - sd) / 86400000);
      return { ...t, startOffset, duration, startDate: sd, endDate: ed };
    }).filter(Boolean);

    return { startBound: minDate, endBound: maxDate, totalDays: total, taskBars: bars };
  }, [tasks, today]);

  // Generate date headers
  const dateHeaders = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startBound);
    d.setDate(d.getDate() + i);
    dateHeaders.push(d);
  }

  const todayOffset = Math.max(0, (today - startBound) / 86400000);
  const dayWidth = 40;

  if (taskBars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400" data-testid="gantt-empty">
        <p className="text-sm">Add start dates and due dates to tasks to see the Gantt chart.</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto p-4" data-testid="task-gantt-view">
      <div style={{ minWidth: totalDays * dayWidth + 220 }}>
        {/* Header row */}
        <div className="flex border-b border-slate-200">
          <div className="w-[220px] flex-shrink-0 px-3 py-2 text-xs uppercase tracking-wide font-semibold text-slate-500 bg-slate-50 border-r border-slate-200">
            Task
          </div>
          <div className="flex">
            {dateHeaders.map((d, i) => {
              const isToday = d.toDateString() === today.toDateString();
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <div key={i} className={`text-center border-r border-slate-100 ${isWeekend ? 'bg-slate-50' : ''} ${isToday ? 'bg-blue-50' : ''}`} style={{ width: dayWidth, minWidth: dayWidth }}>
                  <div className="text-[9px] text-slate-400 uppercase">{d.toLocaleDateString('en', { weekday: 'short' })}</div>
                  <div className={`text-[10px] ${isToday ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>{d.getDate()}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task rows */}
        {taskBars.map(bar => (
          <div key={bar.id} className="flex border-b border-slate-100 hover:bg-slate-50 cursor-pointer group" onClick={() => onSelect(bar)}>
            <div className="w-[220px] flex-shrink-0 px-3 py-2.5 border-r border-slate-200 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[bar.status] }} />
              <span className="text-xs text-slate-800 truncate font-medium">{bar.title}</span>
            </div>
            <div className="relative flex-1" style={{ height: 36 }}>
              {/* Bar */}
              <div
                className="absolute top-1.5 h-5 rounded-sm transition-all group-hover:brightness-95"
                style={{
                  left: bar.startOffset * dayWidth,
                  width: Math.max(dayWidth, bar.duration * dayWidth),
                  backgroundColor: STATUS_COLORS[bar.status],
                  borderLeft: `3px solid ${PRIORITY_BORDER[bar.priority]}`,
                  opacity: 0.85,
                }}
              >
                <span className="text-[9px] text-white font-medium px-1.5 truncate block leading-5">
                  {bar.title}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Today line */}
        <div className="absolute top-0 bottom-0 w-px bg-red-400 z-10 pointer-events-none" style={{ left: 220 + todayOffset * dayWidth }} />
      </div>
    </div>
  );
}

import React, { useMemo } from 'react';
import { Flag, CalendarBlank, ArrowRight } from '@phosphor-icons/react';

const STATUS_COLORS = {
  todo: 'bg-slate-400', in_progress: 'bg-blue-500', in_review: 'bg-amber-400', done: 'bg-emerald-500',
};
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' };
const PRIORITY_DOT = { urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-amber-400', low: 'bg-blue-400', none: 'bg-slate-300' };

export default function TaskTimelineView({ tasks, onSelect }) {
  const groupedByDate = useMemo(() => {
    const groups = {};
    const sorted = [...tasks].sort((a, b) => {
      const dateA = a.due_date || a.created_at;
      const dateB = b.due_date || b.created_at;
      return new Date(dateA) - new Date(dateB);
    });
    sorted.forEach(t => {
      const dateKey = t.due_date || t.created_at?.split('T')[0] || 'No Date';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return groups;
  }, [tasks]);

  const dateKeys = Object.keys(groupedByDate);

  if (dateKeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400" data-testid="timeline-empty">
        <p className="text-sm">No tasks to display on the timeline.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-0" data-testid="task-timeline-view">
      {dateKeys.map((dateKey, groupIdx) => {
        const isOverdue = dateKey !== 'No Date' && new Date(dateKey) < new Date() && groupedByDate[dateKey].some(t => t.status !== 'done');
        const dateLabel = dateKey === 'No Date' ? 'Unscheduled' : new Date(dateKey).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

        return (
          <div key={dateKey} className="flex" data-testid={`timeline-group-${dateKey}`}>
            {/* Timeline stem */}
            <div className="flex flex-col items-center mr-4">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isOverdue ? 'bg-red-500' : 'bg-blue-700'} ring-4 ${isOverdue ? 'ring-red-100' : 'ring-blue-100'}`} />
              {groupIdx < dateKeys.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 min-h-[40px]" />}
            </div>

            {/* Content */}
            <div className="pb-6 flex-1">
              <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                {dateLabel}
                {isOverdue && <span className="ml-2 text-red-500 normal-case">Overdue</span>}
              </div>
              <div className="space-y-1.5">
                {groupedByDate[dateKey].map(task => (
                  <div
                    key={task.id}
                    onClick={() => onSelect(task)}
                    className="flex items-center gap-3 bg-white border border-slate-200 rounded-md px-3 py-2 hover:border-blue-300 hover:-translate-y-0.5 cursor-pointer transition-all shadow-sm"
                    data-testid={`timeline-task-${task.id}`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]} text-white`}>
                      {STATUS_LABELS[task.status]}
                    </span>
                    {task.start_date && task.due_date && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                        {new Date(task.start_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        <ArrowRight size={8} />
                        {new Date(task.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import React from 'react';
import { Flag, CalendarBlank, User } from '@phosphor-icons/react';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'bg-slate-400' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { key: 'in_review', label: 'In Review', color: 'bg-amber-400' },
  { key: 'done', label: 'Done', color: 'bg-emerald-500' },
];

const PRIORITY_DOT = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-blue-400',
};

export default function TaskBoardView({ tasks, onUpdate, onSelect }) {
  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task.id);
    e.currentTarget.classList.add('kanban-card-dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('kanban-card-dragging');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-slate-200');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-slate-200');
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-slate-200');
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onUpdate(taskId, { status });
    }
  };

  return (
    <div className="flex gap-4 p-4 overflow-x-auto h-full" data-testid="task-board-view">
      {COLUMNS.map(col => {
        const columnTasks = tasks.filter(t => t.status === col.key);
        return (
          <div
            key={col.key}
            className="flex-shrink-0 w-72 flex flex-col"
            data-testid={`board-column-${col.key}`}
          >
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
              <span className="text-xs uppercase tracking-wide font-semibold text-slate-600">{col.label}</span>
              <span className="text-xs text-slate-400 bg-slate-200 px-1.5 rounded-full">{columnTasks.length}</span>
            </div>

            {/* Column Body */}
            <div
              className="flex-1 bg-slate-100 rounded-lg p-2 space-y-2 min-h-[200px] transition-colors"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              {columnTasks.map(task => (
                <div
                  key={task.id}
                  data-testid={`board-card-${task.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelect(task)}
                  className="bg-white border border-slate-200 shadow-sm rounded-md p-3 hover:border-blue-300 cursor-grab active:cursor-grabbing transition-colors"
                >
                  <div className="text-sm font-medium text-slate-900 mb-2">{task.title}</div>
                  {task.description && (
                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {task.priority !== 'none' && (
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                          <span className="text-[10px] text-slate-500 capitalize">{task.priority}</span>
                        </div>
                      )}
                      {task.due_date && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <CalendarBlank size={10} />
                          {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                      <User size={10} className="text-slate-500" />
                    </div>
                  </div>
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {columnTasks.length === 0 && (
                <div className="flex items-center justify-center h-20 text-xs text-slate-400">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

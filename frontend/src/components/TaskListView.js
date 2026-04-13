import React from 'react';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { CalendarBlank, Flag, User } from '@phosphor-icons/react';

const PRIORITY_COLORS = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-400 text-slate-900',
  low: 'bg-blue-400 text-white',
  none: 'bg-slate-200 text-slate-500',
};

const STATUS_STYLES = {
  todo: 'bg-slate-200 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-800',
  in_review: 'bg-amber-100 text-amber-800',
  done: 'bg-emerald-100 text-emerald-800',
};

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' };

export default function TaskListView({ tasks, subtasks = [], onUpdate, onSelect, onDelete }) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400" data-testid="empty-task-list">
        <p className="text-sm">No tasks yet. Click "Add Task" to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white" data-testid="task-list-view">
      {/* Header */}
      <div className="grid grid-cols-12 px-4 py-2 border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide font-semibold text-slate-500">
        <div className="col-span-5">Task</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Priority</div>
        <div className="col-span-2">Due Date</div>
        <div className="col-span-1">Assignee</div>
      </div>

      {/* Task Rows */}
      {tasks.map(task => {
        const taskSubtasks = subtasks.filter(s => s.parent_task_id === task.id);
        return (
          <React.Fragment key={task.id}>
            <div
              data-testid={`task-row-${task.id}`}
              className="grid grid-cols-12 px-4 py-2.5 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors items-center group"
              onClick={() => onSelect(task)}
            >
              <div className="col-span-5 flex items-center gap-3">
                <Checkbox
                  data-testid={`task-check-${task.id}`}
                  checked={task.status === 'done'}
                  onCheckedChange={(checked) => {
                    onUpdate(task.id, { status: checked ? 'done' : 'todo' });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="border-slate-300"
                />
                <div>
                  <span className={`text-sm ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {task.title}
                  </span>
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex gap-1 mt-0.5">
                      {task.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                  {taskSubtasks.length > 0 && (
                    <span className="text-[10px] text-slate-400 ml-1">({taskSubtasks.filter(s => s.status === 'done').length}/{taskSubtasks.length} subtasks)</span>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <Badge variant="secondary" className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[task.status]}`}>
                  {STATUS_LABELS[task.status]}
                </Badge>
              </div>
              <div className="col-span-2">
                {task.priority !== 'none' && (
                  <Badge className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                    <Flag size={10} weight="fill" className="mr-0.5" /> {task.priority}
                  </Badge>
                )}
              </div>
              <div className="col-span-2">
                {task.due_date && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <CalendarBlank size={12} />
                    {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              <div className="col-span-1">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                  <User size={12} className="text-slate-500" />
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

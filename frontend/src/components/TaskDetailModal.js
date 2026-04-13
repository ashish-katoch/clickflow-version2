import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Checkbox } from '../components/ui/checkbox';
import { startTimer, stopTimer, getActiveTimer, getTimeEntries } from '../lib/api';
import { X, Trash, Play, Stop, Clock, Flag, CalendarBlank, Tag, ListPlus, Timer } from '@phosphor-icons/react';

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

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TaskDetailModal({ task, subtasks = [], onClose, onUpdate, onDelete, projectId, onCreateSubtask }) {
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [timeEntries, setTimeEntries] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);

  useEffect(() => {
    const fetchTimerData = async () => {
      try {
        const [active, entries] = await Promise.all([
          getActiveTimer(),
          getTimeEntries({ task_id: task.id })
        ]);
        if (active && active.task_id === task.id) {
          setActiveTimer(active);
        }
        setTimeEntries(entries);
      } catch (e) { console.error(e); }
    };
    fetchTimerData();
  }, [task.id]);

  useEffect(() => {
    if (!activeTimer) { setElapsed(0); return; }
    const start = new Date(activeTimer.start_time).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const handleStartTimer = async () => {
    try {
      const entry = await startTimer({ task_id: task.id });
      setActiveTimer(entry);
    } catch (e) { console.error(e); }
  };

  const handleStopTimer = async () => {
    try {
      const entry = await stopTimer();
      setActiveTimer(null);
      setTimeEntries([entry, ...timeEntries]);
    } catch (e) { console.error(e); }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    await onCreateSubtask({ title: newSubtask, status: 'todo', priority: 'none' });
    setNewSubtask('');
    setShowSubtaskInput(false);
  };

  const totalTracked = timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0) + (activeTimer ? elapsed : 0);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" data-testid="task-detail-modal">
        <DialogHeader className="pr-8">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[task.status]}`}>
              {task.status.replace('_', ' ')}
            </Badge>
            {task.priority !== 'none' && (
              <Badge className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                <Flag size={10} weight="fill" className="mr-0.5" /> {task.priority}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Description */}
          {task.description && (
            <div>
              <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Description</Label>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Status</Label>
              <Select value={task.status} onValueChange={(v) => onUpdate(task.id, { status: v })}>
                <SelectTrigger className="mt-1 border-slate-200 h-9" data-testid="detail-status-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Priority</Label>
              <Select value={task.priority} onValueChange={(v) => onUpdate(task.id, { priority: v })}>
                <SelectTrigger className="mt-1 border-slate-200 h-9" data-testid="detail-priority-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold flex items-center gap-1">
              <CalendarBlank size={12} /> Due Date
            </Label>
            <Input
              type="date"
              value={task.due_date || ''}
              onChange={(e) => onUpdate(task.id, { due_date: e.target.value || null })}
              className="mt-1 border-slate-200 h-9"
              data-testid="detail-duedate-input"
            />
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold flex items-center gap-1">
                <Tag size={12} /> Tags
              </Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {task.tags.map((tag, i) => (
                  <span key={i} className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          )}

          <Separator className="bg-slate-200" />

          {/* Time Tracking */}
          <div>
            <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold flex items-center gap-1 mb-2">
              <Timer size={12} /> Time Tracking
            </Label>
            <div className="flex items-center gap-3">
              {activeTimer && activeTimer.task_id === task.id ? (
                <>
                  <div className="text-lg font-mono font-bold text-blue-700" data-testid="timer-display">{formatDuration(elapsed)}</div>
                  <Button size="sm" variant="outline" onClick={handleStopTimer} className="border-red-200 text-red-600 hover:bg-red-50 gap-1" data-testid="stop-timer-btn">
                    <Stop size={14} weight="fill" /> Stop
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-sm text-slate-500">Total: {formatDuration(totalTracked)}</div>
                  <Button size="sm" variant="outline" onClick={handleStartTimer} className="border-blue-200 text-blue-700 hover:bg-blue-50 gap-1" data-testid="start-timer-btn">
                    <Play size={14} weight="fill" /> Start
                  </Button>
                </>
              )}
            </div>
            {timeEntries.length > 0 && (
              <div className="mt-2 space-y-1">
                {timeEntries.slice(0, 3).map(entry => (
                  <div key={entry.id} className="text-xs text-slate-400 flex items-center gap-2">
                    <Clock size={10} />
                    {formatDuration(entry.duration)}
                    <span className="text-slate-300">|</span>
                    {new Date(entry.start_time).toLocaleDateString()}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator className="bg-slate-200" />

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold flex items-center gap-1">
                <ListPlus size={12} /> Subtasks ({subtasks.length})
              </Label>
              <Button variant="ghost" size="sm" onClick={() => setShowSubtaskInput(true)} className="text-xs text-blue-700 h-6" data-testid="add-subtask-btn">
                + Add
              </Button>
            </div>
            {subtasks.map(sub => (
              <div key={sub.id} className="flex items-center gap-2 py-1.5">
                <Checkbox
                  checked={sub.status === 'done'}
                  onCheckedChange={(checked) => onUpdate(sub.id, { status: checked ? 'done' : 'todo' })}
                  className="border-slate-300"
                  data-testid={`subtask-check-${sub.id}`}
                />
                <span className={`text-sm ${sub.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{sub.title}</span>
              </div>
            ))}
            {showSubtaskInput && (
              <div className="flex gap-2 mt-2">
                <Input
                  value={newSubtask}
                  onChange={e => setNewSubtask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                  placeholder="Subtask name"
                  className="border-slate-200 h-8 text-sm"
                  data-testid="subtask-title-input"
                  autoFocus
                />
                <Button size="sm" onClick={handleAddSubtask} className="bg-blue-700 text-white h-8 text-xs" data-testid="save-subtask-btn">Add</Button>
              </div>
            )}
          </div>

          <Separator className="bg-slate-200" />

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" size="sm" onClick={() => onDelete(task.id)} className="border-red-200 text-red-600 hover:bg-red-50 gap-1" data-testid="delete-task-btn">
              <Trash size={14} /> Delete Task
            </Button>
            <div className="text-xs text-slate-400">
              Created {new Date(task.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

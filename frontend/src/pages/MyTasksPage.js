import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getMyTasks, getMembers } from '../lib/api';
import { CircleDashed, Loader2, CheckCircle2 } from 'lucide-react';

const STATUS_ICON = { backlog: CircleDashed, in_progress: Loader2, completed: CheckCircle2 };
const STATUS_COLOR = { backlog: 'text-zinc-500', in_progress: 'text-amber-500', completed: 'text-emerald-500' };
const PRIORITY_DOT = { urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-amber-400', low: 'bg-blue-400' };

export default function MyTasksPage() {
  const { setDetailPanel } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try { const [t, m] = await Promise.all([getMyTasks(), getMembers()]); setTasks(t); setMembers(m); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="p-6 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="p-6" data-testid="my-tasks-page">
      <h1 className="text-xl font-bold tracking-tight text-foreground mb-1" style={{ fontFamily: 'Manrope' }}>My Tasks</h1>
      <p className="text-sm text-muted-foreground mb-5">{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you</p>
      {tasks.length === 0 ? <p className="text-sm text-muted-foreground text-center py-12">No tasks assigned to you</p> : (
        <div className="w-full space-y-0.5">
          {tasks.map(task => {
            const Icon = STATUS_ICON[task.status] || CircleDashed;
            return (
              <div key={task.id} onClick={() => setDetailPanel({ ...task, type: 'task', onRefresh: fetchData, members })}
                className="group flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent border-b border-border/50 transition-colors cursor-pointer"
                data-testid={`my-task-${task.id}`}>
                <Icon size={14} className={STATUS_COLOR[task.status]} />
                <span className="text-[10px] text-muted-foreground font-mono w-16">{task.key}</span>
                <span className="flex-1 text-sm text-foreground font-medium truncate">{task.title}</span>
                {task.project && <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">{task.project.name}</span>}
                <div className={`w-2.5 h-2.5 rounded-full ${PRIORITY_DOT[task.priority] || 'bg-zinc-400'}`} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

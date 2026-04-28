import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { getTasks, createTask, updateTask, getProject, getMembers } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Plus, CircleDashed, Loader2, CheckCircle2, MessageSquare, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const COLUMNS = [
  { key: 'backlog', label: 'Backlog', icon: CircleDashed, color: 'text-zinc-500' },
  { key: 'in_progress', label: 'In Progress', icon: Loader2, color: 'text-amber-500' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-500' },
];
const PRIORITY_DOT = { urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-amber-400', low: 'bg-blue-400' };

function getAvatarColor(name) {
  const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600', 'bg-violet-600'];
  return colors[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
}

export default function SprintBoardPage() {
  const { projectId } = useParams();
  const { setDetailPanel } = useOutletContext();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newAssignee, setNewAssignee] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterAssignee, setFilterAssignee] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const [t, p, m] = await Promise.all([getTasks({ project_id: projectId }), getProject(projectId), getMembers()]);
      setTasks(t); setProject(p); setMembers(m);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [projectId]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createTask(projectId, { title: newTitle, priority: newPriority, assignee_id: (newAssignee && newAssignee !== '__none__') ? newAssignee : null });
    setShowCreate(false); setNewTitle(''); setNewPriority('medium'); setNewAssignee('');
    fetchData();
  };

  const handleDrop = async (e, status) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-zinc-800/30');
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) { await updateTask(taskId, { status }); fetchData(); }
  };

  const openDetail = (task) => setDetailPanel({ ...task, type: 'task', onRefresh: fetchData, members });

  if (loading) return <div className="p-6 theme-text-muted text-sm">Loading...</div>;

  return (
    <div className="flex flex-col h-full" data-testid="sprint-board-page">
      <div className="px-6 py-3 border-b theme-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {project && <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: project.color }}>{project.key?.[0]}</div>}
          <h1 className="text-sm font-semibold" style={{ fontFamily: 'Manrope' }}>{project?.name || 'Project'}</h1>
          <span className="text-xs theme-text-muted">Sprint Board</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-1">
            <button onClick={() => setFilterAssignee('all')} data-testid="filter-all-tasks"
              className={`h-7 px-2.5 rounded text-xs font-medium transition-colors ${filterAssignee === 'all' ? 'theme-chip' : 'theme-text-muted'}`}>All</button>
            <button onClick={() => setFilterAssignee('me')} data-testid="filter-my-tasks"
              className={`h-7 px-2.5 rounded text-xs font-medium transition-colors ${filterAssignee === 'me' ? 'bg-indigo-500/15 text-indigo-400' : 'theme-text-muted'}`}>Assigned to me</button>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <button data-testid="create-task-btn" className="h-8 px-3 rounded-md theme-btn-primary text-sm font-medium flex items-center gap-1.5">
                <Plus size={14} /> New Task
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm theme-dropdown border">
              <DialogHeader><DialogTitle style={{ fontFamily: 'Manrope' }}>Create Task</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <input data-testid="task-title-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Task title"
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  className="flex h-9 w-full rounded-md border theme-border bg-transparent px-3 text-sm theme-text placeholder:theme-text-muted focus:outline-none focus:ring-1 focus:ring-zinc-400" />
                <div className="flex gap-2">
                  <Select value={newPriority} onValueChange={setNewPriority}>
                    <SelectTrigger className="flex-1 h-9 theme-border bg-transparent theme-text text-sm" data-testid="task-priority"><SelectValue /></SelectTrigger>
                    <SelectContent className="theme-dropdown border">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newAssignee || '__none__'} onValueChange={v => setNewAssignee(v === '__none__' ? '' : v)}>
                    <SelectTrigger className="flex-1 h-9 theme-border bg-transparent theme-text text-sm"><SelectValue placeholder="Assignee" /></SelectTrigger>
                    <SelectContent className="theme-dropdown border">
                      <SelectItem value="__none__">Unassigned</SelectItem>
                      {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <button data-testid="submit-task-btn" onClick={handleCreate} className="h-9 w-full rounded-md theme-btn-primary text-sm font-medium">Create</button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto p-4" data-testid="kanban-board">
        {COLUMNS.map(col => {
          const Icon = col.icon;
          const allColTasks = tasks.filter(t => t.status === col.key);
          const colTasks = filterAssignee === 'me' ? allColTasks.filter(t => t.assignee_id === user?.id) : allColTasks;
          return (
            <div key={col.key} className="w-[320px] flex-shrink-0 flex flex-col" data-testid={`column-${col.key}`}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Icon size={14} className={col.color} />
                <span className="text-xs font-semibold theme-text-secondary uppercase tracking-wide">{col.label}</span>
                <span className="text-[10px] theme-text-muted theme-chip px-1.5 rounded">{colTasks.length}</span>
              </div>
              <div className="flex-1 space-y-1.5 min-h-[100px] rounded-lg p-1 transition-colors"
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('bg-zinc-800/30'); }}
                onDragLeave={e => e.currentTarget.classList.remove('bg-zinc-800/30')}
                onDrop={e => handleDrop(e, col.key)}>
                {colTasks.map(task => {
                  const assignee = members.find(m => m.id === task.assignee_id);
                  return (
                    <div key={task.id} draggable onDragStart={e => e.dataTransfer.setData('taskId', task.id)}
                      onClick={() => openDetail(task)}
                      className="group flex flex-col gap-1.5 p-3 rounded-lg border theme-card transition-all cursor-pointer text-sm"
                      data-testid={`task-card-${task.id}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] theme-text-muted font-mono">{task.key}</span>
                        <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority] || 'bg-zinc-600'}`} title={task.priority} />
                      </div>
                      <div className="text-sm font-medium leading-snug">{task.title}</div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2 theme-text-muted">
                          {task.comment_count > 0 && <span className="flex items-center gap-0.5 text-[10px]"><MessageSquare size={10} />{task.comment_count}</span>}
                          {task.due_date && <span className="flex items-center gap-0.5 text-[10px]"><Calendar size={10} />{new Date(task.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>}
                        </div>
                        {assignee && (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${getAvatarColor(assignee.name)}`} title={assignee.name}>
                            <span className="text-[8px] font-bold text-white">{assignee.name?.[0]?.toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

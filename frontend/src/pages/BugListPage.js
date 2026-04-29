import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { getBugs, createBug, getProject, getMembers } from '../lib/api';
import { Plus, Bug } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const BUG_STATUSES = [
  { value: 'open', label: 'Open', dot: 'bg-red-500' },
  { value: 'in_progress', label: 'In Progress', dot: 'bg-amber-500' },
  { value: 'ready_for_qa', label: 'Ready for QA', dot: 'bg-blue-400' },
  { value: 'verified', label: 'Verified', dot: 'bg-emerald-500' },
  { value: 'closed', label: 'Closed', dot: 'bg-zinc-500' },
];
const PRIORITY_DOT = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-amber-400', low: 'bg-blue-400' };

function getAvatarColor(name) {
  const colors = ['bg-indigo-600','bg-emerald-600','bg-amber-600','bg-rose-600','bg-cyan-600','bg-violet-600'];
  return colors[(name||'').split('').reduce((a,c) => a + c.charCodeAt(0), 0) % colors.length];
}

export default function BugListPage() {
  const { projectId } = useParams();
  const { setDetailPanel } = useOutletContext();
  const [bugs, setBugs] = useState([]);
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newAssignee, setNewAssignee] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const params = { project_id: projectId };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPriority !== 'all') params.priority = filterPriority;
      if (filterAssignee !== 'all') params.assignee_id = filterAssignee;
      const [b, p, m] = await Promise.all([getBugs(params), getProject(projectId), getMembers()]);
      setBugs(b); setProject(p); setMembers(m);
    } catch {} finally { setLoading(false); }
  }, [projectId, filterStatus, filterPriority, filterAssignee]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createBug(projectId, { title: newTitle, description: newDesc, priority: newPriority, assignee_id: (newAssignee && newAssignee !== '__none__') ? newAssignee : null });
    setShowCreate(false); setNewTitle(''); setNewDesc(''); setNewPriority('medium'); setNewAssignee('');
    fetchData();
  };

  const openDetail = (bug) => setDetailPanel({ ...bug, type: 'bug', onRefresh: fetchData, members });

  if (loading) return <div className="p-6 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="flex flex-col h-full" data-testid="bug-list-page">
      <div className="px-6 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {project && <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: project.color }}>{project.key?.[0]}</div>}
          <h1 className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Manrope' }}>{project?.name}</h1>
          <span className="text-xs text-muted-foreground">QA Bugs</span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-7 text-xs w-[110px]" data-testid="filter-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {BUG_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-7 text-xs w-[110px]" data-testid="filter-priority"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="h-7 text-xs w-[130px]" data-testid="filter-assignee"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <button data-testid="report-bug-btn" className="h-8 px-3 rounded-md bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-medium hover:bg-red-500/20 transition-colors flex items-center gap-1.5">
                <Bug size={14} /> Report Bug
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle style={{ fontFamily: 'Manrope' }}>Report Bug</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <input data-testid="bug-title-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Bug title"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                <textarea data-testid="bug-desc-input" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description..." rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
                <div className="flex gap-2">
                  <Select value={newPriority} onValueChange={setNewPriority}>
                    <SelectTrigger className="flex-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newAssignee || '__none__'} onValueChange={v => setNewAssignee(v === '__none__' ? '' : v)}>
                    <SelectTrigger className="flex-1 h-9 text-sm" data-testid="bug-assignee-select"><SelectValue placeholder="Assign to..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Unassigned</SelectItem>
                      {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <button data-testid="submit-bug-btn" onClick={handleCreate} className="h-9 w-full rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors">Report</button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bug list */}
      <div className="flex-1 overflow-auto p-4">
        <div className="w-full">
          <div className="grid grid-cols-[70px_1fr_120px_100px_160px] px-4 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold border-b border-border">
            <div>ID</div>
            <div>Title</div>
            <div>Status</div>
            <div>Priority</div>
            <div>Assignee</div>
          </div>
          {bugs.length === 0 ? <p className="text-sm text-muted-foreground p-6 text-center">No bugs reported</p> : (
            <div className="flex flex-col mt-0.5">
              {bugs.map(bug => {
                const statusInfo = BUG_STATUSES.find(s => s.value === bug.status) || BUG_STATUSES[0];
                const assignee = members.find(m => m.id === bug.assignee_id);
                return (
                  <div key={bug.id} onClick={() => openDetail(bug)}
                    className="grid grid-cols-[70px_1fr_120px_100px_160px] items-center px-4 py-3 rounded-md hover:bg-accent border-b border-border/50 transition-colors cursor-pointer text-sm"
                    data-testid={`bug-row-${bug.id}`}>
                    <div className="text-[11px] text-muted-foreground font-mono">{bug.key}</div>
                    <div className="text-foreground font-medium truncate pr-4">{bug.title}</div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusInfo.dot}`} />
                      <span className="text-xs text-muted-foreground">{statusInfo.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[bug.priority] || 'bg-zinc-500'}`} />
                      <span className="text-xs text-muted-foreground capitalize">{bug.priority}</span>
                    </div>
                    <div>{assignee ? (
                      <div className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${getAvatarColor(assignee.name)}`}>
                          <span className="text-[8px] font-bold text-white">{assignee.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <span className="text-xs text-foreground">{assignee.name}</span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">Unassigned</span>}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

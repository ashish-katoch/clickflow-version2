import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { getBugs, createBug, getProject, getMembers } from '../lib/api';
import { Plus, Bug, AlertCircle } from 'lucide-react';
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

  const fetch = useCallback(async () => {
    try {
      const params = { project_id: projectId };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPriority !== 'all') params.priority = filterPriority;
      if (filterAssignee !== 'all') params.assignee_id = filterAssignee;
      const [b, p, m] = await Promise.all([getBugs(params), getProject(projectId), getMembers()]);
      setBugs(b); setProject(p); setMembers(m);
    } catch {} finally { setLoading(false); }
  }, [projectId, filterStatus, filterPriority, filterAssignee]);
  useEffect(() => { fetch(); }, [fetch]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createBug(projectId, { title: newTitle, description: newDesc, priority: newPriority, assignee_id: (newAssignee && newAssignee !== '__none__') ? newAssignee : null });
    setShowCreate(false); setNewTitle(''); setNewDesc(''); setNewPriority('medium'); setNewAssignee('');
    fetch();
  };

  const openDetail = (bug) => setDetailPanel({ ...bug, type: 'bug', onRefresh: fetch, members });

  if (loading) return <div className="p-6 text-zinc-500 text-sm">Loading...</div>;

  return (
    <div className="flex flex-col h-full" data-testid="bug-list-page">
      <div className="px-6 py-3 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {project && <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: project.color }}>{project.key?.[0]}</div>}
          <h1 className="text-sm font-semibold" style={{ fontFamily: 'Manrope' }}>{project?.name}</h1>
          <span className="text-xs text-zinc-600">QA Bugs</span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-7 text-xs border-zinc-800 bg-transparent text-zinc-400 w-[120px]" data-testid="filter-status"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="all">All Status</SelectItem>
              {BUG_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-7 text-xs border-zinc-800 bg-transparent text-zinc-400 w-[110px]" data-testid="filter-priority"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="h-7 text-xs border-zinc-800 bg-transparent text-zinc-400 w-[130px]" data-testid="filter-assignee"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="all">All Assignees</SelectItem>
              {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <button data-testid="report-bug-btn" className="h-8 px-3 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-medium hover:bg-red-500/20 transition-colors flex items-center gap-1.5">
                <Bug size={14} /> Report Bug
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
              <DialogHeader><DialogTitle className="text-zinc-50" style={{ fontFamily: 'Manrope' }}>Report Bug</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <input data-testid="bug-title-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Bug title"
                  className="flex h-9 w-full rounded-md border border-zinc-800 bg-transparent px-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400" />
                <textarea data-testid="bug-desc-input" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description..." rows={3}
                  className="flex w-full rounded-md border border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none" />
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger className="h-9 border-zinc-800 bg-transparent text-zinc-300 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newAssignee || '__none__'} onValueChange={v => setNewAssignee(v === '__none__' ? '' : v)}>
                  <SelectTrigger className="h-9 border-zinc-800 bg-transparent text-zinc-300 text-sm" data-testid="bug-assignee-select"><SelectValue placeholder="Assign to..." /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <button data-testid="submit-bug-btn" onClick={handleCreate} className="h-9 w-full rounded-md bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors">Report</button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bug list */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-5xl mx-auto">
          {/* Header row */}
          <div className="flex items-center gap-3 px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-600 font-semibold border-b border-zinc-800">
            <div className="w-20">ID</div>
            <div className="flex-1">Title</div>
            <div className="w-28">Status</div>
            <div className="w-20">Priority</div>
            <div className="w-24">Assignee</div>
          </div>
          {bugs.length === 0 ? <p className="text-sm text-zinc-600 p-6 text-center">No bugs reported</p> : (
            <div className="flex flex-col gap-0.5 mt-1">
              {bugs.map(bug => {
                const statusInfo = BUG_STATUSES.find(s => s.value === bug.status) || BUG_STATUSES[0];
                const assignee = members.find(m => m.id === bug.assignee_id);
                return (
                  <div key={bug.id} onClick={() => openDetail(bug)}
                    className="group flex items-center gap-3 px-4 py-2.5 rounded-md border border-transparent hover:border-zinc-800 hover:bg-zinc-900/40 transition-colors cursor-pointer text-sm"
                    data-testid={`bug-row-${bug.id}`}>
                    <div className="w-20 text-[11px] text-zinc-600 font-mono">{bug.key}</div>
                    <div className="flex-1 text-zinc-200 font-medium truncate">{bug.title}</div>
                    <div className="w-28 flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                      <span className="text-xs text-zinc-400">{statusInfo.label}</span>
                    </div>
                    <div className="w-20">
                      <div className={`w-2 h-2 rounded-full inline-block mr-1.5 ${PRIORITY_DOT[bug.priority] || 'bg-zinc-600'}`} />
                      <span className="text-xs text-zinc-500 capitalize">{bug.priority}</span>
                    </div>
                    <div className="w-24">
                      {assignee ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-white">{assignee.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <span className="text-xs text-zinc-400 truncate">{assignee.name}</span>
                        </div>
                      ) : <span className="text-xs text-zinc-600">Unassigned</span>}
                    </div>
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

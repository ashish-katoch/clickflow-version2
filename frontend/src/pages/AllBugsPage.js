import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getAllBugs, getMembers } from '../lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const BUG_STATUSES = [
  { value: 'open', label: 'Open', dot: 'bg-red-500' },
  { value: 'in_progress', label: 'In Progress', dot: 'bg-amber-500' },
  { value: 'ready_for_qa', label: 'Ready for QA', dot: 'bg-blue-400' },
  { value: 'verified', label: 'Verified', dot: 'bg-emerald-500' },
  { value: 'closed', label: 'Closed', dot: 'bg-zinc-500' },
];
const PRIORITY_DOT = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-amber-400', low: 'bg-blue-400' };

export default function AllBugsPage() {
  const { setDetailPanel } = useOutletContext();
  const [bugs, setBugs] = useState([]);
  const [members, setMembers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try { const [b, m] = await Promise.all([getAllBugs(), getMembers()]); setBugs(b); setMembers(m); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const filtered = filterStatus === 'all' ? bugs : bugs.filter(b => b.status === filterStatus);

  if (loading) return <div className="p-6 text-zinc-500 text-sm">Loading...</div>;

  return (
    <div className="p-6" data-testid="all-bugs-page">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Manrope' }}>All Bugs</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{filtered.length} bug{filtered.length !== 1 ? 's' : ''} across all projects</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-7 text-xs border-zinc-800 bg-transparent text-zinc-400 w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all">All Status</SelectItem>
            {BUG_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="max-w-5xl">
        <div className="flex items-center gap-3 px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-600 font-semibold border-b border-zinc-800">
          <div className="w-20">ID</div>
          <div className="flex-1">Title</div>
          <div className="w-28">Project</div>
          <div className="w-28">Status</div>
          <div className="w-20">Priority</div>
          <div className="w-24">Assignee</div>
        </div>
        {filtered.length === 0 ? <p className="text-sm text-zinc-600 p-6 text-center">No bugs found</p> : (
          <div className="flex flex-col gap-0.5 mt-1">
            {filtered.map(bug => {
              const statusInfo = BUG_STATUSES.find(s => s.value === bug.status) || BUG_STATUSES[0];
              const assignee = members.find(m => m.id === bug.assignee_id);
              return (
                <div key={bug.id} onClick={() => setDetailPanel({ ...bug, type: 'bug', onRefresh: fetch, members })}
                  className="group flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-zinc-900/40 hover:border-zinc-800 border border-transparent transition-colors cursor-pointer text-sm"
                  data-testid={`all-bug-${bug.id}`}>
                  <div className="w-20 text-[11px] text-zinc-600 font-mono">{bug.key}</div>
                  <div className="flex-1 text-zinc-200 font-medium truncate">{bug.title}</div>
                  <div className="w-28">{bug.project && <span className="text-[10px] px-2 py-0.5 rounded border border-zinc-800 text-zinc-500">{bug.project.name}</span>}</div>
                  <div className="w-28 flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${statusInfo.dot}`} /><span className="text-xs text-zinc-400">{statusInfo.label}</span></div>
                  <div className="w-20"><div className={`w-2 h-2 rounded-full inline-block mr-1 ${PRIORITY_DOT[bug.priority] || 'bg-zinc-600'}`} /><span className="text-xs text-zinc-500 capitalize">{bug.priority}</span></div>
                  <div className="w-24">{assignee ? <span className="text-xs text-zinc-400">{assignee.name}</span> : <span className="text-xs text-zinc-600">--</span>}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

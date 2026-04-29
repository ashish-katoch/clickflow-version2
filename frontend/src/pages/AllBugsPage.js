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

function getAvatarColor(name) {
  const colors = ['bg-indigo-600','bg-emerald-600','bg-amber-600','bg-rose-600','bg-cyan-600','bg-violet-600'];
  return colors[(name||'').split('').reduce((a,c) => a + c.charCodeAt(0), 0) % colors.length];
}

export default function AllBugsPage() {
  const { setDetailPanel } = useOutletContext();
  const [bugs, setBugs] = useState([]);
  const [members, setMembers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try { const [b, m] = await Promise.all([getAllBugs(), getMembers()]); setBugs(b); setMembers(m); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = filterStatus === 'all' ? bugs : bugs.filter(b => b.status === filterStatus);

  if (loading) return <div className="p-6 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="p-6" data-testid="all-bugs-page">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'Manrope' }}>All Bugs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} bug{filtered.length !== 1 ? 's' : ''} across all projects</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {BUG_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full">
        <div className="grid grid-cols-[70px_1fr_160px_120px_100px_140px] px-4 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold border-b border-border">
          <div>ID</div>
          <div>Title</div>
          <div>Project</div>
          <div>Status</div>
          <div>Priority</div>
          <div>Assignee</div>
        </div>
        {filtered.length === 0 ? <p className="text-sm text-muted-foreground p-6 text-center">No bugs found</p> : (
          <div className="flex flex-col mt-0.5">
            {filtered.map(bug => {
              const statusInfo = BUG_STATUSES.find(s => s.value === bug.status) || BUG_STATUSES[0];
              const assignee = members.find(m => m.id === bug.assignee_id);
              return (
                <div key={bug.id} onClick={() => setDetailPanel({ ...bug, type: 'bug', onRefresh: fetchData, members })}
                  className="grid grid-cols-[70px_1fr_160px_120px_100px_140px] items-center px-4 py-3 rounded-md hover:bg-accent border-b border-border/50 transition-colors cursor-pointer text-sm"
                  data-testid={`all-bug-${bug.id}`}>
                  <div className="text-[11px] text-muted-foreground font-mono">{bug.key}</div>
                  <div className="text-foreground font-medium truncate pr-4">{bug.title}</div>
                  <div>{bug.project && <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground truncate inline-block max-w-[140px]">{bug.project.name}</span>}</div>
                  <div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusInfo.dot}`} /><span className="text-xs text-muted-foreground">{statusInfo.label}</span></div>
                  <div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[bug.priority] || 'bg-zinc-500'}`} /><span className="text-xs text-muted-foreground capitalize">{bug.priority}</span></div>
                  <div>{assignee ? (
                    <div className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${getAvatarColor(assignee.name)}`}>
                        <span className="text-[8px] font-bold text-white">{assignee.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <span className="text-xs text-foreground truncate">{assignee.name}</span>
                    </div>
                  ) : <span className="text-xs text-muted-foreground">--</span>}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

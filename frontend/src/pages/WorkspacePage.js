import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects } from '../lib/api';
import { Plus, FolderKanban, Bug } from 'lucide-react';

export default function WorkspacePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetch = useCallback(async () => {
    try { setProjects(await getProjects()); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <div className="p-6 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="p-6" data-testid="workspace-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight t-text" style={{ fontFamily: 'Manrope' }}>Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <FolderKanban size={40} className="mb-3" />
          <p className="text-sm mb-3">No projects yet</p>
          <button data-testid="empty-create-project" onClick={() => document.querySelector('[data-testid="create-project-btn"]')?.click()}
            className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5">
            <Plus size={14} /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {projects.map(p => (
            <div key={p.id} onClick={() => navigate(`/project/${p.id}/board`)}
              className="group border rounded-lg t-card transition-all cursor-pointer p-4"
              data-testid={`project-card-${p.id}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: p.color }}>
                  {p.key?.[0] || p.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold t-text">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{p.key}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><FolderKanban size={12} /> {p.task_count || 0} tasks</span>
                <span className="flex items-center gap-1"><Bug size={12} /> {p.bug_count || 0} bugs</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

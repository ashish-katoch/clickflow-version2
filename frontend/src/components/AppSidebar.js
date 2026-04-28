import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects, createProject } from '../lib/api';
import { Hexagon, LayoutGrid, CheckSquare, Bug, Plus, LogOut, FolderKanban } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

const PROJECT_COLORS = ['#6366f1','#f43f5e','#f59e0b','#10b981','#06b6d4','#8b5cf6','#ec4899','#f97316'];

export default function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [projects, setProjects] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  const fetchProjects = useCallback(async () => {
    try { setProjects(await getProjects()); } catch {}
  }, []);
  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const p = await createProject({ name: newName, key: newKey || newName.slice(0,3), color: newColor });
    setShowCreate(false); setNewName(''); setNewKey('');
    fetchProjects();
    navigate(`/project/${p.id}/board`);
  };

  const navCls = (isActive) => `group flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${isActive ? 't-nav-active' : 't-text-secondary t-nav-hover'}`;

  return (
    <div className="w-60 flex-shrink-0 flex flex-col border-r t-sidebar z-10" data-testid="app-sidebar">
      <div className="px-4 h-14 flex items-center gap-2 border-b t-border">
        <Hexagon size={20} className="text-indigo-500" />
        <span className="text-sm font-bold tracking-tight t-text" style={{ fontFamily: 'Manrope' }}>ClickFlow</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        <div>
          <div className="px-2 mb-1 text-[10px] uppercase tracking-widest t-text-muted font-semibold">Workspace</div>
          <nav className="space-y-0.5">
            <NavLink to="/" end data-testid="nav-dashboard" className={({ isActive }) => navCls(isActive)}>
              <LayoutGrid size={16} /> Dashboard
            </NavLink>
            <NavLink to="/my-tasks" data-testid="nav-my-tasks" className={({ isActive }) => navCls(isActive)}>
              <CheckSquare size={16} /> My Tasks
            </NavLink>
            <NavLink to="/all-bugs" data-testid="nav-all-bugs" className={({ isActive }) => navCls(isActive)}>
              <Bug size={16} /> All Bugs
            </NavLink>
          </nav>
        </div>

        <div>
          <div className="px-2 mb-1 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest t-text-muted font-semibold">Projects</span>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <button data-testid="create-project-btn" className="h-5 w-5 rounded flex items-center justify-center t-text-muted hover:t-text transition-colors">
                  <Plus size={12} />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm t-dropdown border">
                <DialogHeader><DialogTitle className="t-text" style={{ fontFamily: 'Manrope' }}>New Project</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-2">
                  <input data-testid="project-name-input" value={newName} onChange={e => { setNewName(e.target.value); if (!newKey) setNewKey(e.target.value.slice(0,3).toUpperCase()); }}
                    placeholder="Project name" className="flex h-9 w-full rounded-md t-input px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                  <input data-testid="project-key-input" value={newKey} onChange={e => setNewKey(e.target.value.toUpperCase())}
                    placeholder="Key (e.g. FE)" className="flex h-9 w-full rounded-md t-input px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                  <div className="flex gap-2">
                    {PROJECT_COLORS.map(c => (
                      <button key={c} onClick={() => setNewColor(c)} className={`w-6 h-6 rounded-full transition-all ${newColor === c ? 'ring-2 ring-offset-1 ring-indigo-400 scale-110' : 'hover:scale-110'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <button data-testid="submit-project-btn" onClick={handleCreate} className="h-9 w-full rounded-md t-btn-primary text-sm font-medium transition-colors">Create Project</button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <nav className="space-y-0.5">
            {projects.map(p => (
              <div key={p.id}>
                <NavLink to={`/project/${p.id}/board`} data-testid={`project-link-${p.id}`}
                  className={({ isActive }) => navCls(isActive || projectId === p.id)}>
                  <div className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ backgroundColor: p.color }}>
                    {p.key?.[0] || p.name[0]}
                  </div>
                  <span className="truncate">{p.name}</span>
                </NavLink>
                {projectId === p.id && (
                  <div className="ml-8 mt-0.5 space-y-0.5">
                    <NavLink to={`/project/${p.id}/board`} end className={({ isActive }) => `block text-xs py-1 px-2 rounded transition-colors ${isActive ? 't-text text-indigo-400' : 't-text-muted hover:t-text-secondary'}`}>
                      <FolderKanban size={12} className="inline mr-1.5" />Sprint Board
                    </NavLink>
                    <NavLink to={`/project/${p.id}/bugs`} className={({ isActive }) => `block text-xs py-1 px-2 rounded transition-colors ${isActive ? 't-text text-indigo-400' : 't-text-muted hover:t-text-secondary'}`}>
                      <Bug size={12} className="inline mr-1.5" />QA Bugs
                    </NavLink>
                  </div>
                )}
              </div>
            ))}
            {projects.length === 0 && <p className="text-xs t-text-muted px-3 py-2">No projects yet</p>}
          </nav>
        </div>
      </div>

      <div className="px-3 py-3 border-t t-border flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-white">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          <div className="min-w-0"><div className="text-xs font-medium truncate t-text">{user?.name}</div></div>
        </div>
        <button onClick={() => { logout(); }} data-testid="logout-btn" className="h-7 w-7 rounded flex items-center justify-center t-text-muted hover:t-text transition-colors">
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}

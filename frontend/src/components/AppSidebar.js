import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects, createProject, deleteProject } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import {
  SquaresFour, House, FolderOpen, Target, Users, Gear,
  Plus, SignOut, CaretDown, CaretRight, Trash, Circle, Lightning
} from '@phosphor-icons/react';

const PROJECT_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function AppSidebar({ onProjectChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const project = await createProject({ name: newName, color: newColor });
      setNewName('');
      setShowCreate(false);
      fetchProjects();
      navigate(`/project/${project.id}`);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    await deleteProject(id);
    fetchProjects();
    navigate('/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="w-64 h-screen bg-slate-50 border-r border-slate-200 flex flex-col" data-testid="app-sidebar">
      {/* Brand */}
      <div className="px-4 py-4 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <SquaresFour size={18} weight="duotone" className="text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>ClickFlow</span>
      </div>

      <Separator className="bg-slate-200" />

      <ScrollArea className="flex-1 px-3 py-3">
        {/* Nav Links */}
        <nav className="space-y-0.5">
          <NavLink
            to="/"
            end
            data-testid="nav-dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`
            }
          >
            <House size={18} weight="duotone" /> Dashboard
          </NavLink>
          <NavLink
            to="/goals"
            data-testid="nav-goals"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`
            }
          >
            <Target size={18} weight="duotone" /> Goals
          </NavLink>
          <NavLink
            to="/members"
            data-testid="nav-members"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`
            }
          >
            <Users size={18} weight="duotone" /> Members
          </NavLink>
          <NavLink
            to="/automations"
            data-testid="nav-automations"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`
            }
          >
            <Lightning size={18} weight="duotone" /> Automations
          </NavLink>
        </nav>

        <Separator className="bg-slate-200 my-3" />

        {/* Projects Section */}
        <div>
          <div
            className="flex items-center justify-between px-3 py-1.5 cursor-pointer"
            onClick={() => setProjectsExpanded(!projectsExpanded)}
          >
            <span className="text-xs uppercase tracking-wide font-semibold text-slate-400 flex items-center gap-1">
              {projectsExpanded ? <CaretDown size={12} /> : <CaretRight size={12} />}
              Projects
            </span>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <button
                  data-testid="create-project-btn"
                  className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus size={12} weight="bold" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <div>
                    <Input
                      data-testid="project-name-input"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate()}
                      placeholder="Project name"
                      className="border-slate-200"
                    />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Color</span>
                    <div className="flex gap-2 mt-1">
                      {PROJECT_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setNewColor(c)}
                          className={`w-6 h-6 rounded-full transition-all ${newColor === c ? 'ring-2 ring-offset-1 ring-blue-700 scale-110' : 'hover:scale-110'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <Button data-testid="submit-project-btn" onClick={handleCreate} className="w-full bg-blue-700 hover:bg-blue-800 text-white">
                    Create Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {projectsExpanded && (
            <div className="space-y-0.5 mt-1">
              {projects.length === 0 ? (
                <p className="text-xs text-slate-400 px-3 py-2">No projects yet</p>
              ) : (
                projects.map(p => (
                  <NavLink
                    key={p.id}
                    to={`/project/${p.id}`}
                    data-testid={`project-link-${p.id}`}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-1.5 rounded-md text-sm group transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`
                    }
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Circle size={10} weight="fill" style={{ color: p.color }} className="flex-shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, p.id)}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center hover:bg-red-100 text-slate-400 hover:text-red-500 transition-all"
                      data-testid={`delete-project-${p.id}`}
                    >
                      <Trash size={12} />
                    </button>
                  </NavLink>
                ))
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator className="bg-slate-200" />

      {/* User Section */}
      <div className="px-3 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">{user?.name || 'User'}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            data-testid="logout-btn"
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <SignOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

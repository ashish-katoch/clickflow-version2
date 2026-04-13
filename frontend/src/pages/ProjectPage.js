import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getTasks, createTask, updateTask, deleteTask } from '../lib/api';
import { getProjects } from '../lib/api';
import TaskListView from '../components/TaskListView';
import TaskBoardView from '../components/TaskBoardView';
import TaskCalendarView from '../components/TaskCalendarView';
import TaskDetailModal from '../components/TaskDetailModal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Label } from '../components/ui/label';
import { Plus, ListBullets, Kanban, CalendarBlank, Funnel } from '@phosphor-icons/react';

export default function ProjectPage() {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'todo', priority: 'none', due_date: '', tags: [] });
  const [tagInput, setTagInput] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [tasksData, projects] = await Promise.all([
        getTasks({ project_id: projectId }),
        getProjects()
      ]);
      setTasks(tasksData);
      const p = projects.find(p => p.id === projectId);
      setProject(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      await createTask(projectId, newTask);
      setNewTask({ title: '', description: '', status: 'todo', priority: 'none', due_date: '', tags: [] });
      setShowCreate(false);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleUpdateTask = async (taskId, data) => {
    try {
      await updateTask(taskId, data);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setSelectedTask(null);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const addTag = () => {
    if (tagInput.trim() && !newTask.tags.includes(tagInput.trim())) {
      setNewTask({ ...newTask, tags: [...newTask.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return !t.parent_task_id;
  });

  const subtasks = tasks.filter(t => t.parent_task_id);

  if (loading) return <div className="p-8 text-slate-500">Loading project...</div>;

  return (
    <div className="flex flex-col h-full" data-testid="project-page">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {project && (
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
            )}
            <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              {project?.name || 'Project'}
            </h1>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filteredTasks.length} tasks</span>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button data-testid="create-task-btn" className="bg-blue-700 hover:bg-blue-800 text-white rounded-md h-9 px-3 text-sm gap-1.5">
                <Plus size={16} weight="bold" /> Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Title</Label>
                  <Input data-testid="task-title-input" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="Task name" className="mt-1 border-slate-200" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Description</Label>
                  <textarea data-testid="task-desc-input" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="Add details..." className="mt-1 w-full border border-slate-200 rounded-md p-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-700" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Status</Label>
                    <Select value={newTask.status} onValueChange={v => setNewTask({ ...newTask, status: v })}>
                      <SelectTrigger className="mt-1 border-slate-200" data-testid="task-status-select"><SelectValue /></SelectTrigger>
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
                    <Select value={newTask.priority} onValueChange={v => setNewTask({ ...newTask, priority: v })}>
                      <SelectTrigger className="mt-1 border-slate-200" data-testid="task-priority-select"><SelectValue /></SelectTrigger>
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
                <div>
                  <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Due Date</Label>
                  <Input type="date" data-testid="task-duedate-input" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} className="mt-1 border-slate-200" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Tags</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add tag" className="border-slate-200" />
                    <Button type="button" variant="outline" onClick={addTag} className="border-slate-200 text-sm">Add</Button>
                  </div>
                  {newTask.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newTask.tags.map((tag, i) => (
                        <span key={i} className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full cursor-pointer hover:bg-red-100 hover:text-red-600"
                          onClick={() => setNewTask({ ...newTask, tags: newTask.tags.filter((_, j) => j !== i) })}>
                          {tag} x
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Button data-testid="submit-task-btn" onClick={handleCreateTask} className="w-full bg-blue-700 hover:bg-blue-800 text-white">Create Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* View Tabs & Filters */}
        <div className="flex items-center justify-between">
          <Tabs value={view} onValueChange={setView} className="w-auto">
            <TabsList className="bg-slate-100 h-8">
              <TabsTrigger data-testid="view-list" value="list" className="text-xs gap-1 px-3 h-7 data-[state=active]:bg-white">
                <ListBullets size={14} /> List
              </TabsTrigger>
              <TabsTrigger data-testid="view-board" value="board" className="text-xs gap-1 px-3 h-7 data-[state=active]:bg-white">
                <Kanban size={14} /> Board
              </TabsTrigger>
              <TabsTrigger data-testid="view-calendar" value="calendar" className="text-xs gap-1 px-3 h-7 data-[state=active]:bg-white">
                <CalendarBlank size={14} /> Calendar
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Funnel size={14} className="text-slate-400" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-xs border-slate-200 w-[110px]" data-testid="filter-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="h-8 text-xs border-slate-200 w-[110px]" data-testid="filter-priority"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-auto bg-slate-50">
        {view === 'list' && <TaskListView tasks={filteredTasks} subtasks={subtasks} onUpdate={handleUpdateTask} onSelect={setSelectedTask} onDelete={handleDeleteTask} />}
        {view === 'board' && <TaskBoardView tasks={filteredTasks} onUpdate={handleUpdateTask} onSelect={setSelectedTask} />}
        {view === 'calendar' && <TaskCalendarView tasks={filteredTasks} onSelect={setSelectedTask} />}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          subtasks={subtasks.filter(s => s.parent_task_id === selectedTask.id)}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          projectId={projectId}
          onCreateSubtask={async (data) => {
            await createTask(projectId, { ...data, parent_task_id: selectedTask.id });
            fetchData();
          }}
        />
      )}
    </div>
  );
}

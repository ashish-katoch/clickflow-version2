import React, { useState, useEffect, useCallback } from 'react';
import { getAutomations, createAutomation, toggleAutomation, deleteAutomation, getProjects } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Lightning, Plus, Trash, ArrowRight } from '@phosphor-icons/react';

const TRIGGER_TYPES = [
  { value: 'status_change', label: 'Status changes' },
  { value: 'priority_change', label: 'Priority changes' },
  { value: 'assignee_change', label: 'Assignee changes' },
  { value: 'due_date_passed', label: 'Due date passes' },
];

const ACTION_TYPES = [
  { value: 'change_status', label: 'Change status to' },
  { value: 'change_priority', label: 'Change priority to' },
  { value: 'add_comment', label: 'Add a comment' },
];

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function AutomationsPage() {
  const [automations, setAutomations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '', project_id: null, trigger_type: 'status_change',
    trigger_value: 'done', action_type: 'change_status', action_value: 'in_review',
  });

  const fetchData = useCallback(async () => {
    try {
      const [autos, projs] = await Promise.all([getAutomations(), getProjects()]);
      setAutomations(autos);
      setProjects(projs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      await createAutomation({
        ...form,
        active: true,
        project_id: form.project_id === '__all__' ? null : form.project_id,
      });
      setShowCreate(false);
      setForm({ name: '', project_id: null, trigger_type: 'status_change', trigger_value: 'done', action_type: 'change_status', action_value: 'in_review' });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleToggle = async (id) => {
    await toggleAutomation(id);
    fetchData();
  };

  const handleDelete = async (id) => {
    await deleteAutomation(id);
    fetchData();
  };

  const getTriggerLabel = (auto) => {
    const trigger = TRIGGER_TYPES.find(t => t.value === auto.trigger_type);
    let label = trigger?.label || auto.trigger_type;
    if (auto.trigger_value) label += ` to "${auto.trigger_value}"`;
    return label;
  };

  const getActionLabel = (auto) => {
    const action = ACTION_TYPES.find(a => a.value === auto.action_type);
    return `${action?.label || auto.action_type} "${auto.action_value}"`;
  };

  const getActionValueOptions = () => {
    if (form.action_type === 'change_status') return STATUS_OPTIONS;
    if (form.action_type === 'change_priority') return PRIORITY_OPTIONS;
    return null;
  };

  const getTriggerValueOptions = () => {
    if (form.trigger_type === 'status_change') return STATUS_OPTIONS;
    if (form.trigger_type === 'priority_change') return PRIORITY_OPTIONS;
    return null;
  };

  if (loading) return <div className="p-8 text-slate-500">Loading automations...</div>;

  return (
    <div className="p-6 md:p-8 space-y-6" data-testid="automations-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>Automations</h1>
          <p className="text-sm text-slate-500 mt-1">Automate repetitive workflows</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button data-testid="create-automation-btn" className="bg-blue-700 hover:bg-blue-800 text-white rounded-md h-9 px-3 text-sm gap-1.5">
              <Plus size={16} weight="bold" /> New Automation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>Create Automation</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Name</Label>
                <Input data-testid="automation-name-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Auto-review on complete" className="mt-1 border-slate-200" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Project Scope</Label>
                <Select value={form.project_id || '__all__'} onValueChange={v => setForm({ ...form, project_id: v })}>
                  <SelectTrigger className="mt-1 border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Projects</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="text-xs font-semibold text-slate-600 mb-2">WHEN</div>
                <Select value={form.trigger_type} onValueChange={v => setForm({ ...form, trigger_type: v, trigger_value: '' })}>
                  <SelectTrigger className="border-slate-200" data-testid="trigger-type-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {getTriggerValueOptions() && (
                  <Select value={form.trigger_value} onValueChange={v => setForm({ ...form, trigger_value: v })}>
                    <SelectTrigger className="mt-2 border-slate-200" data-testid="trigger-value-select"><SelectValue placeholder="Any value" /></SelectTrigger>
                    <SelectContent>
                      {getTriggerValueOptions().map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="flex justify-center">
                <ArrowRight size={16} className="text-slate-400 rotate-90" />
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-xs font-semibold text-blue-700 mb-2">THEN</div>
                <Select value={form.action_type} onValueChange={v => setForm({ ...form, action_type: v, action_value: '' })}>
                  <SelectTrigger className="border-blue-200" data-testid="action-type-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {getActionValueOptions() ? (
                  <Select value={form.action_value} onValueChange={v => setForm({ ...form, action_value: v })}>
                    <SelectTrigger className="mt-2 border-blue-200" data-testid="action-value-select"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {getActionValueOptions().map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={form.action_value} onChange={e => setForm({ ...form, action_value: e.target.value })} placeholder="Comment text..." className="mt-2 border-blue-200" data-testid="action-value-input" />
                )}
              </div>
              <Button data-testid="submit-automation-btn" onClick={handleCreate} className="w-full bg-blue-700 hover:bg-blue-800 text-white">Create Automation</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Preset Templates */}
      <div>
        <h3 className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">Quick Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { name: 'Auto-review on complete', trigger: 'status_change', tv: 'done', action: 'add_comment', av: 'Task completed! Ready for review.' },
            { name: 'Escalate urgent', trigger: 'priority_change', tv: 'urgent', action: 'change_status', av: 'in_progress' },
            { name: 'Reset on reopen', trigger: 'status_change', tv: 'todo', action: 'change_priority', av: 'medium' },
          ].map((tpl, i) => (
            <button key={i} onClick={() => {
              setForm({ name: tpl.name, project_id: null, trigger_type: tpl.trigger, trigger_value: tpl.tv, action_type: tpl.action, action_value: tpl.av });
              setShowCreate(true);
            }} className="bg-white border border-slate-200 rounded-md p-3 text-left hover:border-blue-300 hover:-translate-y-0.5 transition-all" data-testid={`template-${i}`}>
              <div className="text-xs font-semibold text-slate-700">{tpl.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">When {tpl.trigger.replace('_', ' ')} → {tpl.action.replace('_', ' ')}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Automation List */}
      {automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
          <Lightning size={48} weight="duotone" className="mb-3" />
          <p className="text-sm">No automations yet. Create one or use a template!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {automations.map(auto => (
            <Card key={auto.id} className={`border-slate-200 shadow-sm transition-opacity ${!auto.active ? 'opacity-50' : ''}`} data-testid={`automation-card-${auto.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <Switch checked={auto.active} onCheckedChange={() => handleToggle(auto.id)} data-testid={`toggle-automation-${auto.id}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{auto.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      When: {getTriggerLabel(auto)}
                    </span>
                    <ArrowRight size={10} className="text-slate-300" />
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      Then: {getActionLabel(auto)}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleDelete(auto.id)} className="text-slate-300 hover:text-red-500 transition-colors" data-testid={`delete-automation-${auto.id}`}>
                  <Trash size={16} />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

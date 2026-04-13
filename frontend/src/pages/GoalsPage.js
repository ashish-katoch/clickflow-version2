import React, { useState, useEffect, useCallback } from 'react';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Target, Plus, Trash, PencilSimple, CalendarBlank } from '@phosphor-icons/react';

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', target_value: 100, current_value: 0, unit: 'percent', due_date: '' });

  const fetchGoals = useCallback(async () => {
    try {
      const data = await getGoals();
      setGoals(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const resetForm = () => setForm({ title: '', description: '', target_value: 100, current_value: 0, unit: 'percent', due_date: '' });

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    try {
      await createGoal(form);
      resetForm();
      setShowCreate(false);
      fetchGoals();
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async () => {
    if (!editGoal) return;
    try {
      await updateGoal(editGoal.id, form);
      setEditGoal(null);
      resetForm();
      fetchGoals();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    await deleteGoal(id);
    fetchGoals();
  };

  const openEdit = (goal) => {
    setForm({
      title: goal.title,
      description: goal.description || '',
      target_value: goal.target_value,
      current_value: goal.current_value,
      unit: goal.unit,
      due_date: goal.due_date || '',
    });
    setEditGoal(goal);
  };

  if (loading) return <div className="p-8 text-slate-500">Loading goals...</div>;

  return (
    <div className="p-6 md:p-8 space-y-6" data-testid="goals-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>Goals</h1>
          <p className="text-sm text-slate-500 mt-1">Track your team objectives and key results</p>
        </div>
        <Dialog open={showCreate} onOpenChange={(v) => { setShowCreate(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="create-goal-btn" className="bg-blue-700 hover:bg-blue-800 text-white rounded-md h-9 px-3 text-sm gap-1.5">
              <Plus size={16} weight="bold" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>Create Goal</DialogTitle>
            </DialogHeader>
            <GoalForm form={form} setForm={setForm} onSubmit={handleCreate} submitLabel="Create Goal" />
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <Target size={48} weight="duotone" className="mb-3" />
          <p className="text-sm">No goals set. Create your first goal!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(goal => {
            const progress = goal.target_value > 0 ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100)) : 0;
            return (
              <Card key={goal.id} className="border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all" data-testid={`goal-card-${goal.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>{goal.title}</h3>
                      {goal.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{goal.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button onClick={() => openEdit(goal)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-400" data-testid={`edit-goal-${goal.id}`}>
                        <PencilSimple size={14} />
                      </button>
                      <button onClick={() => handleDelete(goal.id)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50 text-slate-400 hover:text-red-500" data-testid={`delete-goal-${goal.id}`}>
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">{goal.current_value} / {goal.target_value} {goal.unit}</span>
                      <span className="font-semibold text-slate-700">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {goal.due_date && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                      <CalendarBlank size={12} />
                      Due {new Date(goal.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Goal Dialog */}
      <Dialog open={!!editGoal} onOpenChange={(v) => { if (!v) { setEditGoal(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>Edit Goal</DialogTitle>
          </DialogHeader>
          <GoalForm form={form} setForm={setForm} onSubmit={handleUpdate} submitLabel="Update Goal" />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GoalForm({ form, setForm, onSubmit, submitLabel }) {
  return (
    <div className="space-y-3 mt-2">
      <div>
        <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Title</Label>
        <Input data-testid="goal-title-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Goal name" className="mt-1 border-slate-200" />
      </div>
      <div>
        <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Description</Label>
        <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional details" className="mt-1 border-slate-200" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Target</Label>
          <Input type="number" data-testid="goal-target-input" value={form.target_value} onChange={e => setForm({ ...form, target_value: Number(e.target.value) })} className="mt-1 border-slate-200" />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Current</Label>
          <Input type="number" data-testid="goal-current-input" value={form.current_value} onChange={e => setForm({ ...form, current_value: Number(e.target.value) })} className="mt-1 border-slate-200" />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Unit</Label>
          <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
            <SelectTrigger className="mt-1 border-slate-200" data-testid="goal-unit-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Percent</SelectItem>
              <SelectItem value="tasks">Tasks</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="points">Points</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Due Date</Label>
        <Input type="date" data-testid="goal-duedate-input" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="mt-1 border-slate-200" />
      </div>
      <Button data-testid="submit-goal-btn" onClick={onSubmit} className="w-full bg-blue-700 hover:bg-blue-800 text-white">{submitLabel}</Button>
    </div>
  );
}

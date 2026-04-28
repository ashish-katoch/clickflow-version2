import React, { useState, useEffect, useCallback } from 'react';
import { X, Send } from 'lucide-react';
import { updateTask, updateBug, deleteTask, deleteBug, getComments, createComment } from '../lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const TASK_STATUSES = [
  { value: 'backlog', label: 'Backlog' }, { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' },
];
const BUG_STATUSES = [
  { value: 'open', label: 'Open' }, { value: 'in_progress', label: 'In Progress' },
  { value: 'ready_for_qa', label: 'Ready for QA' }, { value: 'verified', label: 'Verified' }, { value: 'closed', label: 'Closed' },
];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const BUG_PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function DetailPanel({ data, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [entity, setEntity] = useState(data);
  const isTask = data.type === 'task';
  const statuses = isTask ? TASK_STATUSES : BUG_STATUSES;
  const priorities = isTask ? TASK_PRIORITIES : BUG_PRIORITIES;
  const updateFn = isTask ? updateTask : updateBug;
  const deleteFn = isTask ? deleteTask : deleteBug;

  const fetchComments = useCallback(async () => {
    try { setComments(await getComments(data.id, data.type)); } catch {}
  }, [data.id, data.type]);
  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleUpdate = async (field, value) => {
    const updated = await updateFn(data.id, { [field]: value });
    setEntity(prev => ({ ...prev, ...updated }));
    data.onRefresh?.();
  };

  const handleDelete = async () => {
    await deleteFn(data.id);
    data.onRefresh?.();
    onClose();
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    await createComment({ entity_id: data.id, entity_type: data.type, content: newComment });
    setNewComment('');
    fetchComments();
  };

  return (
    <div className="absolute inset-y-0 right-0 w-[450px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50 slide-in-right flex flex-col" data-testid="detail-panel">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600 font-mono">{entity.key}</span>
          <span className="text-xs px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-500 capitalize">{data.type}</span>
        </div>
        <button onClick={onClose} data-testid="close-detail" className="h-7 w-7 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-50 hover:bg-zinc-800 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <input value={entity.title || ''} onChange={e => setEntity({ ...entity, title: e.target.value })}
          onBlur={() => handleUpdate('title', entity.title)}
          className="w-full bg-transparent text-lg font-semibold text-zinc-50 outline-none border-none" style={{ fontFamily: 'Manrope' }}
          data-testid="detail-title" />

        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold block mb-1">Status</label>
            <Select value={entity.status} onValueChange={v => { setEntity({ ...entity, status: v }); handleUpdate('status', v); }}>
              <SelectTrigger className="h-8 border-zinc-800 bg-transparent text-zinc-300 text-sm" data-testid="detail-status"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold block mb-1">Priority</label>
            <Select value={entity.priority} onValueChange={v => { setEntity({ ...entity, priority: v }); handleUpdate('priority', v); }}>
              <SelectTrigger className="h-8 border-zinc-800 bg-transparent text-zinc-300 text-sm" data-testid="detail-priority"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {priorities.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Assignee */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold block mb-1">Assignee</label>
          <Select value={entity.assignee_id || '__none__'} onValueChange={v => { const val = v === '__none__' ? null : v; setEntity({ ...entity, assignee_id: val }); handleUpdate('assignee_id', val); }}>
            <SelectTrigger className="h-8 border-zinc-800 bg-transparent text-zinc-300 text-sm" data-testid="detail-assignee"><SelectValue placeholder="Unassigned" /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="__none__">Unassigned</SelectItem>
              {(data.members || []).map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Due date (tasks only) */}
        {isTask && (
          <div>
            <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold block mb-1">Due Date</label>
            <input type="date" value={entity.due_date || ''} onChange={e => { setEntity({ ...entity, due_date: e.target.value }); handleUpdate('due_date', e.target.value || null); }}
              className="h-8 w-full rounded-md border border-zinc-800 bg-transparent px-3 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              data-testid="detail-due-date" />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold block mb-1">Description</label>
          <textarea value={entity.description || ''} onChange={e => setEntity({ ...entity, description: e.target.value })}
            onBlur={() => handleUpdate('description', entity.description || '')}
            placeholder="Add a description..."
            className="w-full min-h-[80px] rounded-md border border-zinc-800 bg-transparent px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
            data-testid="detail-description" />
        </div>

        {/* Activity & Comments */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold block mb-2">Activity</label>
          <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
            {comments.map(c => (
              <div key={c.id} className="flex gap-2" data-testid={`comment-${c.id}`}>
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[8px] font-bold text-white">{c.user_name?.[0]?.toUpperCase() || 'U'}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-300">{c.user_name}</span>
                    <span className="text-[10px] text-zinc-600">{new Date(c.created_at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{c.content}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && <p className="text-xs text-zinc-600">No comments yet</p>}
          </div>
          {/* Comment input */}
          <div className="flex gap-2">
            <input value={newComment} onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
              placeholder="Write a comment..."
              className="flex-1 h-8 rounded-md border border-zinc-800 bg-transparent px-3 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              data-testid="comment-input" />
            <button onClick={handleComment} data-testid="submit-comment" className="h-8 w-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 transition-colors">
              <Send size={14} />
            </button>
          </div>
        </div>

        {/* Delete */}
        <div className="pt-3 border-t border-zinc-800">
          <button onClick={handleDelete} data-testid="delete-entity-btn" className="text-xs text-red-500/60 hover:text-red-400 transition-colors">
            Delete this {data.type}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { X, Send, ImagePlus, Trash2, ExternalLink } from 'lucide-react';
import { updateTask, updateBug, deleteTask, deleteBug, getComments, createComment, addBugAttachment, removeBugAttachment } from '../lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const TASK_STATUSES = [
  { value: 'backlog', label: 'Backlog', dot: 'bg-zinc-500' },
  { value: 'in_progress', label: 'In Progress', dot: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', dot: 'bg-emerald-500' },
];
const BUG_STATUSES = [
  { value: 'open', label: 'Open', dot: 'bg-red-500' },
  { value: 'in_progress', label: 'In Progress', dot: 'bg-amber-500' },
  { value: 'ready_for_qa', label: 'Ready for QA', dot: 'bg-blue-400' },
  { value: 'verified', label: 'Verified', dot: 'bg-emerald-500' },
  { value: 'closed', label: 'Closed', dot: 'bg-zinc-500' },
];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const BUG_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const PRIORITY_DOT = { urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-amber-400', low: 'bg-blue-400', critical: 'bg-red-500' };

function getAvatarColor(name) {
  const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600', 'bg-violet-600', 'bg-pink-600'];
  return colors[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DetailPanel({ data, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [entity, setEntity] = useState(data);
  const [attachUrl, setAttachUrl] = useState('');
  const [showAttachInput, setShowAttachInput] = useState(false);
  const isTask = data.type === 'task';
  const isBug = data.type === 'bug';
  const statuses = isTask ? TASK_STATUSES : BUG_STATUSES;
  const priorities = isTask ? TASK_PRIORITIES : BUG_PRIORITIES;
  const updateFn = isTask ? updateTask : updateBug;
  const deleteFn = isTask ? deleteTask : deleteBug;

  // Resolve creator from members
  const creator = (data.members || []).find(m => m.id === entity.created_by);
  const creatorName = entity.created_by_name || creator?.name || 'Unknown';

  const fetchComments = useCallback(async () => {
    try { setComments(await getComments(data.id, data.type)); } catch {}
  }, [data.id, data.type]);
  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleUpdate = async (field, value) => {
    const updated = await updateFn(data.id, { [field]: value });
    setEntity(prev => ({ ...prev, ...updated }));
    data.onRefresh?.();
    // Refresh comments to show new activity entries
    if (field === 'status' || field === 'assignee_id') {
      setTimeout(fetchComments, 500);
    }
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

  const handleAddAttachment = async (fileUrl, fileName) => {
    if (!fileUrl) return;
    const att = await addBugAttachment(data.id, { file_name: fileName || 'image', file_url: fileUrl, file_type: 'image/png' });
    setEntity(prev => ({ ...prev, attachments: [...(prev.attachments || []), att] }));
    setAttachUrl('');
    setShowAttachInput(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleAddAttachment(ev.target.result, file.name);
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = async (attId) => {
    await removeBugAttachment(data.id, attId);
    setEntity(prev => ({ ...prev, attachments: (prev.attachments || []).filter(a => a.id !== attId) }));
  };

  const statusInfo = statuses.find(s => s.value === entity.status);

  return (
    <div className="absolute inset-y-0 right-0 w-[480px] bg-background border-l border-border shadow-2xl z-50 slide-in-right flex flex-col" data-testid="detail-panel">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-mono">{entity.key}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize font-medium ${isTask ? 'bg-indigo-500/10 text-indigo-400' : 'bg-red-500/10 text-red-400'}`}>{data.type}</span>
          {statusInfo && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />{statusInfo.label}</span>}
        </div>
        <button onClick={onClose} data-testid="close-detail" className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Title */}
        <input value={entity.title || ''} onChange={e => setEntity({ ...entity, title: e.target.value })}
          onBlur={() => handleUpdate('title', entity.title)}
          className="w-full bg-transparent text-lg font-semibold text-foreground outline-none border-none" style={{ fontFamily: 'Manrope' }}
          data-testid="detail-title" />

        {/* Properties */}
        <div className="space-y-3">
          {/* Status */}
          <div className="grid grid-cols-[110px_1fr] items-center gap-2">
            <label className="text-[11px] text-muted-foreground font-medium">Status</label>
            <Select value={entity.status} onValueChange={v => { setEntity({ ...entity, status: v }); handleUpdate('status', v); }}>
              <SelectTrigger className="h-8 border-border bg-transparent text-foreground text-sm" data-testid="detail-status"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover border">
                {statuses.map(s => <SelectItem key={s.value} value={s.value}><span className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${s.dot}`} />{s.label}</span></SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="grid grid-cols-[110px_1fr] items-center gap-2">
            <label className="text-[11px] text-muted-foreground font-medium">Priority</label>
            <Select value={entity.priority} onValueChange={v => { setEntity({ ...entity, priority: v }); handleUpdate('priority', v); }}>
              <SelectTrigger className="h-8 border-border bg-transparent text-foreground text-sm" data-testid="detail-priority"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover border">
                {priorities.map(p => <SelectItem key={p} value={p}><span className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[p] || 'bg-zinc-500'}`} /><span className="capitalize">{p}</span></span></SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Assigned to (single clean field) */}
          <div className="grid grid-cols-[110px_1fr] items-center gap-2">
            <label className="text-[11px] text-muted-foreground font-medium">Assigned to</label>
            <Select value={entity.assignee_id || '__none__'} onValueChange={v => { const val = v === '__none__' ? null : v; setEntity({ ...entity, assignee_id: val }); handleUpdate('assignee_id', val); }}>
              <SelectTrigger className="h-8 border-border bg-transparent text-foreground text-sm" data-testid="detail-assignee"><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent className="bg-popover border">
                <SelectItem value="__none__">Unassigned</SelectItem>
                {(data.members || []).map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${getAvatarColor(m.name)}`}>{m.name?.[0]?.toUpperCase()}</span>
                      {m.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reported by (read-only) */}
          <div className="grid grid-cols-[110px_1fr] items-start gap-2">
            <label className="text-[11px] text-muted-foreground font-medium mt-1">{isBug ? 'Reported by' : 'Created by'}</label>
            <div>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${getAvatarColor(creatorName)}`}>
                  {creatorName[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-foreground font-medium">{creatorName}</span>
              </div>
              {entity.created_at && (
                <span className="text-[10px] text-muted-foreground ml-8">{isBug ? 'Reported' : 'Created'} on {formatDate(entity.created_at)}</span>
              )}
            </div>
          </div>

          {/* Due date */}
          <div className="grid grid-cols-[110px_1fr] items-center gap-2">
            <label className="text-[11px] text-muted-foreground font-medium">Due Date</label>
            <input type="date" value={entity.due_date || ''} onChange={e => { setEntity({ ...entity, due_date: e.target.value }); handleUpdate('due_date', e.target.value || null); }}
              className="h-8 w-full rounded-md border border-border bg-transparent px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-400"
              data-testid="detail-due-date" />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[11px] text-muted-foreground font-medium block mb-1.5">Description</label>
          <textarea value={entity.description || ''} onChange={e => setEntity({ ...entity, description: e.target.value })}
            onBlur={() => handleUpdate('description', entity.description || '')}
            placeholder="Add a description..."
            className="w-full min-h-[80px] rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:opacity-40 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
            data-testid="detail-description" />
        </div>

        {/* Bug Attachments */}
        {isBug && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] text-muted-foreground font-medium">Attachments ({(entity.attachments || []).length})</label>
              <div className="flex items-center gap-1">
                <label className="cursor-pointer h-6 px-2 rounded text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors" data-testid="upload-file-btn">
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  <ImagePlus size={12} /> Upload
                </label>
                <button onClick={() => setShowAttachInput(!showAttachInput)} className="h-6 px-2 rounded text-[10px] text-muted-foreground hover:text-foreground transition-colors" data-testid="add-url-btn">+ URL</button>
              </div>
            </div>
            {showAttachInput && (
              <div className="flex gap-2 mb-2">
                <input value={attachUrl} onChange={e => setAttachUrl(e.target.value)} placeholder="Paste image URL..."
                  className="flex-1 h-8 rounded-md border border-border bg-transparent px-3 text-sm text-foreground placeholder:opacity-40 focus:outline-none focus:ring-1 focus:ring-indigo-400" data-testid="attachment-url-input" />
                <button onClick={() => handleAddAttachment(attachUrl, 'image')} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium" data-testid="submit-url-btn">Add</button>
              </div>
            )}
            {(entity.attachments || []).length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {(entity.attachments || []).map(att => (
                  <div key={att.id} className="relative group rounded-lg overflow-hidden border border-border" data-testid={`attachment-${att.id}`}>
                    <img src={att.file_url} alt={att.file_name} className="w-full h-28 object-cover bg-zinc-800" onError={e => { e.target.style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a href={att.file_url} target="_blank" rel="noreferrer" className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"><ExternalLink size={12} /></a>
                      <button onClick={() => handleRemoveAttachment(att.id)} className="h-7 w-7 rounded-full bg-red-500/30 flex items-center justify-center text-white hover:bg-red-500/50" data-testid={`remove-att-${att.id}`}><Trash2 size={12} /></button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-[10px] text-white truncate">{att.file_name}</div>
                  </div>
                ))}
              </div>
            )}
            {(entity.attachments || []).length === 0 && !showAttachInput && <p className="text-xs text-muted-foreground">No attachments.</p>}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Activity & Comments */}
        <div>
          <label className="text-[11px] text-muted-foreground font-medium block mb-3">Activity & Comments</label>
          <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
            {comments.map(c => (
              <div key={c.id} className="flex gap-2.5" data-testid={`comment-${c.id}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getAvatarColor(c.user_name)}`}>
                  <span className="text-[8px] font-bold text-white">{c.user_name?.[0]?.toUpperCase() || '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold t-text">{c.user_name || 'Unknown'}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(c.created_at)}</span>
                  </div>
                  <p className={`text-xs mt-0.5 ${c.type === 'activity' ? 'text-muted-foreground italic' : 'text-muted-foreground'}`}>
                    {c.content}
                  </p>
                </div>
              </div>
            ))}
            {comments.length === 0 && <p className="text-xs text-muted-foreground">No activity yet</p>}
          </div>

          {/* Comment input */}
          <div className="flex gap-2">
            <input value={newComment} onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
              placeholder="Write a comment..."
              className="flex-1 h-8 rounded-md border border-border bg-transparent px-3 text-sm text-foreground placeholder:opacity-40 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              data-testid="comment-input" />
            <button onClick={handleComment} data-testid="submit-comment" className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Send size={14} />
            </button>
          </div>
        </div>

        {/* Delete */}
        <div className="pt-3 border-t border-border">
          <button onClick={handleDelete} data-testid="delete-entity-btn" className="text-xs text-red-500/60 hover:text-red-400 transition-colors">
            Delete this {data.type}
          </button>
        </div>
      </div>
    </div>
  );
}

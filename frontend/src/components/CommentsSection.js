import React, { useState, useEffect, useCallback } from 'react';
import { getComments, createComment, deleteComment } from '../lib/api';
import { Button } from '../components/ui/button';
import { ChatCircle, Trash, Lightning, User } from '@phosphor-icons/react';

export default function CommentsSection({ taskId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const data = await getComments(taskId);
      setComments(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [taskId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      await createComment({ task_id: taskId, content: newComment });
      setNewComment('');
      fetchComments();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteComment(id);
      fetchComments();
    } catch (e) { console.error(e); }
  };

  return (
    <div data-testid="comments-section">
      <div className="flex items-center gap-1 mb-3">
        <ChatCircle size={12} className="text-slate-500" />
        <span className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
          Activity & Comments ({comments.length})
        </span>
      </div>

      {/* Comment input */}
      <div className="flex gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User size={10} className="text-white" />
        </div>
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="Write a comment..."
            className="w-full border border-slate-200 rounded-md p-2 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-blue-700"
            data-testid="comment-input"
          />
          <div className="flex justify-end mt-1">
            <Button size="sm" onClick={handleSubmit} disabled={!newComment.trim()} className="bg-blue-700 hover:bg-blue-800 text-white h-7 text-xs px-3" data-testid="submit-comment-btn">
              Comment
            </Button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <p className="text-xs text-slate-400">Loading...</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {comments.map(c => (
            <div key={c.id} className={`flex gap-2 ${c.type === 'activity' ? 'opacity-70' : ''}`} data-testid={`comment-${c.id}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${c.type === 'activity' ? 'bg-slate-200' : 'bg-blue-700'}`}>
                {c.type === 'activity' ? (
                  <Lightning size={10} className="text-slate-500" />
                ) : (
                  <span className="text-[9px] font-semibold text-white">{c.user_name?.charAt(0)?.toUpperCase() || 'U'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">
                    {c.type === 'activity' ? 'System' : c.user_name || 'User'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {c.type === 'comment' && (
                    <button onClick={() => handleDelete(c.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500" data-testid={`delete-comment-${c.id}`}>
                      <Trash size={10} />
                    </button>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${c.type === 'activity' ? 'text-slate-500 italic' : 'text-slate-700'}`}>
                  {c.content}
                </p>
              </div>
            </div>
          ))}
          {comments.length === 0 && <p className="text-xs text-slate-400">No comments yet.</p>}
        </div>
      )}
    </div>
  );
}

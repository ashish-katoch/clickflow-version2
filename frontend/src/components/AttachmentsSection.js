import React, { useState, useEffect, useCallback } from 'react';
import { getAttachments, createAttachment, deleteAttachment } from '../lib/api';
import { Button } from '../components/ui/button';
import { Paperclip, Trash, File, FileImage, FileDoc, FilePdf, DownloadSimple } from '@phosphor-icons/react';

const FILE_ICONS = {
  'image/': FileImage,
  'application/pdf': FilePdf,
  'application/msword': FileDoc,
  'application/vnd': FileDoc,
};

function getFileIcon(type) {
  for (const [prefix, Icon] of Object.entries(FILE_ICONS)) {
    if (type.startsWith(prefix)) return Icon;
  }
  return File;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function AttachmentsSection({ taskId }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAttachments = useCallback(async () => {
    try {
      const data = await getAttachments(taskId);
      setAttachments(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [taskId]);

  useEffect(() => { fetchAttachments(); }, [fetchAttachments]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Convert to base64 data URL for storage
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await createAttachment({
          task_id: taskId,
          file_name: file.name,
          file_url: ev.target.result,
          file_size: file.size,
          file_type: file.type || 'application/octet-stream',
        });
        fetchAttachments();
      } catch (err) { console.error(err); }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id) => {
    try {
      await deleteAttachment(id);
      fetchAttachments();
    } catch (e) { console.error(e); }
  };

  return (
    <div data-testid="attachments-section">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <Paperclip size={12} className="text-slate-500" />
          <span className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
            Attachments ({attachments.length})
          </span>
        </div>
        <label className="cursor-pointer" data-testid="attach-file-btn">
          <input type="file" onChange={handleFileSelect} className="hidden" />
          <span className="text-xs text-blue-700 hover:text-blue-800 font-medium">+ Attach File</span>
        </label>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400">Loading...</p>
      ) : (
        <div className="space-y-1.5">
          {attachments.map(att => {
            const FileIcon = getFileIcon(att.file_type);
            return (
              <div key={att.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 group" data-testid={`attachment-${att.id}`}>
                <FileIcon size={16} className="text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-700 truncate">{att.file_name}</div>
                  <div className="text-[10px] text-slate-400">{formatFileSize(att.file_size)}</div>
                </div>
                <div className="flex items-center gap-1">
                  {att.file_url && att.file_url.startsWith('data:') && (
                    <a href={att.file_url} download={att.file_name} className="text-slate-300 hover:text-blue-500" data-testid={`download-${att.id}`}>
                      <DownloadSimple size={14} />
                    </a>
                  )}
                  <button onClick={() => handleDelete(att.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`delete-attachment-${att.id}`}>
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            );
          })}
          {attachments.length === 0 && <p className="text-xs text-slate-400">No attachments.</p>}
        </div>
      )}
    </div>
  );
}

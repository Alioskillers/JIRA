'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { Comment } from '@/types';
import { formatDate, getInitials } from '@/lib/utils';
import { CommentInput } from './CommentInput';

interface CommentThreadProps {
  taskId: string;
}

export function CommentThread({ taskId }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/tasks/${taskId}/comments`);
      setComments(res.data);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const handleCommentAdded = (comment: Comment) => {
    setComments(prev => [...prev, comment]);
  };

  return (
    <div>
      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5" />
        Comments ({comments.length})
      </label>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 mb-3 bg-red-500/10 px-3 py-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
          <button onClick={fetchComments} className="ml-auto underline">Retry</button>
        </div>
      )}

      {!loading && !error && comments.length > 0 && (
        <div className="space-y-3 mb-4">
          {comments.map(c => (
            <div key={c.commentId} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-sky-600/30 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-medium text-sky-300">{getInitials(c.authorName)}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-medium text-zinc-300">{c.authorName}</span>
                  <span className="text-[10px] text-zinc-600">{formatDate(c.createdAt)}</span>
                </div>
                <p className="text-sm text-zinc-400 bg-zinc-800 rounded-lg px-3 py-2">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && comments.length === 0 && (
        <p className="text-xs text-zinc-600 mb-3">No comments yet.</p>
      )}

      <CommentInput taskId={taskId} onCommentAdded={handleCommentAdded} />
    </div>
  );
}

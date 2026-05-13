'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { Comment } from '@/types';
import toast from 'react-hot-toast';

interface CommentInputProps {
  taskId: string;
  onCommentAdded: (comment: Comment) => void;
}

export function CommentInput({ taskId, onCommentAdded }: CommentInputProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await api.post(`/tasks/${taskId}/comments`, { content: content.trim() });
      onCommentAdded(res.data);
      setContent('');
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Add a comment..."
        className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-colors"
      />
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="p-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg transition-all"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </button>
    </form>
  );
}

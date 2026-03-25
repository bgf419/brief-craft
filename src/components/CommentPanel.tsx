"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  Pin,
  Send,
  MessageSquare,
  AtSign,
} from "lucide-react";
import toast from "react-hot-toast";

interface Comment {
  id: string;
  text: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  isResolved: boolean;
  isPinned: boolean;
  parentId: string | null;
  replies?: Comment[];
}

interface CommentPanelProps {
  scriptId: string;
  isOpen: boolean;
  onClose: () => void;
}

const MOCK_USERS = [
  { name: "Alice", id: "u1" },
  { name: "Bob", id: "u2" },
  { name: "Charlie", id: "u3" },
  { name: "Diana", id: "u4" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CommentBubble({
  comment,
  onResolve,
  onPin,
  onReply,
  isReply = false,
}: {
  comment: Comment;
  onResolve: (id: string) => void;
  onPin: (id: string) => void;
  onReply: (id: string) => void;
  isReply?: boolean;
}) {
  return (
    <div
      className={`group ${isReply ? "ml-8 mt-2" : ""} ${
        comment.isResolved ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#1e1e1e] transition-colors">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#6366f1]/20 flex items-center justify-center text-xs font-bold text-[#818cf8]">
          {comment.authorName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-[#e5e5e5]">
              {comment.authorName}
            </span>
            <span className="text-[10px] text-[#666]">
              {timeAgo(comment.createdAt)}
            </span>
            {comment.isPinned && (
              <Pin className="h-3 w-3 text-[#f59e0b]" fill="currentColor" />
            )}
          </div>
          <p className="text-sm text-[#999] leading-relaxed whitespace-pre-wrap">
            {comment.text}
          </p>
          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onResolve(comment.id)}
              className={`p-1 rounded text-xs ${
                comment.isResolved
                  ? "text-[#22c55e]"
                  : "text-[#666] hover:text-[#22c55e]"
              } transition-colors`}
              title={comment.isResolved ? "Unresolve" : "Resolve"}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onPin(comment.id)}
              className={`p-1 rounded text-xs ${
                comment.isPinned
                  ? "text-[#f59e0b]"
                  : "text-[#666] hover:text-[#f59e0b]"
              } transition-colors`}
              title={comment.isPinned ? "Unpin" : "Pin"}
            >
              <Pin className="h-3.5 w-3.5" />
            </button>
            {!isReply && (
              <button
                onClick={() => onReply(comment.id)}
                className="p-1 rounded text-xs text-[#666] hover:text-[#6366f1] transition-colors"
                title="Reply"
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
      {comment.replies?.map((reply) => (
        <CommentBubble
          key={reply.id}
          comment={reply}
          onResolve={onResolve}
          onPin={onPin}
          onReply={onReply}
          isReply
        />
      ))}
    </div>
  );
}

export default function CommentPanel({
  scriptId,
  isOpen,
  onClose,
}: CommentPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchComments();
  }, [isOpen, scriptId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?scriptId=${scriptId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId,
          text: input.trim(),
          parentId: replyingTo,
        }),
      });
      if (res.ok) {
        const newComment = await res.json();
        if (replyingTo) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyingTo
                ? { ...c, replies: [...(c.replies || []), newComment] }
                : c
            )
          );
        } else {
          setComments((prev) => [...prev, newComment]);
        }
        setInput("");
        setReplyingTo(null);
        toast.success("Comment added");
      }
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleResolve = async (id: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isResolved: !c.isResolved } : c
      )
    );
    try {
      await fetch(`/api/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggleResolve: true }),
      });
    } catch {
      toast.error("Failed to update");
    }
  };

  const handlePin = async (id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
    try {
      await fetch(`/api/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ togglePin: true }),
      });
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    const lastChar = val.slice(-1);
    setShowMentions(lastChar === "@");
  };

  const insertMention = (userName: string) => {
    setInput((prev) => prev.replace(/@$/, `@${userName} `));
    setShowMentions(false);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  const pinned = comments.filter((c) => c.isPinned);
  const unpinned = comments.filter((c) => !c.isPinned);

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-[#0a0a0a] border-l border-[#2a2a2a] z-40 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
        <h3 className="text-sm font-semibold text-[#e5e5e5] flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#6366f1]" />
          Comments
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded text-[#666] hover:text-[#e5e5e5] hover:bg-[#1e1e1e] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {loading && (
          <p className="text-center text-xs text-[#666] py-6">
            Loading comments...
          </p>
        )}
        {!loading && comments.length === 0 && (
          <p className="text-center text-xs text-[#666] py-6">
            No comments yet. Start a conversation.
          </p>
        )}
        {pinned.map((c) => (
          <CommentBubble
            key={c.id}
            comment={c}
            onResolve={handleResolve}
            onPin={handlePin}
            onReply={setReplyingTo}
          />
        ))}
        {pinned.length > 0 && unpinned.length > 0 && (
          <div className="border-t border-[#2a2a2a] my-2" />
        )}
        {unpinned.map((c) => (
          <CommentBubble
            key={c.id}
            comment={c}
            onResolve={handleResolve}
            onPin={handlePin}
            onReply={setReplyingTo}
          />
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-[#2a2a2a] p-4">
        {replyingTo && (
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-xs text-[#666]">Replying to thread</span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-xs text-[#666] hover:text-[#e5e5e5]"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Add a comment... (@ to mention)"
            rows={2}
            className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2.5 pr-10 text-sm text-[#e5e5e5] placeholder-[#666] resize-none focus:outline-none focus:border-[#6366f1]/50 transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="absolute right-2.5 bottom-2.5 p-1.5 rounded-md text-[#6366f1] hover:bg-[#6366f1]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>

          {showMentions && (
            <div className="absolute bottom-full left-0 mb-1 w-48 bg-[#141414] border border-[#2a2a2a] rounded-lg shadow-xl overflow-hidden">
              {MOCK_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => insertMention(user.name)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#999] hover:bg-[#1e1e1e] hover:text-[#e5e5e5] transition-colors"
                >
                  <AtSign className="h-3.5 w-3.5 text-[#6366f1]" />
                  {user.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

interface Author {
  id: string;
  name: string;
  avatar?: string | null;
}

interface Comment {
  id: string;
  content: string;
  author: Author;
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
      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#f1f3f4] transition-colors">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#e8f0fe] flex items-center justify-center text-xs font-bold text-[#1a73e8]">
          {comment.author.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-[#202124]">
              {comment.author.name}
            </span>
            <span className="text-[10px] text-[#80868b]">
              {timeAgo(comment.createdAt)}
            </span>
            {comment.isPinned && (
              <Pin className="h-3 w-3 text-[#1a73e8]" fill="currentColor" />
            )}
          </div>
          <p className="text-sm text-[#5f6368] leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onResolve(comment.id)}
              className={`p-1 rounded text-xs ${
                comment.isResolved
                  ? "text-[#188038]"
                  : "text-[#80868b] hover:text-[#188038]"
              } transition-colors`}
              title={comment.isResolved ? "Unresolve" : "Resolve"}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onPin(comment.id)}
              className={`p-1 rounded text-xs ${
                comment.isPinned
                  ? "text-[#1a73e8]"
                  : "text-[#80868b] hover:text-[#1a73e8]"
              } transition-colors`}
              title={comment.isPinned ? "Unpin" : "Pin"}
            >
              <Pin className="h-3.5 w-3.5" />
            </button>
            {!isReply && (
              <button
                onClick={() => onReply(comment.id)}
                className="p-1 rounded text-xs text-[#80868b] hover:text-[#1a73e8] transition-colors"
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
  const [currentUser, setCurrentUser] = useState<Author | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchCurrentUser();
    fetchComments();
  }, [isOpen, scriptId]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const user = await res.json();
        setCurrentUser({ id: user.id, name: user.name, avatar: user.avatar });
      }
    } catch {
      // silently fail
    }
  };

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
    if (!input.trim() || !currentUser) return;
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId,
          content: input.trim(),
          authorId: currentUser.id,
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
    const comment = comments.find((c) => c.id === id);
    const newValue = comment ? !comment.isResolved : true;
    setComments((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isResolved: !c.isResolved } : c
      )
    );
    try {
      await fetch(`/api/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResolved: newValue }),
      });
    } catch {
      toast.error("Failed to update");
    }
  };

  const handlePin = async (id: string) => {
    const comment = comments.find((c) => c.id === id);
    const newValue = comment ? !comment.isPinned : true;
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
    try {
      await fetch(`/api/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: newValue }),
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
    <div className="fixed top-0 right-0 h-full w-96 bg-[#ffffff] border-l border-[#dadce0] z-40 flex flex-col shadow-lg animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#dadce0]">
        <h3 className="text-sm font-semibold text-[#202124] flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#1a73e8]" />
          Comments
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {loading && (
          <p className="text-center text-xs text-[#80868b] py-6">
            Loading comments...
          </p>
        )}
        {!loading && comments.length === 0 && (
          <p className="text-center text-xs text-[#80868b] py-6">
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
          <div className="border-t border-[#dadce0] my-2" />
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
      <div className="border-t border-[#dadce0] p-4">
        {replyingTo && (
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-xs text-[#5f6368]">Replying to thread</span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-xs text-[#5f6368] hover:text-[#202124]"
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
            className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-lg px-3 py-2.5 pr-10 text-sm text-[#202124] placeholder-[#80868b] resize-none focus:outline-none focus:border-[#1a73e8] transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="absolute right-2.5 bottom-2.5 p-1.5 rounded-md text-[#1a73e8] hover:bg-[#e8f0fe] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>

          {showMentions && (
            <div className="absolute bottom-full left-0 mb-1 w-48 bg-[#ffffff] border border-[#dadce0] rounded-lg shadow-lg overflow-hidden">
              {MOCK_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => insertMention(user.name)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124] transition-colors"
                >
                  <AtSign className="h-3.5 w-3.5 text-[#1a73e8]" />
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

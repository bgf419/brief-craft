"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Monitor,
  Users,
  Timer,
  X,
  MousePointer2,
} from "lucide-react";
import Button from "./Button";

interface LiveReviewBarProps {
  isActive: boolean;
  onToggle: () => void;
}

const SIMULATED_USERS = [
  { name: "Sarah K.", color: "#6366f1" },
  { name: "Mike R.", color: "#22c55e" },
  { name: "Jess T.", color: "#f59e0b" },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function LiveReviewBar({
  isActive,
  onToggle,
}: LiveReviewBarProps) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [cursorPositions, setCursorPositions] = useState<
    { name: string; color: string; x: number; y: number }[]
  >([]);

  useEffect(() => {
    if (isActive) {
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);

      // Simulate cursor movements
      const cursorInterval = setInterval(() => {
        setCursorPositions(
          SIMULATED_USERS.map((u) => ({
            ...u,
            x: Math.random() * 80 + 10,
            y: Math.random() * 80 + 10,
          }))
        );
      }, 2000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        clearInterval(cursorInterval);
      };
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCursorPositions([]);
    }
  }, [isActive]);

  if (!isActive) {
    return (
      <div className="flex items-center">
        <Button
          variant="secondary"
          size="sm"
          icon={<Monitor className="h-4 w-4" />}
          onClick={onToggle}
        >
          Present Mode
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-[#6366f1] text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-xs font-semibold">LIVE REVIEW</span>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-1.5 text-xs font-mono bg-white/10 rounded-md px-2.5 py-1">
            <Timer className="h-3.5 w-3.5" />
            {formatTime(elapsed)}
          </div>
        </div>

        {/* Connected users */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="text-xs">
              {SIMULATED_USERS.length + 1} connected
            </span>
          </div>
          <div className="flex -space-x-2">
            <div className="w-7 h-7 rounded-full bg-white text-[#6366f1] flex items-center justify-center text-[10px] font-bold border-2 border-[#6366f1] z-10">
              You
            </div>
            {SIMULATED_USERS.map((user) => (
              <div
                key={user.name}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#6366f1]"
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.name.charAt(0)}
              </div>
            ))}
          </div>
        </div>

        {/* End button */}
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          End Review
        </button>
      </div>

      {/* Simulated cursors */}
      {cursorPositions.map((cursor) => (
        <div
          key={cursor.name}
          className="fixed pointer-events-none z-40 transition-all duration-1000 ease-in-out"
          style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
        >
          <MousePointer2
            className="h-4 w-4"
            style={{ color: cursor.color }}
            fill={cursor.color}
          />
          <span
            className="ml-2 -mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.name}
          </span>
        </div>
      ))}
    </>
  );
}

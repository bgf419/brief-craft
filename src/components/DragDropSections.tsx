"use client";

import React, { type ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface Section {
  id: string;
  title: string;
  order: number;
  rows: { id: string; col1: string; col2: string; col3: string; order: number }[];
}

interface DragDropSectionsProps {
  sections: Section[];
  onReorder: (sections: Section[]) => void;
  children: (section: Section, dragHandle: ReactNode) => ReactNode;
}

function SortableItem({
  section,
  children,
}: {
  section: Section;
  children: (dragHandle: ReactNode) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
  };

  const dragHandle = (
    <button
      className="p-1 cursor-grab active:cursor-grabbing text-[#666] hover:text-[#999] transition-colors"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${
        isDragging
          ? "border border-[#6366f1]/50 rounded-lg bg-[#141414] shadow-lg shadow-[#6366f1]/10"
          : ""
      }`}
    >
      {children(dragHandle)}
    </div>
  );
}

export default function DragDropSections({
  sections,
  onReorder,
  children,
}: DragDropSectionsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);

    const reordered = arrayMove(sections, oldIndex, newIndex).map(
      (section, idx) => ({
        ...section,
        order: idx,
      })
    );

    onReorder(reordered);

    try {
      await fetch("/api/sections/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: reordered.map((s) => ({ id: s.id, order: s.order })),
        }),
      });
    } catch {
      // revert handled by parent
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        {sections.map((section) => (
          <SortableItem key={section.id} section={section}>
            {(dragHandle) => children(section, dragHandle)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}

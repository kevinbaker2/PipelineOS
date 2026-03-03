"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TeamNote } from "@/types";
import { addTeamNote, deleteTeamNote } from "@/actions/notes";

const colorOptions = [
  { value: "yellow", bg: "bg-yellow-500/15 border-yellow-500/30", label: "bg-yellow-400" },
  { value: "blue", bg: "bg-blue-500/15 border-blue-500/30", label: "bg-blue-400" },
  { value: "green", bg: "bg-emerald-500/15 border-emerald-500/30", label: "bg-emerald-400" },
  { value: "pink", bg: "bg-pink-500/15 border-pink-500/30", label: "bg-pink-400" },
  { value: "purple", bg: "bg-purple-500/15 border-purple-500/30", label: "bg-purple-400" },
];

const colorMap: Record<string, string> = {
  yellow: "bg-yellow-500/15 border-yellow-500/30",
  blue: "bg-blue-500/15 border-blue-500/30",
  green: "bg-emerald-500/15 border-emerald-500/30",
  pink: "bg-pink-500/15 border-pink-500/30",
  purple: "bg-purple-500/15 border-purple-500/30",
};

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

interface MotivationBoardProps {
  notes: TeamNote[];
  currentUserId: string;
}

export function MotivationBoard({ notes, currentUserId }: MotivationBoardProps) {
  const [selectedColor, setSelectedColor] = useState("yellow");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    formData.set("color", selectedColor);
    startTransition(async () => {
      await addTeamNote(formData);
    });
  };

  const handleDelete = (noteId: string) => {
    startTransition(async () => {
      await deleteTeamNote(noteId);
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Team Board</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add note form */}
        <form action={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <input
              name="content"
              type="text"
              placeholder="Share a win, tip, or shoutout..."
              className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
              maxLength={280}
            />
            <Button type="submit" size="sm" disabled={isPending}>
              Post
            </Button>
          </div>
          <div className="flex items-center gap-1.5">
            {colorOptions.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelectedColor(c.value)}
                className={cn(
                  "h-4 w-4 rounded-full transition-all",
                  c.label,
                  selectedColor === c.value ? "ring-2 ring-white ring-offset-2 ring-offset-background" : "opacity-50 hover:opacity-75"
                )}
              />
            ))}
          </div>
        </form>

        {/* Notes list */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {notes.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No notes yet. Be the first to post!
            </p>
          )}
          {notes.map((note) => (
            <div
              key={note.id}
              className={cn(
                "relative rounded-lg border p-3 transition-all",
                colorMap[note.color] ?? colorMap.yellow
              )}
            >
              <p className="text-sm pr-6">{note.content}</p>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="font-medium">{note.user_name}</span>
                <span>{timeAgo(note.created_at)}</span>
              </div>
              {note.user_id === currentUserId && (
                <button
                  onClick={() => handleDelete(note.id)}
                  className="absolute right-2 top-2 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 [div:hover>&]:opacity-100"
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

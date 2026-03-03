"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Building2, DollarSign, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatCurrency } from "@/lib/utils";
import type { Lead, PhaseSetting } from "@/types";
import { updateLeadPhase } from "@/actions/leads";
import Link from "next/link";

interface KanbanBoardProps {
  leadsByPhase: Record<string, Lead[]>;
  phases: PhaseSetting[];
}

function LeadCard({ lead, isDragging }: { lead: Lead; isDragging?: boolean }) {
  const scoreColor =
    lead.score >= 70
      ? "text-emerald-400"
      : lead.score >= 40
      ? "text-amber-400"
      : "text-red-400";

  return (
    <Link href={`/leads/${lead.id}`}>
      <Card
        className={cn(
          "cursor-pointer transition-all hover:border-primary/50",
          isDragging && "rotate-2 shadow-xl"
        )}
      >
        <CardContent className="p-3">
          <div className="mb-2 flex items-start justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium truncate">
                {lead.company_name}
              </span>
            </div>
            <span className={cn("text-xs font-bold shrink-0 ml-2", scoreColor)}>
              {lead.score}
            </span>
          </div>
          <p className="mb-2 text-xs text-muted-foreground truncate">
            {lead.contact_name}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(lead.expected_mrr)}
            </div>
            <Badge
              variant={lead.source === "inbound" ? "default" : "secondary"}
              className="text-[10px] px-1.5 py-0"
            >
              {lead.source}
            </Badge>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-2.5 w-2.5" />
            {lead.forecast_month}
            <span className="ml-auto">{lead.probability}%</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SortableLeadCard({ lead }: { lead: Lead }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, data: { lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} />
    </div>
  );
}

const MAX_VISIBLE = 3;

function sortByRecent(leads: Lead[]): Lead[] {
  return [...leads].sort(
    (a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
  );
}

function DroppableColumn({
  phase,
  phaseLeads,
  phaseColor,
  totalMRR,
}: {
  phase: string;
  phaseLeads: Lead[];
  phaseColor: string;
  totalMRR: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: phase });
  const sorted = sortByRecent(phaseLeads);
  const visible = sorted.slice(0, MAX_VISIBLE);
  const hiddenCount = phaseLeads.length - visible.length;

  return (
    <div
      key={phase}
      className={cn(
        "flex w-72 min-w-[288px] flex-col rounded-xl border bg-card/50 transition-colors",
        isOver && "border-primary/50 bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: phaseColor }}
          />
          <h3 className="text-sm font-semibold">
            {phase} ({phaseLeads.length})
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatCurrency(totalMRR)}
        </span>
      </div>

      <ScrollArea className="flex-1 px-2 pb-2">
        <div ref={setNodeRef} className="min-h-[80px]">
          <SortableContext
            id={phase}
            items={visible.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2 p-1">
              {visible.map((lead) => (
                <SortableLeadCard key={lead.id} lead={lead} />
              ))}
              {phaseLeads.length === 0 && (
                <div className="rounded-lg border-2 border-dashed p-8 text-center text-xs text-muted-foreground">
                  Drop leads here
                </div>
              )}
            </div>
          </SortableContext>
          {hiddenCount > 0 && (
            <div className="px-1 pb-1 pt-2">
              <Link
                href={`/leads?phase=${encodeURIComponent(phase)}`}
                className="flex w-full items-center justify-center rounded-lg border border-dashed py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                View {hiddenCount} more
              </Link>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function KanbanBoard({ leadsByPhase, phases }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [columns, setColumns] = useState(leadsByPhase);
  const [mobilePhase, setMobilePhase] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const activeLead = activeId
    ? Object.values(columns)
        .flat()
        .find((l) => l.id === activeId)
    : null;

  const visiblePhases = phases.filter(
    (p) => p.name !== "Closed Won" && p.name !== "Closed Lost"
  );

  const activeMobilePhase = mobilePhase || visiblePhases[0]?.name || "";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeLeadId = active.id as string;

    // Find which column the lead was dropped into
    let targetPhase: string | null = null;

    // Check if dropped on a column directly (useDroppable id = phase name)
    const phaseNames = phases.map((p) => p.name);
    if (phaseNames.includes(over.id as string)) {
      targetPhase = over.id as string;
    } else {
      // Dropped on another card — find which column it belongs to
      for (const [phase, leads] of Object.entries(columns)) {
        if (leads.some((l) => l.id === over.id)) {
          targetPhase = phase;
          break;
        }
      }
    }

    if (!targetPhase) return;

    // Find current phase
    let sourcePhase: string | null = null;
    for (const [phase, leads] of Object.entries(columns)) {
      if (leads.some((l) => l.id === activeLeadId)) {
        sourcePhase = phase;
        break;
      }
    }

    if (!sourcePhase || sourcePhase === targetPhase) return;

    // Optimistic update
    const lead = columns[sourcePhase].find((l) => l.id === activeLeadId);
    if (!lead) return;

    const newColumns = { ...columns };
    newColumns[sourcePhase] = columns[sourcePhase].filter(
      (l) => l.id !== activeLeadId
    );
    newColumns[targetPhase] = [
      ...(columns[targetPhase] || []),
      { ...lead, phase: targetPhase },
    ];
    setColumns(newColumns);

    // Persist to database
    startTransition(async () => {
      const result = await updateLeadPhase(activeLeadId, targetPhase as string);
      if (result?.error) {
        console.error("[KanbanBoard] Failed to update phase:", result.error);
        // Revert on error
        setColumns(columns);
      }
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Mobile: phase tabs + single column view */}
      <div className="md:hidden">
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1 mb-4">
          {visiblePhases.map((phase) => {
            const count = (columns[phase.name] || []).length;
            const isActive = activeMobilePhase === phase.name;
            return (
              <button
                key={phase.name}
                type="button"
                onClick={() => setMobilePhase(phase.name)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: phase.color }}
                />
                {phase.name}
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>

        {visiblePhases
          .filter((p) => p.name === activeMobilePhase)
          .map((phase) => {
            const phaseLeads = columns[phase.name] || [];
            const sorted = sortByRecent(phaseLeads);
            const visible = sorted.slice(0, MAX_VISIBLE);
            const hiddenCount = phaseLeads.length - visible.length;
            const totalMRR = phaseLeads.reduce(
              (sum, l) => sum + Number(l.expected_mrr),
              0
            );
            return (
              <div key={phase.name}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: phase.color }}
                    />
                    <h3 className="text-sm font-semibold">
                      {phase.name} ({phaseLeads.length})
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(totalMRR)}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {visible.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                  {phaseLeads.length === 0 && (
                    <div className="rounded-lg border-2 border-dashed p-8 text-center text-xs text-muted-foreground">
                      No leads in this phase
                    </div>
                  )}
                  {hiddenCount > 0 && (
                    <Link
                      href={`/leads?phase=${encodeURIComponent(phase.name)}`}
                      className="flex w-full items-center justify-center rounded-lg border border-dashed py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      View {hiddenCount} more
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Desktop: horizontal drag columns */}
      <div className="hidden md:flex gap-4 overflow-x-auto pb-4">
        {visiblePhases.map((phase) => {
          const phaseLeads = columns[phase.name] || [];
          const totalMRR = phaseLeads.reduce(
            (sum, l) => sum + Number(l.expected_mrr),
            0
          );

          return (
            <DroppableColumn
              key={phase.name}
              phase={phase.name}
              phaseLeads={phaseLeads}
              phaseColor={phase.color}
              totalMRR={totalMRR}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

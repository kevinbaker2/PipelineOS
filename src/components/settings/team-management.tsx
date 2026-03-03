"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Shield, User } from "lucide-react";
import { inviteUser, updateUserRole, updateUserMissionCategories } from "@/actions/team";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  mission_categories: string[] | null;
  created_at: string;
}

interface TeamManagementProps {
  members: TeamMember[];
  currentUserId: string;
}

const MISSION_TOGGLES = [
  { key: "sales", label: "Sales", emoji: "\uD83D\uDCBC" },
  { key: "marketing", label: "Marketing", emoji: "\uD83D\uDCE3" },
  { key: "lead_generation", label: "Lead Gen", emoji: "\uD83C\uDFAF" },
];

export function TeamManagement({ members, currentUserId }: TeamManagementProps) {
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleInvite(formData: FormData) {
    setInviteError("");
    setInviteSuccess(false);
    startTransition(async () => {
      const result = await inviteUser(formData);
      if (result.error) {
        setInviteError(result.error);
      } else {
        setInviteSuccess(true);
        setTimeout(() => setInviteSuccess(false), 3000);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4" />
            Invite Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleInvite} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                placeholder="colleague@company.com"
                required
              />
            </div>
            <div className="w-full space-y-2 sm:w-[140px]">
              <Label>Role</Label>
              <Select name="role" defaultValue="sales">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isPending} className="gap-2">
              <UserPlus className="h-4 w-4" />
              {isPending ? "Sending..." : "Send Invite"}
            </Button>
          </form>
          {inviteError && (
            <p className="mt-3 text-sm text-red-400">{inviteError}</p>
          )}
          {inviteSuccess && (
            <p className="mt-3 text-sm text-emerald-400">
              Invite sent successfully!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Team Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile: card layout */}
          <div className="flex flex-col gap-3 md:hidden">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isSelf={member.id === currentUserId}
              />
            ))}
            {members.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No team members found
              </div>
            )}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block rounded-lg border">
            <div className="grid items-center gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground md:grid-cols-[2fr_2fr_1fr_auto_1fr]">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Missions</span>
              <span>Joined</span>
            </div>
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isSelf={member.id === currentUserId}
              />
            ))}
            {members.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No team members found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MissionToggles({
  userId,
  categories,
}: {
  userId: string;
  categories: string[];
}) {
  const [active, setActive] = useState<Set<string>>(new Set(categories));
  const [, startTransition] = useTransition();

  function toggle(key: string) {
    const next = new Set(active);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setActive(next);
    startTransition(async () => {
      await updateUserMissionCategories(userId, Array.from(next));
    });
  }

  return (
    <div className="flex gap-1.5">
      {MISSION_TOGGLES.map((t) => {
        const isOn = active.has(t.key);
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => toggle(t.key)}
            title={t.label}
            className={cn(
              "rounded-md border px-2 py-1 text-[10px] font-medium transition-all",
              isOn
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-muted/30 text-muted-foreground opacity-50 hover:opacity-75"
            )}
          >
            {t.emoji} {t.label}
          </button>
        );
      })}
    </div>
  );
}

function MemberCard({
  member,
  isSelf,
}: {
  member: TeamMember;
  isSelf: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(newRole: string) {
    startTransition(async () => {
      await updateUserRole(member.id, newRole);
    });
  }

  const categories = member.mission_categories ?? ["sales", "marketing"];

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          {member.role === "admin" ? (
            <Shield className="h-4 w-4 text-primary" />
          ) : (
            <User className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {member.full_name}
            {isSelf && (
              <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
        </div>
        <div className="shrink-0">
          {isSelf ? (
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/20"
            >
              {member.role}
            </Badge>
          ) : (
            <Select
              value={member.role}
              onValueChange={handleRoleChange}
              disabled={isPending}
            >
              <SelectTrigger className="h-8 w-[90px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <MissionToggles userId={member.id} categories={categories} />
    </div>
  );
}

function MemberRow({
  member,
  isSelf,
}: {
  member: TeamMember;
  isSelf: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(newRole: string) {
    startTransition(async () => {
      await updateUserRole(member.id, newRole);
    });
  }

  const joinedDate = new Date(member.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const categories = member.mission_categories ?? ["sales", "marketing"];

  return (
    <div className="grid items-center gap-4 border-b px-4 py-3 last:border-0 md:grid-cols-[2fr_2fr_1fr_auto_1fr]">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          {member.role === "admin" ? (
            <Shield className="h-4 w-4 text-primary" />
          ) : (
            <User className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {member.full_name}
            {isSelf && (
              <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
            )}
          </p>
        </div>
      </div>
      <div className="text-sm text-muted-foreground truncate">
        {member.email}
      </div>
      <div>
        {isSelf ? (
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20"
          >
            {member.role}
          </Badge>
        ) : (
          <Select
            value={member.role}
            onValueChange={handleRoleChange}
            disabled={isPending}
          >
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      <MissionToggles userId={member.id} categories={categories} />
      <div className="text-sm text-muted-foreground">{joinedDate}</div>
    </div>
  );
}

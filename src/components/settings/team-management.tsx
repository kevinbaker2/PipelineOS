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
import { inviteUser, updateUserRole } from "@/actions/team";

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface TeamManagementProps {
  members: TeamMember[];
  currentUserId: string;
}

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

      {/* Members table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Team Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <div className="hidden items-center gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[2fr_2fr_1fr_1fr]">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
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

  return (
    <div className="grid items-center gap-4 border-b px-4 py-3 last:border-0 md:grid-cols-[2fr_2fr_1fr_1fr]">
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
      <div className="text-sm text-muted-foreground">{joinedDate}</div>
    </div>
  );
}

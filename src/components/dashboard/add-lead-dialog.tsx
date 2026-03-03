"use client";

import { useState, useRef, useCallback } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLead } from "@/actions/leads";

export function AddLeadDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const hasInput = useCallback(() => {
    if (!formRef.current) return false;
    const data = new FormData(formRef.current);
    const company = (data.get("company_name") as string)?.trim();
    const contact = (data.get("contact_name") as string)?.trim();
    const email = (data.get("email") as string)?.trim();
    const phone = (data.get("phone") as string)?.trim();
    const sourceNote = (data.get("source_note") as string)?.trim();
    return !!(company || contact || email || phone || sourceNote);
  }, []);

  function handleClose() {
    if (hasInput()) {
      if (!confirm("Are you sure you want to close? Your input will be lost.")) return;
    }
    setOpen(false);
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await createLead(formData);
    setLoading(false);
    if (result?.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!next) {
        handleClose();
      } else {
        setOpen(true);
      }
    }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-lg border-border/60 shadow-xl"
        hideClose
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          handleClose();
        }}
      >
        {/* Custom close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>Enter the lead details below.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company</Label>
                <Input id="company_name" name="company_name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact</Label>
                <Input id="contact_name" name="contact_name" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" placeholder="Optional" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source_note">How did you meet?</Label>
              <Input
                id="source_note"
                name="source_note"
                placeholder="e.g. LinkedIn, Instagram, Event X, Referral by John"
                maxLength={200}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expected_mrr">Expected MRR ($)</Label>
                <Input
                  id="expected_mrr"
                  name="expected_mrr"
                  type="number"
                  min="0"
                  step="100"
                  defaultValue="1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="probability">Probability (%)</Label>
                <Input
                  id="probability"
                  name="probability"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue="20"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select name="source" defaultValue="inbound">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sector</Label>
                <Select name="sector" defaultValue="Technology">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" name="country" defaultValue="NL" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { FormField } from "@/lib/database.types";

interface Props {
  eventId: string;
  formTitle?: string;
  fields: FormField[];
}

export default function RegistrationForm({ eventId, formTitle, fields }: Props) {
  const [draftId, setDraftId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function createDraft() {
    if (!recoveryEmail) {
      toast.error("Please enter a recovery email");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/registrations/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, recovery_email: recoveryEmail }),
    });
    const data = await res.json();
    if (res.ok) {
      setDraftId(data.draft_id);
      toast.success("Draft created! Save your draft ID: " + data.draft_id);
    } else {
      toast.error(data.error ?? "Failed to create draft");
    }
    setLoading(false);
  }

  async function saveDraft() {
    if (!draftId) return;
    setLoading(true);
    const res = await fetch("/api/registrations/save", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draft_id: draftId,
        team_name: teamName,
        responses: Object.entries(responses).map(([field_id, value]) => ({
          field_id,
          value,
        })),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Draft saved");
    } else {
      toast.error(data.error ?? "Failed to save");
    }
    setLoading(false);
  }

  async function submitDraft() {
    if (!draftId) return;
    setLoading(true);
    const res = await fetch("/api/registrations/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft_id: draftId }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Registration submitted!");
    } else {
      toast.error(data.error ?? "Failed to submit");
    }
    setLoading(false);
  }

  if (!draftId) {
    return (
      <div className="space-y-4 rounded-lg border p-6">
        <h2 className="text-xl font-semibold">{formTitle ?? "Registration"}</h2>
        <div className="space-y-2">
          <Label htmlFor="recovery-email">Recovery Email</Label>
          <Input
            id="recovery-email"
            type="email"
            placeholder="team-lead@example.com"
            value={recoveryEmail}
            onChange={(e) => setRecoveryEmail(e.target.value)}
          />
        </div>
        <Button onClick={createDraft} disabled={loading} className="w-full">
          {loading ? "Creating..." : "Start Registration"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-lg border p-6">
      <div className="rounded-md bg-muted p-3 text-sm">
        <p className="font-medium">Your Draft ID: <code className="text-primary">{draftId}</code></p>
        <p className="mt-1 text-muted-foreground">Save this to recover your draft later.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="team-name">Team Name</Label>
        <Input
          id="team-name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Enter your team name"
        />
      </div>

      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="ml-1 text-destructive">*</span>}
          </Label>
          {field.field_type === "LONG_TEXT" ? (
            <textarea
              id={field.id}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={responses[field.id] ?? ""}
              onChange={(e) => setResponses((r) => ({ ...r, [field.id]: e.target.value }))}
              placeholder={field.placeholder ?? ""}
            />
          ) : (
            <Input
              id={field.id}
              value={responses[field.id] ?? ""}
              onChange={(e) => setResponses((r) => ({ ...r, [field.id]: e.target.value }))}
              placeholder={field.placeholder ?? ""}
            />
          )}
          {field.help_text && (
            <p className="text-xs text-muted-foreground">{field.help_text}</p>
          )}
        </div>
      ))}

      <div className="flex gap-3">
        <Button variant="outline" onClick={saveDraft} disabled={loading} className="flex-1">
          {loading ? "Saving..." : "Save Draft"}
        </Button>
        <Button onClick={submitDraft} disabled={loading} className="flex-1">
          {loading ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}

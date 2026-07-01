"use client";

import { useState } from "react";
import { Search, Activity, UserCheck, Shield, Star, FileText, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

type AuditEntry = {
  id: string;
  action: string;
  actor_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  details: unknown;
  created_at: string;
};

const actionIcon: Record<string, React.ElementType> = {
  USER_APPROVED: UserCheck,
  USER_REJECTED: UserCheck,
  ROLE_CHANGED: Shield,
  SCORE_SUBMITTED: Star,
  FORM_LOCKED: FileText,
  EVENT_CREATED: Activity,
  EVENT_TRANSITIONED: Activity,
  SCORE_VOIDED: Trash2,
};

const actionColor: Record<string, string> = {
  USER_APPROVED: "text-green-600 bg-green-50 dark:bg-green-950/50",
  USER_REJECTED: "text-red-600 bg-red-50 dark:bg-red-950/50",
  ROLE_CHANGED: "text-blue-600 bg-blue-50 dark:bg-blue-950/50",
  SCORE_SUBMITTED: "text-amber-600 bg-amber-50 dark:bg-amber-950/50",
  FORM_LOCKED: "text-purple-600 bg-purple-50 dark:bg-purple-950/50",
  EVENT_CREATED: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50",
  EVENT_TRANSITIONED: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50",
  SCORE_VOIDED: "text-rose-600 bg-rose-50 dark:bg-rose-950/50",
};

export function AuditLog({ logs }: { logs: AuditEntry[] }) {
  const [search, setSearch] = useState("");

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_id?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Filter by action, entity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((entry) => {
          const Icon = actionIcon[entry.action] ?? Activity;
          const color = actionColor[entry.action] ?? "text-gray-600 bg-gray-50 dark:bg-gray-950/50";
          return (
            <div
              key={entry.id}
              className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30"
            >
              <div className={`mt-0.5 rounded-lg p-1.5 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{entry.action.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.entity_type && `${entry.entity_type}: ${entry.entity_id ?? "—"}`}
                  {entry.details && typeof entry.details === "object"
                    ? <span className="ml-2">{(JSON.stringify(entry.details) ?? "").slice(0, 100)}</span>
                    : null}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDate(entry.created_at)}
              </span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">No audit entries found</div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  Search,
  Shield,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string | null;
};

const roleBadge: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  JUDGE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  MAINTAINER: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const statusBadge: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  SUSPENDED: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

export function UsersTable({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = profiles.filter(
    (p) =>
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.full_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const doAction = async (
    userId: string,
    action: string,
    extra?: Record<string, string>,
  ) => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, ...extra }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error);
      return;
    }
    toast.success("User updated");
    router.refresh();
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {(p.full_name?.[0] ?? p.email?.[0] ?? "?").toUpperCase()}
                    </div>
                    <span className="font-medium">{p.full_name ?? "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge[p.role] ?? ""}`}
                  >
                    <Shield className="h-3 w-3" />
                    {p.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[p.status] ?? ""}`}
                  >
                    {p.status === "APPROVED" && <UserCheck className="h-3 w-3" />}
                    {p.status === "PENDING" && <Clock className="h-3 w-3" />}
                    {p.status === "REJECTED" && <UserX className="h-3 w-3" />}
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.created_at
                    ? new Date(p.created_at).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {p.id !== currentUserId && (
                    <div className="flex items-center justify-end gap-1">
                      {p.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => doAction(p.id, "approve")}
                            className="rounded p-1 text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-green-950/50"
                            title="Approve"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => doAction(p.id, "reject")}
                            className="rounded p-1 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/50"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <RoleDropdown userId={p.id} currentRole={p.role} onSelect={doAction} />
                      {p.status === "APPROVED" && (
                        <button
                          onClick={() => doAction(p.id, "change-status", { status: "SUSPENDED" })}
                          className="rounded p-1 text-gray-600 transition-colors hover:bg-gray-50 dark:hover:bg-gray-950/50"
                          title="Suspend"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      )}
                      {p.status === "SUSPENDED" && (
                        <button
                          onClick={() => doAction(p.id, "change-status", { status: "APPROVED" })}
                          className="rounded p-1 text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-green-950/50"
                          title="Reactivate"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoleDropdown({
  userId,
  currentRole,
  onSelect,
}: {
  userId: string;
  currentRole: string;
  onSelect: (userId: string, action: string, extra: Record<string, string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const roles = ["SUPER_ADMIN", "ADMIN", "JUDGE", "MAINTAINER"];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent"
        title="Change role"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-40 rounded-md border bg-popover p-1 shadow-md">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => {
                  onSelect(userId, "change-role", { role });
                  setOpen(false);
                }}
                className={`w-full rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent ${
                  role === currentRole ? "bg-accent font-medium" : ""
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

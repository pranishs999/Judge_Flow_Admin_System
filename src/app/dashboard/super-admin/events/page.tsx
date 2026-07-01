import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarCheck, Users, Award, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SuperAdminEvents() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const jwtRole = user.app_metadata?.role as string | undefined;
  const { data: profile } = !jwtRole
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const role = jwtRole ?? profile?.role;
  if (role !== "SUPER_ADMIN") redirect("/login");

  const { data: events } = await supabase
    .from("events")
    .select("id, name, slug, status, event_type, created_at, created_by")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const { data: eventCounts } = await supabase
    .from("events")
    .select("status")
    .is("deleted_at", null);

  const statusCounts: Record<string, number> = {};
  for (const e of eventCounts ?? []) {
    statusCounts[e.status] = (statusCounts[e.status] ?? 0) + 1;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Events Overview</h1>
        <p className="mt-1 text-muted-foreground">All events across the platform</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Draft", count: statusCounts["DRAFT"] ?? 0, color: "bg-gray-50 text-gray-600 dark:bg-gray-900" },
          { label: "Active", count: statusCounts["ACTIVE"] ?? 0, color: "bg-green-50 text-green-600 dark:bg-green-950" },
          { label: "Judging", count: statusCounts["JUDGING"] ?? 0, color: "bg-blue-50 text-blue-600 dark:bg-blue-950" },
          { label: "Completed", count: statusCounts["COMPLETED"] ?? 0, color: "bg-purple-50 text-purple-600 dark:bg-purple-950" },
        ].map((s) => (
          <div key={s.label} className={`rounded-lg border p-4 ${s.color}`}>
            <p className="text-sm">{s.label}</p>
            <p className="text-2xl font-bold">{s.count}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events?.map((event) => (
              <tr key={event.id} className="border-b transition-colors hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{event.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    <Award className="h-3 w-3" />
                    {event.event_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    event.status === "ACTIVE"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : event.status === "DRAFT"
                        ? "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                        : event.status === "JUDGING"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                  }`}>
                    {event.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(event.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs text-muted-foreground">
                    /events/{event.slug}
                  </span>
                </td>
              </tr>
            ))}
            {(!events || events.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No events found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

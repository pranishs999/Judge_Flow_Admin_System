import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, CalendarCheck, UserCheck, Clock, Activity, Award } from "lucide-react";

export default async function SuperAdminOverview() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const jwtRole = user.app_metadata?.role as string | undefined;
  const { data: profile } = !jwtRole
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const role = jwtRole ?? profile?.role;
  if (role !== "SUPER_ADMIN") redirect("/login");

  const { count: eventCount } = await supabase
    .from("events").select("*", { count: "exact", head: true }).is("deleted_at", null);

  const { count: userCount } = await supabase
    .from("profiles").select("*", { count: "exact", head: true });

  const { count: pendingUsers } = await supabase
    .from("profiles").select("*", { count: "exact", head: true })
    .eq("status", "PENDING");

  const { count: approvedJudges } = await supabase
    .from("profiles").select("*", { count: "exact", head: true })
    .eq("role", "JUDGE").eq("status", "APPROVED");

  const { count: activeEvents } = await supabase
    .from("events").select("*", { count: "exact", head: true })
    .eq("status", "ACTIVE").is("deleted_at", null);

  const { count: projectCount } = await supabase
    .from("projects").select("*", { count: "exact", head: true });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Super Admin Overview</h1>
        <p className="mt-1 text-muted-foreground">System-wide statistics and quick actions</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="Total Users" value={userCount ?? 0} color="blue" />
        <StatCard icon={UserCheck} label="Approved Judges" value={approvedJudges ?? 0} color="green" />
        <StatCard icon={Clock} label="Pending Approvals" value={pendingUsers ?? 0} color="amber" />
        <StatCard icon={CalendarCheck} label="Total Events" value={eventCount ?? 0} color="purple" />
        <StatCard icon={Activity} label="Active Events" value={activeEvents ?? 0} color="indigo" />
        <StatCard icon={Award} label="Total Projects" value={projectCount ?? 0} color="rose" />
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            href="/dashboard/super-admin/users"
            icon={Users}
            title="Manage Users"
            description="Approve, reject, or change user roles"
          />
          <QuickActionCard
            href="/dashboard/super-admin/events"
            icon={CalendarCheck}
            title="Manage Events"
            description="View and oversee all events"
          />
        </div>
      </div>

      {pendingUsers != null && pendingUsers > 0 && (
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/50">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <p className="font-medium text-amber-800 dark:text-amber-200">
              {pendingUsers} user{pendingUsers !== 1 ? "s" : ""} pending approval
            </p>
          </div>
          <Link
            href="/dashboard/super-admin/users"
            className="mt-2 inline-block text-sm text-amber-700 underline hover:text-amber-900 dark:text-amber-300"
          >
            Review pending users →
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
  };

  return (
    <div className="rounded-lg border p-6">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border p-6 transition-colors hover:bg-accent"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-semibold group-hover:text-primary">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}

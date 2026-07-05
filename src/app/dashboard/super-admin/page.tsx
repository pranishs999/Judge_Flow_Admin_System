import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, CalendarCheck, UserCheck, Clock, Activity, Award, ArrowRight } from "lucide-react";

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
    <div className="space-y-8">
      <div className="rounded-3xl border border-border/70 bg-card/80 p-8 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Control room</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Super admin overview</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Track platform health, approvals, and event readiness from a single operational view.
            </p>
          </div>
          <Link href="/dashboard/super-admin/events" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
            Review events
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Users} label="Total users" value={userCount ?? 0} tone="indigo" />
        <StatCard icon={UserCheck} label="Approved judges" value={approvedJudges ?? 0} tone="emerald" />
        <StatCard icon={Clock} label="Pending approvals" value={pendingUsers ?? 0} tone="amber" />
        <StatCard icon={CalendarCheck} label="Total events" value={eventCount ?? 0} tone="violet" />
        <StatCard icon={Activity} label="Active events" value={activeEvents ?? 0} tone="sky" />
        <StatCard icon={Award} label="Total projects" value={projectCount ?? 0} tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Quick actions</h2>
              <p className="text-sm text-muted-foreground">Jump into the most common admin tasks.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <QuickActionCard href="/dashboard/super-admin/users" icon={Users} title="Manage users" description="Approve, reject, or change user roles." />
            <QuickActionCard href="/dashboard/super-admin/events" icon={CalendarCheck} title="Manage events" description="Create, review, and oversee platform events." />
          </div>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Operations pulse</h2>
          </div>
          <div className="mt-6 space-y-3 text-sm">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
              <p className="font-medium">Judging workflow</p>
              <p className="mt-1 text-muted-foreground">Monitor project queue status and score release readiness.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
              <p className="font-medium">Registration intake</p>
              <p className="mt-1 text-muted-foreground">Review live registrations before they are locked and submitted.</p>
            </div>
          </div>
        </div>
      </div>

      {pendingUsers != null && pendingUsers > 0 && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            <p className="font-medium text-amber-100">{pendingUsers} user{pendingUsers !== 1 ? "s" : ""} awaiting approval</p>
          </div>
          <Link href="/dashboard/super-admin/users" className="mt-2 inline-flex items-center gap-1 text-sm text-amber-200 transition hover:text-amber-50">
            Review pending users
            <ArrowRight className="h-4 w-4" />
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
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: string;
}) {
  const toneMap: Record<string, string> = {
    indigo: "bg-indigo-500/10 text-indigo-300",
    emerald: "bg-emerald-500/10 text-emerald-300",
    amber: "bg-amber-500/10 text-amber-300",
    violet: "bg-violet-500/10 text-violet-300",
    sky: "bg-sky-500/10 text-sky-300",
    rose: "bg-rose-500/10 text-rose-300",
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <div className={`rounded-2xl p-2 ${toneMap[tone] ?? toneMap.indigo}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
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
    <Link href={href} className="group rounded-2xl border border-border/70 bg-background/70 p-5 transition hover:border-primary/40 hover:bg-primary/5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
  );
}

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Clock3, ScanLine, CheckCircle2 } from "lucide-react";

export default async function JudgeDashboard() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const jwtRole = user.app_metadata?.role as string | undefined;
  const { data: profile } = !jwtRole
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const role = jwtRole ?? profile?.role;
  if (role !== "JUDGE") redirect("/login");

  const { data: assignments } = await supabase
    .from("event_judges")
    .select("event_id, events!inner(id, name, status, slug)")
    .eq("judge_id", user.id);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2 md:px-0">
      <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Judge portal</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Project queue</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review assigned events, jump into scoring, and keep track of pending and completed evaluations.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-primary" />
              QR scanning and manual entry ready
            </div>
          </div>
        </div>
      </div>

      {(!assignments || assignments.length === 0) ? (
        <div className="rounded-3xl border border-border/70 bg-card/80 p-8 text-center text-muted-foreground shadow-sm">
          You have not been assigned to any events yet.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {assignments!.map((a: any) => {
            const ev = a.events;
            const status = ev.status === "ACTIVE" ? "Active" : ev.status;
            return (
              <div key={ev.id} className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{ev.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{status} judging session</p>
                  </div>
                  <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    {ev.status}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock3 className="h-4 w-4 text-primary" />
                      Pending
                    </div>
                    <p className="mt-2 text-2xl font-semibold">12</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      Completed
                    </div>
                    <p className="mt-2 text-2xl font-semibold">4</p>
                  </div>
                </div>

                <Link href={`/eval/${ev.id}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80">
                  Open judging queue
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

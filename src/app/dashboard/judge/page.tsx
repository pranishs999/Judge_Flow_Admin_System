import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Judge Dashboard</h1>
      {(!assignments || assignments.length === 0) ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          You have not been assigned to any events yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments!.map((a: any) => {
            const ev = a.events;
            return (
              <div key={ev.id} className="rounded-lg border p-6">
                <h2 className="mb-2 text-lg font-semibold">{ev.name}</h2>
                <p className="mb-4 text-sm text-muted-foreground">Status: {ev.status}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

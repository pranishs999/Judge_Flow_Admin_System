import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import ScoringInterface from "./scoring-interface";

export default async function EvalPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const jwtRole = user.app_metadata?.role as string | undefined;
  const { data: profile } = !jwtRole
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const role = jwtRole ?? profile?.role;
  if (role !== "JUDGE") redirect("/login");

  const { data: project } = await supabase
    .from("anonymized_projects")
    .select("id, project_number, title, abstract, event_id")
    .eq("id", projectId)
    .single();

  if (!project) notFound();

  const { data: criteria } = await supabase
    .from("criteria")
    .select("id, name, description, min_marks, max_marks, weight, sort_order")
    .eq("event_id", project.event_id)
    .order("sort_order");

  const { data: existingScores } = await supabase
    .from("scores")
    .select("criterion_id, marks")
    .eq("judge_id", user.id)
    .eq("project_id", projectId)
    .eq("voided", false);

  const scoredCriteria = new Set(existingScores?.map((s) => s.criterion_id) ?? []);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">Project #{project.project_number}</p>
        <h1 className="text-3xl font-bold">{project.title}</h1>
        <p className="mt-2 text-muted-foreground">{project.abstract}</p>
      </div>

      <ScoringInterface
        projectId={project.id}
        eventId={project.event_id}
        criteria={criteria ?? []}
        scoredCriteria={scoredCriteria}
      />
    </div>
  );
}

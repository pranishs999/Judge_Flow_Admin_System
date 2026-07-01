import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { badRequest, unauthorized, forbidden, internalError } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const event_id = searchParams.get("event_id");
  if (!event_id) return badRequest("event_id is required");

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "JUDGE" || profile.status !== "APPROVED") {
    return forbidden("Only approved judges can view projects");
  }

  const { data: projects, error } = await supabase
    .from("anonymized_projects")
    .select("id, project_number, title, abstract")
    .eq("event_id", event_id);

  if (error) return internalError(error.message);

  const enriched = await Promise.all(
    (projects ?? []).map(async (project) => {
      const { count } = await supabase
        .from("scores")
        .select("*", { count: "exact", head: true })
        .eq("judge_id", user.id)
        .eq("project_id", project.id)
        .eq("voided", false);

      const { count: criteriaCount } = await supabase
        .from("criteria")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event_id);

      return {
        ...project,
        is_scored: count !== null && criteriaCount !== null && count >= criteriaCount,
      };
    }),
  );

  return Response.json(enriched);
}

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { badRequest, notFound } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const draft_id = searchParams.get("draft_id");

  if (!email && !draft_id) {
    return badRequest("Provide either email or draft_id");
  }

  const supabase = await createServerSupabaseClient();

  if (draft_id) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, draft_id, team_name, status")
      .eq("draft_id", draft_id)
      .single();

    if (error || !data) return notFound("Registration not found");

    const [responses, team_members] = await Promise.all([
      supabase.from("registration_responses").select("*").eq("registration_id", data.id),
      supabase.from("team_members").select("*").eq("registration_id", data.id).order("sort_order"),
    ]);

    return Response.json({
      ...data,
      responses: responses.data ?? [],
      team_members: team_members.data ?? [],
    });
  }

  if (email) {
    return Response.json({ message: "Recovery link sent to your registered email address." });
  }

  return badRequest("Invalid request");
}

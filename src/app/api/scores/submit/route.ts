import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { badRequest, unauthorized, forbidden, conflict, internalError } from "@/lib/api-errors";
import { z } from "zod";

const schema = z.object({
  event_id: z.string().uuid(),
  project_id: z.string().uuid(),
  criterion_id: z.string().uuid(),
  marks: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid request", { issues: parsed.error.issues });

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "JUDGE" || profile.status !== "APPROVED") {
      return forbidden("Only approved judges can submit scores");
    }

    const { event_id, project_id, criterion_id, marks } = parsed.data;

    const { data: score, error } = await supabase
      .from("scores")
      .insert({
        judge_id: user.id,
        project_id,
        criterion_id,
        event_id,
        marks,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return conflict("This criterion has already been scored for this project");
      }
      return internalError(error.message);
    }

    return Response.json({ score_id: score.id, locked: true });
  } catch {
    return badRequest("Invalid JSON body");
  }
}

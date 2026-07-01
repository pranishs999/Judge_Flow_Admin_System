import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { badRequest, unauthorized, forbidden, internalError } from "@/lib/api-errors";
import { z } from "zod";

const schema = z.object({
  event_id: z.string().uuid(),
  project_id: z.string().uuid(),
  judge_id: z.string().uuid(),
  reason: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid request");

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "SUPER_ADMIN") {
      return forbidden("Only Super Admins can void scores");
    }

    const { event_id, project_id, judge_id, reason } = parsed.data;

    const { data: scores, error: selectError } = await supabase
      .from("scores")
      .select("id")
      .eq("event_id", event_id)
      .eq("project_id", project_id)
      .eq("judge_id", judge_id)
      .eq("voided", false);

    if (selectError) return internalError(selectError.message);

    const { error: updateError } = await supabase
      .from("scores")
      .update({
        voided: true,
        voided_by: user.id,
        voided_at: new Date().toISOString(),
        void_reason: reason,
      })
      .eq("event_id", event_id)
      .eq("project_id", project_id)
      .eq("judge_id", judge_id)
      .eq("voided", false);

    if (updateError) return internalError(updateError.message);

    return Response.json({
      message: "Evaluation successfully voided.",
      voided_scores_count: scores?.length ?? 0,
    });
  } catch {
    return badRequest("Invalid JSON body");
  }
}

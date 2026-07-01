import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { badRequest, unauthorized, forbidden, notFound, internalError } from "@/lib/api-errors";
import { z } from "zod";

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["PENDING_APPROVAL"],
  PENDING_APPROVAL: ["APPROVED", "DRAFT"],
  APPROVED: ["REGISTRATION_OPEN"],
  REGISTRATION_OPEN: ["REGISTRATION_CLOSED"],
  REGISTRATION_CLOSED: ["JUDGING"],
  JUDGING: ["JUDGING_COMPLETE"],
  JUDGING_COMPLETE: ["RESULTS_PROCESSING"],
  RESULTS_PROCESSING: ["RESULTS_READY"],
  RESULTS_READY: ["RESULTS_RELEASED"],
  RESULTS_RELEASED: ["ARCHIVED"],
};

const schema = z.object({
  event_id: z.string().uuid(),
  target_status: z.string(),
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

    if (!profile || !["SUPER_ADMIN", "ADMIN"].includes(profile.role)) {
      return forbidden("Only Admins and Super Admins can transition events");
    }

    const { event_id, target_status } = parsed.data;

    const { data: event } = await supabase
      .from("events")
      .select("status")
      .eq("id", event_id)
      .single();

    if (!event) return notFound("Event not found");

    const allowed = VALID_TRANSITIONS[event.status];
    if (!allowed || !allowed.includes(target_status)) {
      return badRequest(`Cannot transition from ${event.status} to ${target_status}`);
    }

    const { data, error } = await supabase
      .from("events")
      .update({ status: target_status })
      .eq("id", event_id)
      .select("id, status")
      .single();

    if (error) return internalError(error.message);

    return Response.json({
      event_id: data.id,
      old_status: event.status,
      new_status: data.status,
      transitioned_at: new Date().toISOString(),
    });
  } catch {
    return badRequest("Invalid JSON body");
  }
}

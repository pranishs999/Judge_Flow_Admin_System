import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { badRequest, unprocessable, internalError } from "@/lib/api-errors";
import { z } from "zod";

const schema = z.object({
  event_id: z.string().uuid(),
  recovery_email: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid request", { issues: parsed.error.issues });
    }

    const { event_id, recovery_email } = parsed.data;
    const supabase = await createServerSupabaseClient();

    const { data: event } = await supabase
      .from("events")
      .select("status")
      .eq("id", event_id)
      .single();

    if (!event) return unprocessable("Event not found");
    if (event.status !== "REGISTRATION_OPEN") {
      return unprocessable("Registration is not open for this event");
    }

    const { data, error } = await supabase
      .rpc("create_registration_draft", {
        p_event_id: event_id,
        p_recovery_email: recovery_email ?? null,
      });

    if (error) return internalError(error.message);

    return Response.json(data, { status: 201 });
  } catch {
    return badRequest("Invalid JSON body");
  }
}

import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { badRequest, conflict, internalError } from "@/lib/api-errors";
import { z } from "zod";

const schema = z.object({
  draft_id: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid request");

    const { draft_id } = parsed.data;
    const supabase = await createServerSupabaseClient();

    const { data: registration } = await supabase
      .from("registrations")
      .select("id, status")
      .eq("draft_id", draft_id)
      .single();

    if (!registration) return badRequest("Registration not found");
    if (registration.status !== "DRAFT") return conflict("Registration has already been submitted");

    const { data, error } = await supabase
      .rpc("submit_registration", { p_draft_id: draft_id });

    if (error) return internalError(error.message);

    return Response.json(data);
  } catch {
    return badRequest("Invalid JSON body");
  }
}

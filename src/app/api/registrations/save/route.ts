import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { badRequest, conflict, internalError } from "@/lib/api-errors";
import { z } from "zod";

const schema = z.object({
  draft_id: z.string().min(1),
  team_name: z.string().optional(),
  responses: z.array(z.object({
    field_id: z.string().uuid(),
    value: z.string().optional(),
    file_urls: z.array(z.string()).optional(),
  })).optional(),
  team_members: z.array(z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    role_in_team: z.string().optional(),
  })).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid request", { issues: parsed.error.issues });

    const { draft_id, team_name, responses, team_members } = parsed.data;
    const supabase = await createServerSupabaseClient();

    const { data: registration } = await supabase
      .from("registrations")
      .select("id, status")
      .eq("draft_id", draft_id)
      .single();

    if (!registration) return badRequest("Registration not found");
    if (registration.status !== "DRAFT") return conflict("Registration has already been submitted");

    if (team_name) {
      await supabase
        .from("registrations")
        .update({ team_name })
        .eq("id", registration.id);
    }

    if (responses) {
      for (const response of responses) {
        await supabase
          .from("registration_responses")
          .upsert({
            registration_id: registration.id,
            field_id: response.field_id,
            value: response.value ?? "",
            file_urls: response.file_urls ?? [],
          }, { onConflict: "registration_id, field_id" });
      }
    }

    if (team_members) {
      await supabase.from("team_members").delete().eq("registration_id", registration.id);
      const members = team_members.map((m, i) => ({
        registration_id: registration.id,
        name: m.name,
        email: m.email ?? null,
        role_in_team: m.role_in_team ?? null,
        sort_order: i,
      }));
      await supabase.from("team_members").insert(members);
    }

    return Response.json({ message: "Draft updated successfully", updated_at: new Date().toISOString() });
  } catch {
    return badRequest("Invalid JSON body");
  }
}

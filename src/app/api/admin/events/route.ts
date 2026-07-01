import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { badRequest, unauthorized, forbidden, internalError } from "@/lib/api-errors";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  event_type: z.enum(["HACKATHON", "PROJECT_COMPETITION", "STARTUP_PITCH", "ROBOTICS", "RESEARCH_PAPER", "POSTER_PRESENTATION", "INNOVATION_CHALLENGE", "CUSTOM"]).default("CUSTOM"),
  min_team_size: z.number().int().min(1).default(1),
  max_team_size: z.number().int().min(1).default(5),
  scoring_precision: z.enum(["INTEGER", "DECIMAL"]).default("INTEGER"),
  registration_deadline: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid request", { issues: parsed.error.issues });

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["SUPER_ADMIN", "ADMIN"].includes(profile.role)) {
      return forbidden("Only Admins and Super Admins can create events");
    }

    const { data, error } = await supabase
      .from("events")
      .insert({
        ...parsed.data,
        slug: slugify(parsed.data.name),
        created_by: user.id,
      })
      .select("id, slug, status")
      .single();

    if (error) return internalError(error.message);
    return Response.json(data, { status: 201 });
  } catch {
    return badRequest("Invalid JSON body");
  }
}

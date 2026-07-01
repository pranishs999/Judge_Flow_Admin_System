import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { badRequest, unauthorized, forbidden, internalError } from "@/lib/api-errors";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "SUPER_ADMIN") {
    return forbidden("Only Super Admins can view all users");
  }

  const serviceRole = await createServiceRoleClient();

  const { data: authUsers, error: authError } = await serviceRole.auth.admin.listUsers();
  if (authError) return internalError(authError.message);

  const emailMap = new Map<string, string>();
  for (const u of authUsers.users) {
    emailMap.set(u.id, u.email ?? "");
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (profilesError) return internalError(profilesError.message);

  const users = profiles.map((p) => ({
    ...p,
    email: emailMap.get(p.id) ?? p.email,
  }));

  return Response.json(users);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, role, status } = body;

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "SUPER_ADMIN") {
      return forbidden("Only Super Admins can manage users");
    }

    switch (action) {
      case "approve": {
        const { error } = await supabase
          .from("profiles")
          .update({ status: "APPROVED" })
          .eq("id", userId);
        if (error) return internalError(error.message);
        return Response.json({ success: true });
      }

      case "reject": {
        const { error } = await supabase
          .from("profiles")
          .update({ status: "REJECTED" })
          .eq("id", userId);
        if (error) return internalError(error.message);
        return Response.json({ success: true });
      }

      case "change-role": {
        const validRoles = ["SUPER_ADMIN", "ADMIN", "JUDGE", "MAINTAINER"];
        if (!validRoles.includes(role)) {
          return badRequest("Invalid role");
        }
        const { error } = await supabase
          .from("profiles")
          .update({ role })
          .eq("id", userId);
        if (error) return internalError(error.message);

        if (role === "JUDGE") {
          await supabase
            .from("profiles")
            .update({ status: "APPROVED" })
            .eq("id", userId);
        }
        return Response.json({ success: true });
      }

      case "change-status": {
        const validStatuses = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];
        if (!validStatuses.includes(status)) {
          return badRequest("Invalid status");
        }
        const { error } = await supabase
          .from("profiles")
          .update({ status })
          .eq("id", userId);
        if (error) return internalError(error.message);
        return Response.json({ success: true });
      }

      default:
        return badRequest("Invalid action");
    }
  } catch {
    return badRequest("Invalid JSON body");
  }
}

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/database.types";

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const jwtRole = user.app_metadata?.role as UserRole | undefined;
  if (jwtRole) return jwtRole;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role ?? null;
}

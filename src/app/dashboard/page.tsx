import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const jwtRole = user.app_metadata?.role as string | undefined;
  const { data: profile } = !jwtRole
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const role = jwtRole ?? profile?.role;

  if (role === "SUPER_ADMIN") redirect("/dashboard/super-admin");
  if (role === "ADMIN") redirect("/dashboard/admin");
  if (role === "JUDGE") redirect("/dashboard/judge");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome to JFlow</h1>
        <p className="mt-2 text-muted-foreground">
          Your account is pending approval. Please wait for an administrator to activate your access.
        </p>
      </div>
    </div>
  );
}

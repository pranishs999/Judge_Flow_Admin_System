import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const jwtRole = user.app_metadata?.role as string | undefined;
  const { data: profile } = !jwtRole
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const role = jwtRole ?? profile?.role;
  if (role !== "SUPER_ADMIN") redirect("/login");

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">Platform configuration</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Supabase Project</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your project configuration in the Supabase dashboard.
          </p>
          <Link
            href="https://supabase.com/dashboard/project/jhhohbdhuxsuhrppeixh"
            target="_blank"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Open Supabase Dashboard <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Environment</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform is running in production mode with Supabase backend.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Connected
            </span>
            <span className="text-xs text-muted-foreground">
              Project: jhhohbdhuxsuhrppeixh
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

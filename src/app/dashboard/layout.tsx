import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const jwtRole = user.app_metadata?.role as string | undefined;
  const { data: profile } = !jwtRole
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const role = jwtRole ?? profile?.role;

  const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
  if (!role || !allowedRoles.includes(role)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="border-b border-border/60 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4 lg:px-8">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Operations Center</p>
              <h2 className="text-lg font-semibold text-foreground">Event and judging oversight</h2>
            </div>
            <div className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-sm text-muted-foreground">
              {role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

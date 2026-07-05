import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RegistrationForm from "./registration-form";
import { Clock3, ShieldCheck, Sparkles } from "lucide-react";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, description, status")
    .eq("slug", slug)
    .single();

  if (!event) notFound();

  const { data: form } = await supabase
    .from("forms")
    .select("id, title, description")
    .eq("event_id", event.id)
    .single();

  const { data: fields } = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", form?.id ?? "")
    .order("sort_order");

  const deadlineLabel = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_55%)]">
      <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-xl shadow-black/10 backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                Public registration
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">{event.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{event.description}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm">
              <div className="flex items-center gap-2 text-primary">
                <Clock3 className="h-4 w-4" />
                <span className="font-medium">Registration deadline</span>
              </div>
              <p className="mt-1 text-muted-foreground">Closes by {deadlineLabel}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-medium">Working on a draft?</span>
            </div>
            <p className="mt-1 text-emerald-100/90">Enter your draft ID or recovery email to resume your submission at any time.</p>
          </div>

          {event.status !== "REGISTRATION_OPEN" ? (
            <div className="mt-6 rounded-2xl border border-border/70 bg-background/70 p-8 text-center">
              <p className="text-lg font-medium">Registration is currently closed</p>
              <p className="mt-2 text-sm text-muted-foreground">
                This event is not accepting registrations at this time.
              </p>
            </div>
          ) : (
            <div className="mt-8">
              <RegistrationForm eventId={event.id} formTitle={form?.title} fields={fields ?? []} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

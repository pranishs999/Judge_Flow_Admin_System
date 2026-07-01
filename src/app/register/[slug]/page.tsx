import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RegistrationForm from "./registration-form";

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

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">{event.name}</h1>
      <p className="mb-8 text-muted-foreground">{event.description}</p>

      {event.status !== "REGISTRATION_OPEN" ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-lg font-medium">Registration is currently closed</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This event is not accepting registrations at this time.
          </p>
        </div>
      ) : (
        <RegistrationForm eventId={event.id} formTitle={form?.title} fields={fields ?? []} />
      )}
    </div>
  );
}

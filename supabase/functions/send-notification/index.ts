import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

interface NotificationPayload {
  to: string;
  subject: string;
  html: string;
  provider?: "resend" | "smtp";
}

serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload: NotificationPayload = await req.json();
  if (!payload.to || !payload.subject || !payload.html) {
    return new Response("Missing required fields: to, subject, html", { status: 400 });
  }

  const provider = payload.provider ?? "resend";

  if (provider === "resend") {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return new Response("Resend API key not configured", { status: 500 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("SYSTEM_SENDER_EMAIL") ?? "noreply@judgeflow.net",
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: "Failed to send via Resend", details: err }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, provider: "resend" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Unsupported provider" }), { status: 400 });
});

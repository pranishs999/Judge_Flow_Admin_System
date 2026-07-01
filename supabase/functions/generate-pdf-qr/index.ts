import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import * as qrcode from "https://esm.sh/qrcode@1.5.1";
import PDFKit from "https://esm.sh/pdfkit@0.13.0";

serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { event_id } = await req.json();
  if (!event_id) {
    return new Response("event_id is required", { status: 400 });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: projects } = await supabaseClient
    .from("projects")
    .select("id, project_number, title")
    .eq("event_id", event_id);

  if (!projects || projects.length === 0) {
    return new Response("No projects found", { status: 404 });
  }

  const doc = new PDFKit({ size: "A4", layout: "landscape" });
  const buffers: Uint8Array[] = [];
  doc.on("data", (chunk: Uint8Array) => buffers.push(chunk));

  await new Promise<void>((resolve) => {
    doc.on("end", () => resolve());
    const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000";

    const cols = 3;
    const rows = 2;
    const boxW = doc.page.width / cols;
    const boxH = doc.page.height / rows;

    projects.forEach((project, index) => {
      if (index > 0 && index % (cols * rows) === 0) {
        doc.addPage();
      }

      const col = index % cols;
      const row = Math.floor(index / cols) % rows;
      const x = col * boxW;
      const y = row * boxH;

      doc.fontSize(14).text(project.title, x + 20, y + 20, { width: boxW - 40 });
      doc.fontSize(10).text(`#${project.project_number}`, x + 20, y + 45);

      const qrUrl = `${appUrl}/eval/scan?project_id=${project.id}`;
      const qrDataUrl = qrcode.toDataURL(qrUrl, { width: 150 });
      doc.image(qrDataUrl, x + boxW / 2 - 75, y + boxH / 2 - 75, { width: 150, height: 150 });
    });

    doc.end();
  });

  const pdfBytes = await new Promise<Uint8Array>((resolve) => {
    const result = new Uint8Array(buffers.reduce((acc, b) => acc + b.length, 0));
    let offset = 0;
    for (const b of buffers) {
      result.set(b, offset);
      offset += b.length;
    }
    resolve(result);
  });

  const { error: uploadError } = await supabaseClient.storage
    .from("qr-codes")
    .upload(`qr-codes/event_${event_id}.pdf`, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return new Response(JSON.stringify({ error: uploadError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, project_count: projects.length }), {
    headers: { "Content-Type": "application/json" },
  });
});

// Llamado periódicamente (pg_cron) para enviar a cada usuario un resumen
// de su estado en Wellcomy: ruta recomendada y tareas pendientes.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendTransactionalEmail } from "../_shared/email.ts";
import { dashboardSummaryEmail } from "../_shared/email-templates.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = req.headers.get("x-webhook-secret");
  if (secret !== Deno.env.get("AUTH_WEBHOOK_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .not("email", "is", null);

  if (error || !profiles) {
    console.error("dashboard-digest: error loading profiles", error);
    return new Response(JSON.stringify({ sent: 0 }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  let sent = 0;
  for (const profile of profiles) {
    if (!profile.email) continue;

    const { data: assessment } = await supabase
      .from("assessment_results")
      .select("primary_route_id")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: tasks } = await supabase
      .from("user_tasks")
      .select("title, due_date")
      .eq("profile_id", profile.id)
      .neq("status", "done")
      .order("due_date", { ascending: true });

    let routeName: string | null = null;
    if (assessment?.primary_route_id) {
      const { data: route } = await supabase
        .from("migration_routes")
        .select("name")
        .eq("id", assessment.primary_route_id)
        .maybeSingle();
      routeName = route?.name ?? null;
    }

    const { subject, html } = dashboardSummaryEmail({
      name: profile.full_name,
      routeName,
      pendingTasks: tasks?.length ?? 0,
      nextTask: tasks?.[0]?.title ?? null,
    });

    await sendTransactionalEmail({ to: profile.email, subject, html });
    sent++;
  }

  return new Response(JSON.stringify({ sent }), { status: 200, headers: { "Content-Type": "application/json" } });
});

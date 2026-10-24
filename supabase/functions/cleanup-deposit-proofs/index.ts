import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const jsonHeaders = { "Content-Type": "application/json" };

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function getJwtRole(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(
      normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="),
    );
    const claims = JSON.parse(decoded);
    return typeof claims.role === "string" ? claims.role : null;
  } catch {
    return null;
  }
}

function oneMonthAgo(from: Date): Date {
  const targetMonth = from.getUTCMonth() - 1;
  const lastDayOfTargetMonth = new Date(Date.UTC(
    from.getUTCFullYear(),
    targetMonth + 1,
    0,
  )).getUTCDate();

  return new Date(Date.UTC(
    from.getUTCFullYear(),
    targetMonth,
    Math.min(from.getUTCDate(), lastDayOfTargetMonth),
    from.getUTCHours(),
    from.getUTCMinutes(),
    from.getUTCSeconds(),
    from.getUTCMilliseconds(),
  ));
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || getJwtRole(token) !== "service_role") {
    return jsonResponse(
      { error: "Service-role authorization is required." },
      403,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Required Supabase service environment is unavailable.");
    return jsonResponse({ error: "Cleanup service is not configured." }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const cutoff = oneMonthAgo(new Date());

  const { data: expiredProofs, error: selectError } = await admin
    .from("deposits")
    .select("id, proof_path")
    .not("proof_path", "is", null)
    .lt("created_at", cutoff.toISOString())
    .order("created_at", { ascending: true })
    .limit(500);

  if (selectError) {
    console.error("Expired deposit proofs could not be queried:", selectError);
    return jsonResponse(
      { error: "Could not find expired deposit proofs." },
      500,
    );
  }

  let deletedCount = 0;
  const failures: string[] = [];
  for (let start = 0; start < (expiredProofs || []).length; start += 100) {
    const batch = (expiredProofs || []).slice(start, start + 100);
    const { error: removeError } = await admin.storage
      .from("deposit-proofs")
      .remove(batch.map((proof) => proof.proof_path).filter(Boolean));

    if (removeError) {
      console.error(
        "Expired deposit proof files could not be removed:",
        removeError,
      );
      failures.push(...batch.map((proof) => proof.id));
      continue;
    }

    const { error: updateError } = await admin
      .from("deposits")
      .update({ proof_path: null })
      .in("id", batch.map((proof) => proof.id));

    if (updateError) {
      console.error(
        "Expired deposit proof references could not be cleared:",
        updateError,
      );
      failures.push(...batch.map((proof) => proof.id));
      continue;
    }
    deletedCount += batch.length;
  }

  return jsonResponse({
    deleted: deletedCount,
    failed: failures.length,
    ...(failures.length ? { failedDepositIds: failures } : {}),
  }, failures.length ? 207 : 200);
});

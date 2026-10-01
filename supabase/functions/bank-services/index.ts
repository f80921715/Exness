import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const countryNames: Record<string, string> = {
  cote_divoire: "cote d'ivoire",
  egypt: "egypt",
  ghana: "ghana",
  kenya: "kenya",
  nigeria: "nigeria",
  rwanda: "rwanda",
  south_africa: "south africa",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeCountry(value: unknown) {
  const normalized = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  const aliases: Record<string, string> = {
    ci: "cote_divoire",
    coteivoire: "cote_divoire",
    ivorycoast: "cote_divoire",
    republicofghana: "ghana",
    republicofkenya: "kenya",
    southafricarepublic: "south_africa",
  };

  if (aliases[normalized] !== undefined) return aliases[normalized];
  if (normalized === "southafrica") return "south_africa";
  return normalized;
}

async function fetchCountryBanks(country: string, secret: string) {
  const banks: Array<{ name: string; code: string }> = [];
  const pageSize = 100;

  for (let page = 1; page <= 50; page += 1) {
    const url = new URL("https://api.paystack.co/bank");
    url.searchParams.set("country", country);
    url.searchParams.set("perPage", String(pageSize));
    url.searchParams.set("page", String(page));

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!response.ok) throw new Error("Bank directory request failed.");

    const result = await response.json();
    const pageBanks = Array.isArray(result.data)
      ? result.data
        .filter((bank: { active?: boolean }) => bank.active !== false)
        .map((bank: { name?: string; code?: string }) => ({
          name: String(bank.name || ""),
          code: String(bank.code || ""),
        }))
        .filter((bank: { name: string; code: string }) => bank.name && bank.code)
      : [];

    banks.push(...pageBanks);
    const total = Number(result.meta?.total || 0);
    if (pageBanks.length < pageSize || (total > 0 && banks.length >= total)) break;
  }

  return banks;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");

  if (!authorization || !supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "Authentication is required." }, 401);
  }
  if (!paystackSecret) {
    return jsonResponse({ error: "Bank verification is not configured." }, 503);
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: userResult, error: userError } = await userClient.auth.getUser();
  if (userError || !userResult.user) {
    return jsonResponse({ error: "A valid signed-in session is required." }, 401);
  }

  let body: { action?: string; bankCode?: string; accountNumber?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  const countryKey = normalizeCountry(userResult.user.user_metadata?.country);
  const country = countryNames[countryKey];
  if (!country) {
    return jsonResponse({ error: "Bank verification is not available for your registered country." }, 422);
  }

  let banks: Array<{ name: string; code: string }>;
  try {
    banks = await fetchCountryBanks(country, paystackSecret);
  } catch {
    return jsonResponse({ error: "Unable to load banks for your registered country." }, 502);
  }

  if (body.action === "banks") {
    return jsonResponse({ banks });
  }
  if (body.action !== "resolve") {
    return jsonResponse({ error: "Unknown bank service action." }, 400);
  }

  const bankCode = String(body.bankCode || "").trim();
  const accountNumber = String(body.accountNumber || "").replace(/[\s-]/g, "");
  if (!banks.some((bank: { code: string }) => bank.code === bankCode)) {
    return jsonResponse({ error: "Select a bank from your registered country." }, 400);
  }
  if (!/^\d{6,34}$/.test(accountNumber)) {
    return jsonResponse({ error: "Enter a valid account number." }, 400);
  }

  const resolveUrl = new URL("https://api.paystack.co/bank/resolve");
  resolveUrl.searchParams.set("account_number", accountNumber);
  resolveUrl.searchParams.set("bank_code", bankCode);
  const resolveResponse = await fetch(resolveUrl, {
    headers: { Authorization: `Bearer ${paystackSecret}` },
  });
  if (!resolveResponse.ok) {
    return jsonResponse({ error: "The bank could not verify that account number." }, 422);
  }

  const resolveResult = await resolveResponse.json();
  const accountName = String(resolveResult.data?.account_name || "").trim();
  if (!resolveResult.status || !accountName) {
    return jsonResponse({ error: "No account name was returned for those details." }, 422);
  }

  return jsonResponse({ accountName });
});
import { createClient } from "@supabase/supabase-js";

/**
 * Client con service role: bypassa RLS. Solo Server Actions / Route Handler.
 * Non importare mai da componenti client.
 */
export function hasServiceRoleKey() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Manca SUPABASE_SERVICE_ROLE_KEY. Aggiungila in .env.local e su Vercel (non è la anon key)."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

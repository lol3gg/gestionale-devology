import { createClient } from "@/lib/supabase/server";
import { createServiceClient, hasServiceRoleKey } from "@/lib/supabase/service";

/** Client che in cron/job può leggere storage e tabelle anche senza sessione utente. */
export function createPrivilegedClient() {
  return hasServiceRoleKey() ? createServiceClient() : createClient();
}

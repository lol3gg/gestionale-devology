import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * La home apre direttamente il gestionale admin.
 * Il form preventivo resta su /richiedi (link da inviare ai clienti).
 */
export default async function Home() {
  let user = null;

  try {
    const supabase = createClient();
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    user = null;
  }

  redirect(user ? "/dashboard" : "/login");
}

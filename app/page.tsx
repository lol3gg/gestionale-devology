import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * La home apre direttamente il gestionale admin.
 * Il form preventivo resta su /richiedi (link da inviare ai clienti).
 */
export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/login");
}

import { NextResponse } from "next/server";
import { inviaNotificheMattina } from "@/lib/notifiche/inviaMattina";
import { giaInviataOggi, isFinestraSetteECinquanta, marcaInviataOggi } from "@/lib/notifiche/mattinaLock";
import { notificheConfigurate } from "@/lib/notifiche/send";
import { createPrivilegedClient } from "@/lib/supabase/admin";
import { hasServiceRoleKey } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cronAutorizzato(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!cronAutorizzato(request)) {
    return NextResponse.json({ ok: false, error: "Non autorizzato." }, { status: 401 });
  }

  if (!isFinestraSetteECinquanta()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Fuori dalla finestra 7:50–7:59 Europe/Rome." });
  }

  if (!notificheConfigurate()) {
    return NextResponse.json({ ok: false, error: "VAPID non configurato." }, { status: 500 });
  }

  if (!hasServiceRoleKey()) {
    return NextResponse.json(
      { ok: false, error: "Manca SUPABASE_SERVICE_ROLE_KEY: il cron non può leggere calendario e iscrizioni." },
      { status: 500 }
    );
  }

  try {
    const supabase = createPrivilegedClient();
    if (await giaInviataOggi(supabase)) {
      return NextResponse.json({ ok: true, skipped: true, reason: "Già inviata oggi." });
    }

    const result = await inviaNotificheMattina(supabase, { marcaRichiami: true });
    await marcaInviataOggi(supabase);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Errore nell'invio." },
      { status: 500 }
    );
  }
}

import { createClient } from "@/lib/supabase/server";
import { listPreventiviRichiamo } from "@/lib/notifiche/preventiviRichiamo";
import { DaRicontattareRiepilogo } from "./DaRicontattareRiepilogo";

export async function DaRicontattareServer() {
  try {
    const items = await listPreventiviRichiamo(createClient());
    return <DaRicontattareRiepilogo items={items} />;
  } catch {
    return <DaRicontattareRiepilogo items={[]} />;
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * I bucket privati (allegati-clienti, preventivi-clienti) salvano in "url_file"
 * il signed URL generato al momento dell'upload lato client. Da quel signed URL
 * ricaviamo il percorso dell'oggetto nel bucket per poterne rigenerare uno
 * nuovo, a validità breve, ogni volta che la pagina viene renderizzata lato
 * server (i signed URL storici possono avere scadenze lunghe ma non infinite).
 */
export function extractStoragePath(bucket: string, signedUrl: string): string | null {
  const marker = `/object/sign/${bucket}/`;
  const markerIndex = signedUrl.indexOf(marker);
  if (markerIndex === -1) return null;

  const path = signedUrl.slice(markerIndex + marker.length).split("?")[0];

  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/** Rigenera un signed URL a validità breve partendo da quello salvato in database. */
export async function regenerateSignedUrl(
  supabase: SupabaseClient,
  bucket: string,
  storedUrl: string,
  expirySeconds: number
): Promise<string | null> {
  const path = extractStoragePath(bucket, storedUrl);
  if (!path) return storedUrl;

  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, expirySeconds);
  return data?.signedUrl ?? storedUrl;
}

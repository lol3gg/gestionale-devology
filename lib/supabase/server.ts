import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client per Server Components, Server Actions e Route Handlers.
 * TODO: nessuna logica implementata, solo lo scheletro.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Il metodo `set` può fallire se chiamato da un Server Component.
            // Ignorabile se si usa un middleware per il refresh della sessione.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Come sopra: ignorabile se il middleware gestisce il refresh sessione.
          }
        },
      },
    }
  );
}

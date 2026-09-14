/** Dominio pubblico da mandare a clienti e collaboratori (non localhost). */
export const SITE_URL_PRODUZIONE = "https://gestionale-devology.vercel.app";

export function getPublicOrigin() {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_SITE_URL?.trim() || SITE_URL_PRODUZIONE;
  }
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return SITE_URL_PRODUZIONE;
  }
  return window.location.origin;
}

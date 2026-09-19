"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import {
  getStatoNotificheMattina,
  inviaProvaNotificaMattina,
  rimuoviIscrizionePush,
  salvaIscrizionePush,
} from "../actions";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function NotificheCallMattina() {
  const [isPending, startTransition] = useTransition();
  const [publicKey, setPublicKey] = useState("");
  const [configurate, setConfigurate] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subscribed, setSubscribed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      const stato = await getStatoNotificheMattina();
      if (cancelled) return;
      setConfigurate(stato.configurate);
      setPublicKey(stato.publicKey);
      if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPermission("unsupported");
        return;
      }
      setPermission(Notification.permission);
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (!cancelled) setSubscribed(Boolean(existing));
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  function attiva() {
    setErrorMessage(null);
    setMessage(null);
    startTransition(async () => {
      try {
        if (!publicKey) {
          setErrorMessage("Mancano le chiavi VAPID sul server.");
          return;
        }
        const permesso = await Notification.requestPermission();
        setPermission(permesso);
        if (permesso !== "granted") {
          setErrorMessage("Permesso notifiche negato. Abilitalo dalle impostazioni del telefono.");
          return;
        }
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
        }
        const json = subscription.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
          setErrorMessage("Questo browser non ha restituito una iscrizione push valida.");
          return;
        }
        await salvaIscrizionePush({
          endpoint: json.endpoint,
          expirationTime: json.expirationTime ?? null,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        });
        setSubscribed(true);
        setMessage("Questo telefono riceverà alle 7:50 le call del giorno.");
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Impossibile attivare le notifiche.");
      }
    });
  }

  function disattiva() {
    setErrorMessage(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await rimuoviIscrizionePush(subscription.endpoint);
          await subscription.unsubscribe();
        }
        setSubscribed(false);
        setMessage("Notifiche disattivate su questo telefono.");
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Impossibile disattivare.");
      }
    });
  }

  function prova() {
    setErrorMessage(null);
    setMessage(null);
    startTransition(async () => {
      const result = await inviaProvaNotificaMattina();
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }
      setMessage(`Prova inviata a ${result.sent} telefon${result.sent === 1 ? "o" : "i"}: ${result.title}.`);
    });
  }

  return (
    <section className="rounded-brand-lg border border-brand-border bg-brand-elevated p-4 shadow-brand-md sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-accent/15 text-brand-accent-light ring-1 ring-inset ring-brand-accent/25">
          <BellRing className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-brand-text">Notifica delle 7:50</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Ogni mattina alle 7:50 arrivano le call di oggi e, se un preventivo è aperto da
            7 giorni, il promemoria di ricontattare il cliente. In Richieste vedi chi e quando
            chiamare. Attivala su questo telefono e su quello del socio. Su iPhone aggiungi l&apos;app
            in Home.
          </p>
        </div>
      </div>

      {permission === "unsupported" && (
        <p className="mt-3 text-sm text-brand-accent-light">
          Questo browser non supporta le notifiche push. Usa Chrome o Safari dall&apos;icona in Home.
        </p>
      )}
      {!configurate && (
        <p className="mt-3 text-sm text-brand-accent-light">
          Le chiavi di invio non sono ancora sul server. Dopo il deploy con VAPID e CRON_SECRET
          le notifiche partono da sole.
        </p>
      )}
      {errorMessage && (
        <p className="mt-3 rounded-md border border-brand-accent/40 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent-light">
          {errorMessage}
        </p>
      )}
      {message && (
        <p className="mt-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {message}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {subscribed ? (
          <button
            type="button"
            onClick={disattiva}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-border-strong px-4 py-2 text-sm font-semibold text-brand-soft"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellOff className="h-3.5 w-3.5" />}
            Disattiva su questo telefono
          </button>
        ) : (
          <button
            type="button"
            onClick={attiva}
            disabled={isPending || permission === "unsupported" || !configurate}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
            Attiva su questo telefono
          </button>
        )}
        <button
          type="button"
          onClick={prova}
          disabled={isPending || !configurate}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-border-strong px-4 py-2 text-sm font-semibold text-brand-soft disabled:opacity-60"
        >
          Invia prova ora
        </button>
      </div>
    </section>
  );
}

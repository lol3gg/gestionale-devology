"use client";

import { useEffect } from "react";

const BUILD_KEY = "devology-build";
const CHECK_MS = 60_000;

async function leggiVersione() {
  const response = await fetch("/api/version", { cache: "no-store" });
  if (!response.ok) return null;
  const data = (await response.json()) as { v?: string };
  return typeof data.v === "string" && data.v ? data.v : null;
}

function applicaVersione(versione: string) {
  try {
    const precedente = window.localStorage.getItem(BUILD_KEY);
    if (!precedente) {
      window.localStorage.setItem(BUILD_KEY, versione);
      return;
    }
    if (precedente !== versione) {
      window.localStorage.setItem(BUILD_KEY, versione);
      window.location.reload();
    }
  } catch {
    // localStorage bloccato: ignora
  }
}

async function controllaVersione() {
  try {
    const versione = await leggiVersione();
    if (versione) applicaVersione(versione);
  } catch {
    // rete assente: resta sulla build attuale
  }
}

export function RegisterServiceWorker() {
  useEffect(() => {
    void controllaVersione();
    const interval = window.setInterval(() => {
      void controllaVersione();
    }, CHECK_MS);

    function onVisible() {
      if (document.visibilityState === "visible") void controllaVersione();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    if (!("serviceWorker" in navigator)) {
      return () => {
        window.clearInterval(interval);
        document.removeEventListener("visibilitychange", onVisible);
        window.removeEventListener("focus", onVisible);
      };
    }

    let avevaController = Boolean(navigator.serviceWorker.controller);
    function onControllerChange() {
      if (!avevaController) {
        avevaController = true;
        return;
      }
      window.location.reload();
    }
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => registration.update())
      .catch(() => undefined);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}

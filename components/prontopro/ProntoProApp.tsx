"use client";

import { useEffect } from "react";
import ProntoProAppInner from "./ProntoProAppInner";
import { initAppStorage } from "./lib/storage";

/**
 * Wrapper client: inizializza lo storage locale e monta il CRM ProntoPro.
 * I dati restano nel browser (stesse chiavi della dashboard standalone).
 */
export default function ProntoProApp() {
  useEffect(() => {
    initAppStorage();
  }, []);

  return <ProntoProAppInner />;
}

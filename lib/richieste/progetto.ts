/**
 * Opzioni condivise tra il form pubblico (app/(public)/richiedi) e il form di
 * modifica dati nella dashboard admin (ModificaRichiestaForm), per evitare che
 * le due liste vadano fuori sincrono.
 */

export const TIPO_PROGETTO_OPTIONS = [
  "App mobile",
  "Web App",
  "SaaS",
  "Gestionale",
  "Automazione con AI",
  "Altro",
] as const;

/** Specifiche tecniche selezionabili (checkbox multiple, opzionali) per ciascun tipo di progetto. */
export const SPECIFICHE_TECNICHE_OPTIONS: Record<string, string[]> = {
  "App mobile": [
    "iOS",
    "Android",
    "Multipiattaforma (iOS + Android)",
    "Pagamenti in-app",
    "Notifiche push",
    "Sistema di login/account utente",
    "Multiutente (più persone usano lo stesso account/dati condivisi)",
    "Integrazione con servizi esterni (es. Google, social login, API di terzi)",
  ],
  "Web App": [
    "Sistema di login/account utente",
    "Multiutente con permessi diversi",
    "Pagamenti online",
    "Area riservata privata",
    "Integrazione con servizi esterni/API",
    "Dashboard con statistiche/report",
  ],
  SaaS: [
    "Abbonamenti/pagamenti ricorrenti",
    "Multi-tenant (più aziende/clienti separati usano lo stesso sistema con dati isolati tra loro)",
    "Pannello di amministrazione",
    "Livelli di accesso/ruoli utente differenti",
    "Integrazione con servizi esterni/API",
  ],
  Gestionale: [
    "Gestione magazzino/inventario",
    "Gestione clienti (CRM)",
    "Fatturazione/documenti",
    "Multiutente con permessi differenti",
    "Reportistica e statistiche",
  ],
  "Automazione con AI": [
    "Automazione di processi interni ripetitivi",
    "Chatbot/assistente virtuale",
    "Analisi automatica di dati",
    "Integrazione con altri software già in uso (es. CRM, email, gestionali)",
  ],
  Altro: [],
};

export const SAAS_SPIEGAZIONE =
  "Un SaaS (Software as a Service) è un software accessibile online in abbonamento, spesso usato da più aziende o utenti diversi contemporaneamente (es. Netflix per il software: paghi un abbonamento e usi il servizio da browser, senza installare nulla).";

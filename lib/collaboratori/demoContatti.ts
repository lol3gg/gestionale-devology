import type { ContattoCollaboratore, StatoContatto } from "./types";

function atHour(daysFromToday: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function demoId(collaboratoreId: string, n: number) {
  const prefix = collaboratoreId.replace(/-/g, "").slice(0, 8);
  return `${prefix}-d0e0-4000-8000-${String(n).padStart(12, "0")}`;
}

const SEED: Array<{
  n: number;
  nome_azienda: string;
  referente: string;
  telefono: string;
  email: string;
  note: string;
  stato: StatoContatto;
  data_richiamo: string | null;
  data_call: string | null;
}> = [
  {
    n: 1,
    nome_azienda: "Edilnova Srl",
    referente: "Luca Ferri",
    telefono: "333 210 4488",
    email: "luca.ferri@edilnova.it",
    note: "Trovato su Pagine Gialle, chiedere del sito vetrina.",
    stato: "da_chiamare",
    data_richiamo: null,
    data_call: null,
  },
  {
    n: 2,
    nome_azienda: "Costruttori Rossi",
    referente: "Anna Rossi",
    telefono: "347 901 2230",
    email: "anna@costruttorirosso.it",
    note: "Ha risposto, vuole pensarci. Mandato WhatsApp.",
    stato: "chiamato",
    data_richiamo: null,
    data_call: null,
  },
  {
    n: 3,
    nome_azienda: "Impianti Verdi",
    referente: "Marco Verdi",
    telefono: "338 554 1190",
    email: "info@impiantiverdi.it",
    note: "Ha detto di richiamare oggi pomeriggio.",
    stato: "da_richiamare",
    data_richiamo: atHour(0, 17, 30),
    data_call: null,
  },
  {
    n: 4,
    nome_azienda: "Studio Tecnico Alba",
    referente: "Giulia Neri",
    telefono: "349 882 0012",
    email: "g.neri@studioalba.it",
    note: "Call fissata per il gestionale cantieri.",
    stato: "call_fissata",
    data_richiamo: null,
    data_call: atHour(1, 17, 0),
  },
  {
    n: 5,
    nome_azienda: "Carpenteria Nord",
    referente: "Paolo Bianchi",
    telefono: "320 667 4411",
    email: "paolo@carpenterianord.it",
    note: "Interessato al preventivo, aspetta i numeri da Devology.",
    stato: "interessato",
    data_richiamo: null,
    data_call: null,
  },
  {
    n: 6,
    nome_azienda: "Edilizia Fast",
    referente: "Sara Greco",
    telefono: "331 120 9988",
    email: "sara@ediliziafast.it",
    note: "Hanno già un fornitore, hanno detto no.",
    stato: "non_interessato",
    data_richiamo: null,
    data_call: null,
  },
  {
    n: 7,
    nome_azienda: "Restauri del Lago",
    referente: "Elena Conti",
    telefono: "345 778 2210",
    email: "elena@restauri-lago.it",
    note: "Vuole vedere una demo del software.",
    stato: "call_fissata",
    data_richiamo: null,
    data_call: atHour(3, 18, 30),
  },
  {
    n: 8,
    nome_azienda: "Serramenti Plus",
    referente: "Davide Fontana",
    telefono: "333 990 1144",
    email: "davide@serramentiplus.it",
    note: "Richiamo scaduto: non ha risposto ieri.",
    stato: "da_richiamare",
    data_richiamo: atHour(-1, 16, 0),
    data_call: null,
  },
];

export function demoContattiPer(collaboratoreId: string): ContattoCollaboratore[] {
  const now = new Date().toISOString();
  return SEED.map((item) => ({
    id: demoId(collaboratoreId, item.n),
    collaboratore_id: collaboratoreId,
    nome_azienda: item.nome_azienda,
    referente: item.referente,
    telefono: item.telefono,
    email: item.email,
    note: item.note,
    stato: item.stato,
    data_richiamo: item.data_richiamo,
    data_call: item.data_call,
    created_at: now,
    updated_at: now,
  }));
}

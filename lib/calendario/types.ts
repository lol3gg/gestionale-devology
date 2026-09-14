export type CallAppuntamento = {
  id: string;
  giorno: string;
  ora: string;
  durataMinuti: number;
  azienda: string;
  email: string | null;
  telefono: string | null;
  attivita: string | null;
};

export type CallAppuntamentoInput = {
  giorno: string;
  ora: string;
  durataMinuti: number;
  azienda: string;
  email: string | null;
  telefono: string | null;
  attivita: string | null;
};

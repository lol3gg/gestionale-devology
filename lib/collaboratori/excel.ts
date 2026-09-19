import type { ContattoInput } from "./contattiStore";

function headerKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

type CampoImport = "nome_azienda" | "referente" | "telefono" | "email" | "note";

const COLONNE: Record<string, CampoImport> = {
  "nome azienda": "nome_azienda",
  azienda: "nome_azienda",
  referente: "referente",
  telefono: "telefono",
  tel: "telefono",
  cellulare: "telefono",
  email: "email",
  "e-mail": "email",
  note: "note",
};

function cell(value: unknown) {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

export async function parseContattiExcel(buffer: ArrayBuffer): Promise<ContattoInput[]> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    defval: "",
    raw: false,
  });

  return rows.flatMap((row) => {
    const mapped: Partial<Record<CampoImport, string | null>> = {};
    for (const [rawKey, value] of Object.entries(row)) {
      const field = COLONNE[headerKey(rawKey)];
      if (!field) continue;
      mapped[field] = cell(value);
    }
    const nome = mapped.nome_azienda ?? null;
    const referente = mapped.referente ?? null;
    const telefono = mapped.telefono ?? null;
    const email = mapped.email ?? null;
    const note = mapped.note ?? null;
    if (!nome && !referente && !telefono && !email) return [];
    return [
      {
        nome_azienda: nome,
        referente,
        telefono,
        email,
        note,
        stato: "da_chiamare",
        data_richiamo: null,
        data_call: null,
      },
    ];
  });
}

export async function buildTemplateExcel(): Promise<Buffer> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Nome Azienda", "Referente", "Telefono", "Email", "Note"],
    ["Edilnova Srl", "Luca Ferri", "333 210 4488", "luca.ferri@edilnova.it", "Chiedere del sito vetrina"],
  ]);
  XLSX.utils.book_append_sheet(workbook, sheet, "Contatti");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

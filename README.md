# Devology App

Applicazione [Next.js 14](https://nextjs.org) (App Router, TypeScript, Tailwind CSS) integrata con [Supabase](https://supabase.com) per la gestione delle richieste clienti.

- `app/(public)/richiedi` — form pubblico per l'invio di nuove richieste (con upload allegati).
- `app/(admin)/login` — login amministratore (Supabase Auth).
- `app/(admin)/dashboard` — pannello privato per consultare e gestire le richieste ricevute.

## Requisiti

- Node.js 18.18+ (consigliato 20 o 22)
- Un progetto [Supabase](https://supabase.com) con:
  - le tabelle `richieste` e `allegati` (schema di riferimento in `supabase/schema.sql`)
  - un bucket di storage privato chiamato `allegati-clienti`
  - almeno un utente creato in Supabase Auth per accedere alla dashboard admin

## Sviluppo locale

1. Installa le dipendenze:

   ```bash
   npm install
   ```

2. Crea un file `.env.local` nella root del progetto (NON viene mai committato su Git, vedi `.gitignore`) con le variabili:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<il-tuo-progetto>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<la-tua-anon-key>
   ```

   Questi valori si trovano nella dashboard Supabase, sotto **Project Settings → API**.

3. Avvia il server di sviluppo:

   ```bash
   npm run dev
   ```

   L'app sarà disponibile su [http://localhost:3000](http://localhost:3000).

4. Verifica che la build di produzione funzioni prima di ogni deploy:

   ```bash
   npm run build
   ```

## Deploy su Vercel

### Variabili d'ambiente da configurare su Vercel

Nel progetto Vercel, vai su **Settings → Environment Variables** e aggiungi (per gli ambienti *Production*, *Preview* e *Development*):

| Nome variabile | Valore |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del progetto Supabase (es. `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key del progetto Supabase |

Sono le stesse due variabili usate in `.env.local` in locale. Essendo variabili `NEXT_PUBLIC_*`, vengono esposte al browser: usa sempre e solo la **anon key** (mai la `service_role` key).

### Passaggi per il deploy

**Opzione A — da GitHub (consigliata)**

1. Crea un nuovo repository su GitHub e collega il repository locale:

   ```bash
   git remote add origin <url-del-tuo-repo-github>
   git branch -M main
   git push -u origin main
   ```

2. Vai su [vercel.com/new](https://vercel.com/new), importa il repository GitHub appena creato.
3. Vercel rileva automaticamente Next.js: lascia i comandi di build predefiniti (`next build`) e la Output Directory predefinita.
4. Aggiungi le due variabili d'ambiente indicate sopra prima di confermare il deploy (o subito dopo, e poi fai un redeploy).
5. Clicca **Deploy**.

**Opzione B — da Vercel CLI (senza GitHub)**

```bash
npm install -g vercel
vercel login
vercel        # primo deploy (preview), segue la procedura guidata
vercel --prod # deploy in produzione
```

Anche in questo caso, quando richiesto (o da dashboard Vercel dopo il primo deploy), configura `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Dopo il primo deploy

- Verifica che il login admin funzioni sull'URL pubblicato (`/login`) con un utente creato in Supabase Auth.
- Controlla in Supabase, sotto **Authentication → URL Configuration**, che l'URL del sito pubblicato su Vercel sia incluso tra i redirect/URL consentiti, se necessario.
- Ricontrolla le Row Level Security policy su `richieste`, `allegati` e sul bucket `allegati-clienti` (riferimento in `supabase/schema.sql`) per assicurarti che siano ancora quelle attese.

## Struttura del progetto

```
app/
  (public)/richiedi/       form pubblico invio richieste
  (admin)/login/           login amministratore
  (admin)/dashboard/       pannello admin (protetto da middleware)
lib/
  supabase/                client Supabase (browser, server, middleware)
  richieste/               utility condivise (stato, formattazione date)
supabase/
  schema.sql               schema di riferimento del database
middleware.ts              protezione delle rotte /dashboard
```

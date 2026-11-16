# FreeTourPraga

Sito Next.js, booking e gestionale della **Fase 1** del contratto. Infrastruttura: **GitHub + Railway** (web, PostgreSQL, worker email e backup cifrato giornaliero).

L’ambiente Railway è un’**anteprima con catalogo dimostrativo**, su richiesta del committente. Stripe e SMTP saranno configurati dal committente su Railway. Non è ancora una consegna commerciale validata: [stato e attività residue](docs/STATO-CONSEGNA.md).

- [Requisiti e manuale Fase 1](docs/FASE-1.md)
- [Deploy e configurazione Railway](docs/RAILWAY.md)
- [Collaudo](docs/COLLAUDO.md)
- [Gestionale, articoli e trasferimento contenuti — aggiornamento 16 novembre](docs/AGGIORNAMENTO-2026-11-16.md)

```bash
npm ci
npm run setup:local
npm run dev
```

Sito locale: http://localhost:3100. Gestionale: `/accesso`. Gli utenti locali generati da `setup:local` sono solo per sviluppo.

```bash
npm run lint
npm run typecheck
npm test
npm run test:postgres
npx playwright install chromium
npm run test:browser
npm audit --audit-level=moderate
```

`test:browser` crea un database PostgreSQL locale temporaneo, compila il bundle standalone, verifica API e pagine e percorre il checkout nel browser desktop/mobile. Non usa il database di produzione. Credenziali, chiavi di ripristino e altri materiali privati restano fuori da Git e Docker nella cartella locale `privato/`.

Il repository contiene anche codice storico per funzionalità della Fase 2. La richiesta attuale riguarda esclusivamente la Fase 1: OTA e campagne non vengono attivati.

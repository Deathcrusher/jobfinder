# Connie Jobfinder

Eine kleine Next.js-App (Vercel-ready) für aktuelle Jobs in Innsbruck/Tirol oder Remote-only. Fokus auf Quereinsteiger, Home-Office, ohne Vorkenntnisse und ohne Kundenkontakt – optional Beautyjobs.

## Lokal starten

```bash
npm install
npm run dev
```

Öffne dann [http://localhost:3000](http://localhost:3000).

## Deployment auf Vercel

1. Repository zu Vercel importieren.
2. Standard-Next.js-Settings übernehmen.
3. Deploy klicken.

## Hinweise

Die App enthält aktuell Beispieljobs und eine Filterlogik. Datenquellen können in `src/lib/jobs.ts` ergänzt oder durch echte API/Scraper ersetzt werden.

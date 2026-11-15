# Requisiti contrattuali della richiesta corrente

Aggiornato il 15 novembre 2026. La richiesta corrente riguarda **solo la Fase 1**, con Railway al posto di Vercel. I sei step e i flussi operativi sono descritti in [FASE-1.md](FASE-1.md); l’attivazione esterna in [RAILWAY.md](RAILWAY.md); evidenze e attività residue in [STATO-CONSEGNA.md](STATO-CONSEGNA.md) e [COLLAUDO.md](COLLAUDO.md).

| Requisito Fase 1 | Copertura |
|---|---|
| Analisi UX/UI, prototipi e documentazione iniziale | Flussi pubblico/staff, regole, interfaccia navigabile e schermate QA |
| Frontend responsive, SEO/GEO, Maps, social, TripAdvisor e Partner Europa | Pagine server, metadata/schema/sitemap, contenuti AI, caricamento esterno su richiesta, social ufficiali e pagina partner |
| Back-office tour, orari, disponibilità e contenuti | Catalogo, tariffe/fasce, partenze/capienze, CMS globale/pagine, immagini persistenti |
| Booking engine e Stripe | Carrello multi-tour, sconto server, checkout cash, sessione Stripe/link email, webhook firmato e idempotente |
| Email transazionali e calendario | Outbox persistente, worker, HTML/testo, allegato e download ICS, calendario operativo |
| Messa online, SSL e deploy | Servizi Railway, PostgreSQL, migrazioni, HTTPS, healthcheck e repository/CI GitHub |
| Backup giornaliero (pagina 4 del PDF) | Cron dedicato, dump PostgreSQL, cifratura age, bucket privato e procedura di ripristino |
| Rilascio codice e documentazione | Repository e manuali tecnici/operativi versionati |

Il committente ha scelto di mantenere dati dimostrativi e configurare successivamente Stripe e SMTP. Finché non sono configurati e collaudati, e finché manca la validazione del cliente, non si dichiara conclusa la consegna commerciale della Fase 1. Il codice preesistente della Fase 2 non implica l’avvio o il collaudo di quei servizi.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  defaultEmailTemplates,
  normalizeEmailTemplates,
  renderEmailTemplate,
} from "../src/lib/platform/email-templates";
import {
  CF7_MAIL_BY_SLUG,
  UWT_ADMIN_SUBJECT,
  cf7MailForSlug,
} from "../src/lib/platform/cf7-mail-map";

describe("UWT / CF7 admin email contract", () => {
  it("keeps the exact admin subject expected by UWT", () => {
    assert.equal(defaultEmailTemplates().admin.subject, UWT_ADMIN_SUBJECT);
    assert.equal(UWT_ADMIN_SUBJECT, "Reserva freetourpraga.com italiano");
  });

  it("renders the Spanish field labels UWT parses", () => {
    const text = renderEmailTemplate(defaultEmailTemplates().admin.text, {
      uwtTour: "Tour del Castillo en italiano",
      nome: "Diego Test",
      email: "simoncinidiego10@gmail.com",
      telefono: "+393331234567",
      fecha: "24/11/2026",
      hora: "10:30",
      cantidad: "2",
      ninos: "1",
      totalPagar: "800 CZK",
      afiliado: "2",
      note: "Prova UWT",
    });
    for (const line of [
      "Tour: Tour del Castillo en italiano",
      "De: Diego Test",
      "Email: simoncinidiego10@gmail.com",
      "Teléfono: +393331234567",
      "Fecha: 24/11/2026",
      "Hora: 10:30",
      "Cantidad de personas: 2",
      "Niños: 1",
      "Total a pagar: 800 CZK",
      "Idioma del Tour: italiano",
      "Afiliado: 2",
      "Mensaje:",
      "Prova UWT",
    ]) {
      assert.match(text, new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    assert.doesNotMatch(text, /Stato:/);
    assert.doesNotMatch(text, /PNR:/);
    assert.doesNotMatch(text, /Gestione:/);
  });

  it("maps official tour slugs to CF7 UWT names and customer subjects", () => {
    assert.equal(
      CF7_MAIL_BY_SLUG["castello-praga-mala-strana"].uwtTourName,
      "Tour del Castillo en italiano",
    );
    assert.equal(
      CF7_MAIL_BY_SLUG["castello-praga-mala-strana"].customerSubject,
      "Tour del Castello di Praga in Italiano",
    );
    assert.equal(
      cf7MailForSlug("unknown-tour", "Fallback").uwtTourName,
      "Fallback",
    );
  });

  it("upgrades legacy admin templates stored in settings", () => {
    const normalized = normalizeEmailTemplates({
      admin: {
        subject: "Reserva freetourpraga.com italiano · {pnr} · {kind}",
        text: "Tour: {tour}\nTelefono: {telefono}\nAdulti: {adulti}",
      },
      confirmed: {
        subject: "{kind} · {pnr} · {brand}",
        text: "Prenotazione {pnr}: Confermata\nCiao",
        html: "<p>old</p>",
      },
    });
    assert.equal(normalized.admin.subject, UWT_ADMIN_SUBJECT);
    assert.match(normalized.admin.text, /Teléfono:/);
    assert.match(normalized.admin.text, /\{uwtTour\}/);
    assert.equal(normalized.confirmed.subject, "{customerSubject}");
  });

  it("keeps gestionale edits after migration", () => {
    const normalized = normalizeEmailTemplates({
      admin: {
        subject: UWT_ADMIN_SUBJECT,
        text: "Tour: {uwtTour}\n\nDe: {nome}\n\nTeléfono: {telefono}\n\nCantidad de personas: {cantidad}\nTESTO GESTIONALE",
      },
      confirmed: {
        subject: "{customerSubject}",
        text: "Ciao {nome}, conferma custom con {fecha} e {hora}",
        html: "<p>{fecha} {hora} custom</p>",
      },
      cancelled: {
        subject: "Cancellazione personalizzata · {pnr}",
        text: "Cancellata custom {fecha}",
        html: "<p>Cancellata custom</p>",
      },
      modified: {
        subject: "Modifica custom",
        text: "Modificata",
        html: "<p>Modificata</p>",
      },
    });
    assert.match(normalized.admin.text, /TESTO GESTIONALE/);
    assert.match(normalized.confirmed.text, /conferma custom/);
    assert.equal(
      normalized.cancelled.subject,
      "Cancellazione personalizzata · {pnr}",
    );
  });
});

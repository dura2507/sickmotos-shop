import { LegalLayout } from "../_layout";

export const metadata = {
  title: "AGB — SickMotos",
  robots: { index: true, follow: true },
};

// PLACEHOLDER. AGB MUSS von einem Rechtsanwalt erstellt werden.
// Diese Standardklauseln sind nur ein Gerüst und sollen nicht ohne
// juristische Prüfung produktiv eingesetzt werden.

export default function AgbPage() {
  return (
    <LegalLayout title="Allgemeine Geschäftsbedingungen" updated="2026-05-25">
      <p>
        <strong>Hinweis:</strong> Diese AGB werden derzeit anwaltlich
        überarbeitet. Solltest du Fragen zu deiner Bestellung haben, wende
        dich bitte an die im{" "}
        <a href="/legal/impressum">Impressum</a> genannte E-Mail-Adresse.
      </p>

      <h2>§ 1 Geltungsbereich</h2>
      <p>
        Diese Allgemeinen Geschäftsbedingungen gelten für alle Bestellungen,
        die Verbraucher und Unternehmer über den SickMotos Onlineshop bei dem
        Betreiber (siehe Impressum) tätigen.
      </p>

      <h2>§ 2 Vertragspartner, Vertragsschluss</h2>
      <p>
        Der Kaufvertrag kommt zustande mit{" "}
        <em>{/* TODO: Firmierung */}SickMotos, Thomas Krawietz</em>. Mit dem
        Absenden der Bestellung gibst du ein verbindliches Angebot ab. Die
        Annahme erfolgt durch eine separate Auftragsbestätigung per E-Mail
        oder durch die Auslieferung der Ware.
      </p>

      <h2>§ 3 Preise und Versandkosten</h2>
      <p>
        Alle Preise enthalten die gesetzliche Mehrwertsteuer. Zusätzlich zu
        den angegebenen Preisen können Versandkosten anfallen, die im
        Checkout-Prozess angezeigt werden.
      </p>

      <h2>§ 4 Lieferung</h2>
      <p>
        Die Lieferung erfolgt innerhalb der angegebenen Lieferfrist nach
        Eingang der Zahlung. Lieferungen außerhalb Deutschlands sind möglich;
        zusätzliche Zollgebühren können anfallen.
      </p>

      <h2>§ 5 Zahlung</h2>
      <p>
        Die Bezahlung erfolgt über das Shopify Checkout. Verfügbare
        Zahlungsmethoden werden dir vor Abschluss der Bestellung angezeigt
        (u.&nbsp;a. Kreditkarte, PayPal, Klarna, Bitcoin).
      </p>

      <h2>§ 6 Eigentumsvorbehalt</h2>
      <p>
        Die Ware bleibt bis zur vollständigen Bezahlung Eigentum von
        SickMotos.
      </p>

      <h2>§ 7 Gewährleistung</h2>
      <p>
        Es gelten die gesetzlichen Gewährleistungsrechte. Zusätzlich
        gewähren wir auf alle SickMotos-Eigenproduktionen eine freiwillige
        Garantie von 6 Monaten auf Material- und Verarbeitungsfehler.
      </p>

      <h2>§ 8 Widerrufsrecht</h2>
      <p>
        Verbraucher haben ein gesetzliches Widerrufsrecht. Details findest du
        in unserer <a href="/legal/widerruf">Widerrufsbelehrung</a>.
      </p>

      <h2>§ 9 Streitbeilegung</h2>
      <p>
        Hinweise zur EU-Streitschlichtung findest du im{" "}
        <a href="/legal/impressum">Impressum</a>.
      </p>
    </LegalLayout>
  );
}

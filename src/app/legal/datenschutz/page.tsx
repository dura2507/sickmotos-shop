import { LegalLayout } from "../_layout";

export const metadata = {
  title: "Datenschutz — SickMotos",
  robots: { index: true, follow: true },
};

// Placeholder. Thomas's lawyer should provide the final text. The
// structure below covers GDPR Art. 13 + DSGVO requirements for a
// Shopify-hosted shop with custom Next.js frontend on Vercel.

export default function DatenschutzPage() {
  return (
    <LegalLayout title="Datenschutz" updated="2026-05-25">
      <h2>1. Verantwortlicher</h2>
      <p>
        Verantwortlich für die Datenverarbeitung auf dieser Website ist:
        <br />
        SickMotos, Thomas Krawietz (Anschrift siehe{" "}
        <a href="/legal/impressum">Impressum</a>).
      </p>

      <h2>2. Hosting</h2>
      <p>
        Die Website wird auf Servern von Vercel Inc. (440 N Barranca Ave
        #4133, Covina, CA 91723, USA) bereitgestellt. Vercel verarbeitet in
        unserem Auftrag technische Verbindungsdaten (IP-Adresse, Zeitstempel,
        User-Agent). Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO
        (berechtigtes Interesse am sicheren Betrieb). Ein
        Auftragsverarbeitungsvertrag (AVV) liegt vor.
      </p>

      <h2>3. Shop und Bezahlung</h2>
      <p>
        Bestellungen und Zahlungen werden über Shopify International Ltd.
        (Victoria Buildings, 2nd floor, 1-2 Haddington Road, Dublin 4, D04
        XN32, Irland) abgewickelt. Beim Checkout verlässt du unsere Website
        und nutzt das von Shopify gehostete Bezahlsystem. Die dort
        verarbeiteten Daten (Name, Anschrift, Zahlungsdaten) unterliegen der{" "}
        <a
          href="https://www.shopify.com/legal/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Datenschutzerklärung von Shopify
        </a>
        . Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO
        (Vertragsanbahnung/-erfüllung).
      </p>

      <h2>4. Cookies und lokale Speicherung</h2>
      <p>
        Wir setzen nur technisch notwendige lokale Speicherung ein, um deine
        Bike-Auswahl im BikeFinder und deinen Warenkorb zwischen Besuchen
        bereitzustellen. Es werden keine Tracking-Cookies gesetzt. Eine
        Einwilligung ist daher nach § 25 Abs. 2 Nr. 2 TTDSG nicht
        erforderlich.
      </p>

      <h2>5. Kontaktaufnahme</h2>
      <p>
        Wenn du uns per E-Mail oder WhatsApp kontaktierst, werden deine
        Angaben zur Bearbeitung der Anfrage verarbeitet (Art. 6 Abs. 1 lit. b
        oder lit. f DSGVO). Wir geben diese Daten nicht ohne deine Einwilligung
        weiter.
      </p>

      <h2>6. Deine Rechte</h2>
      <p>
        Du hast jederzeit das Recht auf Auskunft (Art. 15), Berichtigung (Art.
        16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
        Datenübertragbarkeit (Art. 20) sowie das Widerspruchsrecht (Art. 21).
        Anfragen bitte an die im Impressum genannte E-Mail-Adresse. Daneben
        steht dir ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
      </p>

      <h2>7. Änderungen</h2>
      <p>
        Wir behalten uns vor, diese Datenschutzerklärung anzupassen, sofern
        rechtliche oder technische Änderungen es erfordern.
      </p>
    </LegalLayout>
  );
}

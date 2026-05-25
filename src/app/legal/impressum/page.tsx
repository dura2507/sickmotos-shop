import { LegalLayout } from "../_layout";

export const metadata = {
  title: "Impressum — SickMotos",
  robots: { index: true, follow: true },
};

// Content carried over 1:1 from the existing sick-motos.com Shopify
// shop /policies/legal-notice. If Thomas updates it on the old site,
// re-paste here.

export default function ImpressumPage() {
  return (
    <LegalLayout title="Impressum" updated="2026-05-25">
      <h2>Angaben gemäß § 5 TMG</h2>
      <p>
        <strong>Sickmotos-Styles</strong>
        <br />
        IVO Scrivano
        <br />
        SICKMOTOS
        <br />
        Obere Str. 18
        <br />
        86554 Pöttmes
        <br />
        Deutschland
      </p>

      <h2>Vertreten durch</h2>
      <p>Priscilla Sebastiani</p>

      <h2>Kontakt</h2>
      <p>
        Telefon: 095 819 5453
        <br />
        Fax: 0827658565
        <br />
        E-Mail:{" "}
        <a href="mailto:SickMotos-styles@freenet.de">
          SickMotos-styles@freenet.de
        </a>
      </p>

      <h2>Registereintrag</h2>
      <p>
        Eintragung im Registergericht: Amtsgericht Aichach
        <br />
        Registernummer: OIB
      </p>

      <h2>Umsatzsteuer-ID</h2>
      <p>
        Umsatzsteuer-Identifikationsnummer nach §27a Umsatzsteuergesetz:
        <br />
        OIB 82202950050
      </p>

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>
        Priscilla Sebastiani
        <br />
        Anschrift wie oben
      </p>

      <h2>EU-Streitschlichtung</h2>
      <p>
        Die Europäische Kommission stellt eine Plattform zur
        Online-Streitbeilegung (OS) bereit:{" "}
        <a
          href="https://ec.europa.eu/consumers/odr/"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://ec.europa.eu/consumers/odr/
        </a>
        . Unsere E-Mail-Adresse findest du oben im Impressum.
      </p>

      <h2>Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
      <p>
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren
        vor einer Verbraucherschlichtungsstelle teilzunehmen.
      </p>
    </LegalLayout>
  );
}

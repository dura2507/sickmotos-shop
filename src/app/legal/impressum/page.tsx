import { LegalLayout } from "../_layout";

export const metadata = {
  title: "Impressum — SickMotos",
  robots: { index: true, follow: true },
};

// Placeholder content. Thomas needs to provide the actual Impressum data
// for the German § 5 TMG requirement. Replace the marked fields below
// with his official business details.

export default function ImpressumPage() {
  return (
    <LegalLayout title="Impressum" updated="2026-05-25">
      <h2>Angaben gemäß § 5 TMG</h2>
      <p>
        <strong>SickMotos</strong>
        <br />
        Thomas Krawietz
        <br />
        {/* TODO: street + number */}
        Musterstraße 1
        <br />
        {/* TODO: postcode + city */}
        00000 Musterstadt
        <br />
        Deutschland
      </p>

      <h2>Kontakt</h2>
      <p>
        Telefon: {/* TODO */} +49 000 0000000
        <br />
        E-Mail:{" "}
        <a href="mailto:info@sick-motos.com">info@sick-motos.com</a>
      </p>

      <h2>Umsatzsteuer-ID</h2>
      <p>
        Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
        <br />
        {/* TODO */} DE000000000
      </p>

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>
        Thomas Krawietz
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

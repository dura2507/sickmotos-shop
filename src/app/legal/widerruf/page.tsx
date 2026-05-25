import { LegalLayout } from "../_layout";

export const metadata = {
  title: "Widerrufsrecht — SickMotos",
  robots: { index: true, follow: true },
};

// Standard EU-Widerrufsbelehrung. Anwaltlich prüfen lassen.

export default function WiderrufPage() {
  return (
    <LegalLayout title="Widerrufsbelehrung" updated="2026-05-25">
      <h2>Widerrufsrecht</h2>
      <p>
        Du hast das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen
        Vertrag zu widerrufen. Die Widerrufsfrist beträgt 14 Tage ab dem Tag,
        an dem du oder ein von dir benannter Dritter, der nicht der
        Beförderer ist, die Waren in Besitz genommen hast bzw. hat.
      </p>
      <p>
        Um dein Widerrufsrecht auszuüben, musst du uns mittels einer
        eindeutigen Erklärung (z.&nbsp;B. ein mit der Post versandter Brief
        oder E-Mail) über deinen Entschluss informieren. Verwende dazu die
        Kontaktdaten aus dem <a href="/legal/impressum">Impressum</a>.
      </p>
      <p>
        Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung
        über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist
        absendest.
      </p>

      <h2>Folgen des Widerrufs</h2>
      <p>
        Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die
        wir von dir erhalten haben, einschließlich der Lieferkosten (mit
        Ausnahme zusätzlicher Kosten für eine andere Liefermethode als die
        Standardlieferung), unverzüglich und spätestens binnen 14 Tagen ab
        Eingang deiner Widerrufserklärung zurückzuzahlen.
      </p>
      <p>
        Für die Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du
        beim Kauf eingesetzt hast, es sei denn, mit dir wurde ausdrücklich
        etwas anderes vereinbart. Wir können die Rückzahlung verweigern, bis
        wir die Waren wieder zurückerhalten haben oder du den Nachweis
        erbracht hast, dass du die Waren zurückgesendet hast.
      </p>

      <h2>Rücksendekosten</h2>
      <p>
        Die unmittelbaren Kosten der Rücksendung trägst du. Bitte sende die
        Ware ausreichend frankiert zurück; unfreie Rücksendungen können wir
        nicht annehmen.
      </p>

      <h2>Ausschluss des Widerrufsrechts</h2>
      <p>
        Das Widerrufsrecht besteht nicht bei Verträgen über die Lieferung von
        Waren, die nach Kundenspezifikation angefertigt wurden (z.&nbsp;B.
        individuell beschriftete oder lackierte Teile).
      </p>

      <h2>Muster-Widerrufsformular</h2>
      <p>
        Wenn du den Vertrag widerrufen willst, kannst du das folgende
        Formular ausfüllen und an uns zurücksenden:
      </p>
      <ul>
        <li>An: SickMotos (Adresse siehe Impressum)</li>
        <li>
          Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen
          Vertrag über den Kauf der folgenden Waren (*)
        </li>
        <li>Bestellt am (*) / erhalten am (*)</li>
        <li>Name des/der Verbraucher(s)</li>
        <li>Anschrift des/der Verbraucher(s)</li>
        <li>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)</li>
        <li>Datum</li>
      </ul>
      <p>(*) Unzutreffendes streichen.</p>
    </LegalLayout>
  );
}

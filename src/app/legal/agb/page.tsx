import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LegalLayout, LegalText } from "../_layout";

export const metadata = {
  title: "AGB — SickMotos",
  robots: { index: true, follow: true },
};

// Source: src/data/legal/agb.md, mirrored 1:1 from the existing
// sick-motos.com /policies/terms-of-service. Re-pull with the same
// script if Thomas updates it on the old shop.
const source = readFileSync(
  join(process.cwd(), "src/data/legal/agb.md"),
  "utf8"
);

export default function AgbPage() {
  return (
    <LegalLayout title="Allgemeine Geschäftsbedingungen" updated="2026-05-25">
      <LegalText source={source} />
    </LegalLayout>
  );
}

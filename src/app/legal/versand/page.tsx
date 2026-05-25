import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LegalLayout, LegalText } from "../_layout";

export const metadata = {
  title: "Versand — SickMotos",
  robots: { index: true, follow: true },
};

// Source: src/data/legal/versand.md, mirrored 1:1 from the existing
// sick-motos.com /policies/shipping-policy.
const source = readFileSync(
  join(process.cwd(), "src/data/legal/versand.md"),
  "utf8"
);

export default function VersandPage() {
  return (
    <LegalLayout title="Versand & Lieferung" updated="2026-05-25">
      <LegalText source={source} />
    </LegalLayout>
  );
}

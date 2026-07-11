import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LegalLayout, LegalText } from "../_layout";

export const metadata = {
  title: "Datenschutz | SickMotos",
  robots: { index: true, follow: true },
};

// Source: src/data/legal/datenschutz.md, mirrored 1:1 from the existing
// sick-motos.com /policies/privacy-policy.
const source = readFileSync(
  join(process.cwd(), "src/data/legal/datenschutz.md"),
  "utf8"
);

export default function DatenschutzPage() {
  return (
    <LegalLayout title="Datenschutz" updated="2026-05-25">
      <LegalText source={source} />
    </LegalLayout>
  );
}

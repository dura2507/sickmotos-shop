import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LegalLayout, LegalText } from "../_layout";

export const metadata = {
  title: "Widerruf — SickMotos",
  robots: { index: true, follow: true },
};

// Source: src/data/legal/widerruf.md, mirrored 1:1 from the existing
// sick-motos.com /policies/refund-policy.
const source = readFileSync(
  join(process.cwd(), "src/data/legal/widerruf.md"),
  "utf8"
);

export default function WiderrufPage() {
  return (
    <LegalLayout title="Widerruf & Rückgabe" updated="2026-05-25">
      <LegalText source={source} />
    </LegalLayout>
  );
}

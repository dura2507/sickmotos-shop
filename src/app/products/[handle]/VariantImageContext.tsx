"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// Shares the selected variant's image between the PurchasePanel (where the
// variant is chosen) and the Gallery (which switches to that image).
type Ctx = {
  activeSrc: string | null;
  setActiveSrc: (src: string | null) => void;
};

const VariantImageCtx = createContext<Ctx | null>(null);

export function VariantImageProvider({ children }: { children: ReactNode }) {
  const [activeSrc, setActiveSrc] = useState<string | null>(null);
  return (
    <VariantImageCtx.Provider value={{ activeSrc, setActiveSrc }}>
      {children}
    </VariantImageCtx.Provider>
  );
}

export function useVariantImage() {
  return useContext(VariantImageCtx);
}

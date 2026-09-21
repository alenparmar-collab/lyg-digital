"use client";

import StampButton from "./StampButton";

/** Opens the browser's own print dialogue, which is also "Save as PDF". */
export default function PrintButton({ children = "Print / save as PDF" }: { children?: React.ReactNode }) {
  return (
    <StampButton type="button" onClick={() => window.print()}>
      {children}
    </StampButton>
  );
}

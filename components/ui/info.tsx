/**
 * Info - a tiny "?" that explains a term on hover/tap. Keeps the UI
 * self-explanatory without cluttering it.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

import { useState } from "react";

export function Info({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-muted-foreground/40 text-[9px] font-bold text-muted-foreground hover:border-primary hover:text-primary"
        aria-label="explanation"
      >
        ?
      </button>
      {open && (
        // Opens BELOW the trigger so it never tucks behind the sticky top nav.
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-[60] mt-2 w-60 max-w-[75vw] -translate-x-1/2 rounded-md border border-border bg-popover px-3 py-2 text-left font-serif text-xs normal-case leading-relaxed tracking-normal text-popover-foreground shadow-xl"
        >
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-border bg-popover" />
          {text}
        </span>
      )}
    </span>
  );
}

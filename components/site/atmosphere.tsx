/**
 * Atmosphere - a fixed ancient backdrop BEHIND all content (-z-10): aged marble,
 * a full-width temple colonnade along the bottom, a Greek-key border, and a
 * patina vignette. Purely decorative; never affected by scroll.
 * SPDX-License-Identifier: Apache-2.0
 */
export function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Marble / parchment base tint (the warm glows) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "hsl(var(--background))",
          backgroundImage: [
            "radial-gradient(120% 80% at 50% -10%, hsl(44 48% 97%) 0%, transparent 55%)",
            "radial-gradient(150% 130% at 50% 120%, hsl(30 26% 78% / 0.6) 0%, transparent 60%)",
          ].join(","),
        }}
      />

      {/* Diagonal marble veining - dimmed hard in dark themes (see globals.css),
          where light hatching would otherwise read as a distracting grid. */}
      <div
        className="atmo-veining absolute inset-0"
        style={{
          backgroundImage: [
            "repeating-linear-gradient(118deg, hsl(36 30% 86% / 0.22) 0px, hsl(36 30% 86% / 0.22) 1px, transparent 1px, transparent 9px)",
            "repeating-linear-gradient(202deg, hsl(34 24% 76% / 0.12) 0px, hsl(34 24% 76% / 0.12) 1px, transparent 1px, transparent 15px)",
          ].join(","),
        }}
      />

      {/* Full-width temple colonnade along the bottom (tiled, edge to edge) */}
      <svg className="atmo-relief absolute inset-x-0 bottom-0 h-[360px] w-full" style={{ opacity: 0.13 }} preserveAspectRatio="none">
        <defs>
          <pattern id="colonnade" width="156" height="360" patternUnits="userSpaceOnUse">
            {/* shaft */}
            <rect x="42" y="46" width="72" height="286" rx="2" fill="#5b4a32" />
            {/* flutes */}
            {[0, 1, 2, 3, 4].map((j) => (
              <rect key={j} x={50 + j * 13} y="50" width="3" height="278" fill="hsl(40 33% 95%)" opacity="0.55" />
            ))}
            {/* capital + base */}
            <rect x="34" y="36" width="88" height="12" fill="#5b4a32" />
            <rect x="30" y="332" width="96" height="16" fill="#5b4a32" />
          </pattern>
        </defs>
        {/* entablature bar across the top of the colonnade */}
        <rect x="0" y="18" width="100%" height="20" fill="#5b4a32" />
        <rect x="0" y="38" width="100%" height="8" fill="#5b4a32" opacity="0.6" />
        {/* the columns */}
        <rect x="0" y="46" width="100%" height="314" fill="url(#colonnade)" />
      </svg>

      {/* Greek-key (meander) border, top + bottom */}
      <svg className="atmo-relief absolute inset-x-0 top-0 h-6 w-full" preserveAspectRatio="none" style={{ opacity: 0.18 }}>
        <defs>
          <pattern id="meander" width="44" height="24" patternUnits="userSpaceOnUse">
            <path d="M2 22 V8 H30 V18 H14 V12 H24 M2 22 H42" fill="none" stroke="#7a5e2e" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#meander)" />
      </svg>
      <svg className="atmo-relief absolute inset-x-0 bottom-0 h-6 w-full rotate-180" preserveAspectRatio="none" style={{ opacity: 0.18 }}>
        <rect width="100%" height="100%" fill="url(#meander)" />
      </svg>

      {/* Patina vignette */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: "inset 0 0 240px hsl(30 30% 24% / 0.18)",
          background: "radial-gradient(62% 52% at 50% 38%, transparent 58%, hsl(30 26% 28% / 0.07) 100%)",
        }}
      />
    </div>
  );
}

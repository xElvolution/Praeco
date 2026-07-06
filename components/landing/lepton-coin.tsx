/**
 * LeptonCoin - a bronze coin that slowly mints and flips (pure CSS spin, so it
 * always renders and animates on load). The hero centerpiece.
 * SPDX-License-Identifier: Apache-2.0
 */
"use client";

export function LeptonCoin({ size = 240 }: { size?: number }) {
  return (
    <div style={{ perspective: 900 }} className="select-none">
      <div className="animate-mint" style={{ width: size, height: size }}>
        <svg viewBox="0 0 240 240" width={size} height={size} role="img" aria-label="A bronze lepton">
          <defs>
            <radialGradient id="bronze" cx="38%" cy="32%" r="75%">
              <stop offset="0%" stopColor="#e8c79a" />
              <stop offset="42%" stopColor="#c79452" />
              <stop offset="78%" stopColor="#9a6a32" />
              <stop offset="100%" stopColor="#6f4a22" />
            </radialGradient>
            <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
              <stop offset="22%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>

          <circle cx="120" cy="120" r="116" fill="url(#bronze)" stroke="#5c3d1c" strokeWidth="2" />
          <circle cx="120" cy="120" r="104" fill="none" stroke="#5c3d1c" strokeOpacity="0.45" strokeWidth="2" />
          <circle cx="120" cy="120" r="96" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="1" />

          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i / 36) * Math.PI * 2;
            const r = 88;
            return (
              <circle key={i} cx={120 + Math.cos(a) * r} cy={120 + Math.sin(a) * r} r={2} fill="#5c3d1c" fillOpacity={0.5} />
            );
          })}

          <text x="120" y="150" textAnchor="middle" fontFamily="Georgia, serif" fontSize="96" fontWeight="700" fill="#4a3015" fillOpacity="0.85">
            Λ
          </text>

          <path id="arc" d="M 44 120 A 76 76 0 0 1 196 120" fill="none" />
          <text fontFamily="ui-monospace, monospace" fontSize="13" letterSpacing="6" fill="#4a3015" fillOpacity="0.7">
            <textPath href="#arc" startOffset="50%" textAnchor="middle">
              ΛΕΠΤΟΝ
            </textPath>
          </text>

          <circle cx="120" cy="120" r="116" fill="url(#sheen)" />
        </svg>
      </div>
    </div>
  );
}

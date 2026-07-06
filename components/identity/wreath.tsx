/**
 * The laurel wreath - a citizen's status, worn beside their name. Fuller and
 * brighter with rank (Plebeian → Citizen → Patrician → Senator → Consul).
 * SPDX-License-Identifier: Apache-2.0
 */
import Image from "next/image";
import { tierForRenown, type Tier } from "@/lib/tiers";

function Branch({ leaves, gold, mirror }: { leaves: number; gold: string; mirror?: boolean }) {
  // Leaves arranged along an upward curve from the base.
  const items = Array.from({ length: leaves });
  return (
    <g transform={mirror ? "scale(-1,1) translate(-24,0)" : undefined}>
      <path d="M12 22 C 6 18, 4 12, 6 5" fill="none" stroke={gold} strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
      {items.map((_, i) => {
        const t = i / Math.max(1, leaves - 1);
        const x = 12 - t * 6.5 - 0.5;
        const y = 21 - t * 16;
        const rot = -50 - t * 25;
        return (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx="2.7"
            ry="1.25"
            fill={gold}
            opacity={0.95}
            transform={`rotate(${mirror ? -rot : rot} ${x} ${y})`}
          />
        );
      })}
    </g>
  );
}

export function Wreath({
  renown,
  size = 22,
  tier: tierProp,
  variant = "svg",
}: {
  renown?: number;
  size?: number;
  tier?: Tier;
  /** "svg" for inline UI; "image" for the illustrated badge assets */
  variant?: "svg" | "image";
}) {
  const tier = tierProp ?? tierForRenown(renown ?? 0);
  if (variant === "image") {
    return (
      <Image
        src={tier.image}
        alt={tier.name}
        width={size}
        height={size}
        className="object-contain"
      />
    );
  }
  if (tier.leaves === 0) {
    // Plebeian: a bare sprig.
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Plebeian">
        <path d="M12 21 C 10 14, 11 8, 12 4" stroke={tier.gold} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={tier.name}>
      <Branch leaves={tier.leaves} gold={tier.gold} />
      <Branch leaves={tier.leaves} gold={tier.gold} mirror />
    </svg>
  );
}

/** Name flanked by its wreath, with the tier as a tooltip. */
export function CitizenName({
  name,
  renown = 0,
  className = "",
  size = 20,
}: {
  name: string;
  renown?: number;
  className?: string;
  size?: number;
}) {
  const tier = tierForRenown(renown);
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} title={`${tier.name} · ${renown} renown`}>
      <Wreath tier={tier} size={size} />
      <span>{name}</span>
    </span>
  );
}

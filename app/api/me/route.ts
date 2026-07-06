/**
 * Current citizen summary for the nav/UI (no key material).
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { tierForRenown } from "@/lib/tiers";
import { aiRemaining } from "@/lib/data";
import { isPro, aiLimitFor } from "@/lib/pro";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ citizen: null });
  const tier = tierForRenown(user.renown);
  const pro = isPro(user);
  const aiLimit = aiLimitFor(user);
  return NextResponse.json({
    citizen: {
      username: user.username,
      displayName: user.display_name,
      renown: user.renown,
      tier: tier.key,
      tierName: tier.name,
      pro,
      aiLimit,
      aiRemaining: aiRemaining(user, aiLimit),
    },
  });
}

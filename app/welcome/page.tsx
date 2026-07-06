/**
 * The welcome rite - a new citizen's first steps after forging a relic:
 * choose what they care about, follow a few voices, then enter the city.
 * Real: interests persist to the citizen record and follows write to the DB.
 * SPDX-License-Identifier: Apache-2.0
 */
import { redirect } from "next/navigation";
import { Nav } from "@/components/site/nav";
import { WelcomeFlow } from "@/components/welcome/welcome-flow";
import { currentUser } from "@/lib/auth";
import { listSuggestedCreators } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = { title: "Welcome · Praeco" };

export default async function WelcomePage() {
  const user = await currentUser();
  if (!user) redirect("/citizen");

  const suggestions = await listSuggestedCreators(user.id, 6);

  return (
    <div className="min-h-screen">
      <Nav />
      <WelcomeFlow
        displayName={user.display_name}
        initialInterests={user.interests ?? []}
        suggestions={suggestions.map((s) => ({
          username: s.username,
          displayName: s.display_name,
          bio: s.bio,
          renown: s.renown,
          pieces: s.pieces,
        }))}
      />
    </div>
  );
}

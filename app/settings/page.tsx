/**
 * Settings - theme, profile, and notifications.
 * SPDX-License-Identifier: Apache-2.0
 */
import { redirect } from "next/navigation";
import { Nav } from "@/components/site/nav";
import { SettingsClient } from "@/components/settings/settings-client";
import { currentCitizen } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const cit = await currentCitizen();
  if (!cit) redirect("/citizen");
  const u = cit.user;

  return (
    <div className="min-h-screen">
      <Nav />
      <section className="mx-auto max-w-3xl px-6 pb-24 pt-14">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 font-serif text-muted-foreground">Manage your appearance, profile, and preferences.</p>
        <SettingsClient
          profileInitial={{
            displayName: u.display_name,
            bio: u.bio ?? "",
            twitter: u.twitter ?? "",
            email: u.email ?? "",
            discord: u.discord ?? "",
          }}
          interestsInitial={u.interests ?? []}
        />
      </section>
    </div>
  );
}

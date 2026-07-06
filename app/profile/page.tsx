/**
 * Edit your profile.
 * SPDX-License-Identifier: Apache-2.0
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/site/nav";
import { EditProfileForm } from "@/components/account/edit-profile-form";
import { currentCitizen } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const cit = await currentCitizen();
  if (!cit) redirect("/citizen");
  const u = cit.user;

  return (
    <div className="min-h-screen">
      <Nav />
      <section className="mx-auto max-w-xl px-6 pb-24 pt-14">
        <p className="label-mono">Edit profile</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">@{u.username}</h1>
        <p className="mt-2 font-serif text-muted-foreground">
          This is how you appear to readers.{" "}
          <Link href={`/u/${u.username}`} className="text-primary underline">View public profile →</Link>
        </p>

        <div className="mt-8">
          <EditProfileForm
            initial={{
              displayName: u.display_name,
              bio: u.bio ?? "",
              twitter: u.twitter ?? "",
              email: u.email ?? "",
              discord: u.discord ?? "",
            }}
          />
        </div>
      </section>
    </div>
  );
}

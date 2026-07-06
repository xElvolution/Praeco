/**
 * /how has been folded into /arena - the Arena explains Praeco in the same
 * page where a citizen actually earns renown. This route redirects so no
 * bookmark 404s.
 * SPDX-License-Identifier: Apache-2.0
 */
import { redirect } from "next/navigation";

export default function HowPage() {
  redirect("/arena");
}

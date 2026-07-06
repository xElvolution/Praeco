/**
 * Auth server actions callable from client components.
 * SPDX-License-Identifier: Apache-2.0
 */
"use server";

import { signupCitizen, loginCitizen, logoutCitizen } from "@/lib/auth";

export async function doSignup(username: string, displayName?: string, ref?: string) {
  return signupCitizen(username, displayName, ref);
}

export async function doLogin(username: string, relic: string) {
  return loginCitizen(username, relic);
}

export async function doLogout() {
  await logoutCitizen();
}

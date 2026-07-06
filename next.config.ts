/**
 * Copyright 2026 Circle Internet Group, Inc.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Classic SSR semantics: pages reading from Neon/cookies are dynamic via
  // `export const dynamic = "force-dynamic"`. Cache Components (experimental)
  // forbids that, so it's off.
  cacheComponents: false,
  experimental: {
    // Publishing sends the article body — which can carry inline base64 images —
    // through a Server Action. The default 1MB cap would reject image-rich posts.
    serverActions: { bodySizeLimit: "8mb" },
  },
  async redirects() {
    return [{ source: "/how", destination: "/arena", permanent: true }];
  },
};

export default nextConfig;

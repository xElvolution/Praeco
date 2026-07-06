/**
 * Canonical topics - the vocabulary shared by three surfaces: the interest
 * chips a new citizen picks in the welcome flow, the tags a writer sets when
 * publishing, and the personalized ordering of the Forum. Keeping one list
 * means an interest a reader picks can actually match a piece a writer tagged.
 * SPDX-License-Identifier: Apache-2.0
 */
export type Topic = { key: string; label: string; blurb: string };

export const TOPICS: Topic[] = [
  { key: "stoicism", label: "Stoicism", blurb: "Living well, letters, and the examined life" },
  { key: "poetry", label: "Poetry & Myth", blurb: "Song, epic, and the old stories" },
  { key: "philosophy", label: "Philosophy", blurb: "Argument, ethics, first principles" },
  { key: "engineering", label: "Engineering", blurb: "Aqueducts, machines, how things are built" },
  { key: "economics", label: "Economics", blurb: "Money, markets, what value is worth" },
  { key: "nature", label: "Nature", blurb: "Plants, creatures, the living world" },
  { key: "science", label: "Science", blurb: "Observation, method, discovery" },
  { key: "history", label: "History", blurb: "Rome, empire, and what came before" },
];

const LABELS = new Map(TOPICS.map((t) => [t.key, t.label]));
const VALID = new Set(TOPICS.map((t) => t.key));

export function topicLabel(key: string): string {
  return LABELS.get(key) ?? key;
}

/** Keep only recognized topic keys (defensive against stale client input). */
export function cleanTopics(keys: unknown): string[] {
  if (!Array.isArray(keys)) return [];
  const seen = new Set<string>();
  for (const k of keys) {
    if (typeof k === "string" && VALID.has(k)) seen.add(k);
  }
  return [...seen];
}

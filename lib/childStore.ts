"use client";

import type { ChildProfile } from "./mockData";
import { DEFAULT_CHILD } from "./mockData";

const KEY = "hp.child.v1";

export function readChild(): ChildProfile {
  if (typeof window === "undefined") return DEFAULT_CHILD;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CHILD;
    const parsed = JSON.parse(raw) as Partial<ChildProfile>;
    return {
      name: parsed.name?.trim() || DEFAULT_CHILD.name,
      age: typeof parsed.age === "number" ? parsed.age : DEFAULT_CHILD.age,
      gender:
        parsed.gender === "boy" || parsed.gender === "girl" || parsed.gender === "unspecified"
          ? parsed.gender
          : DEFAULT_CHILD.gender,
    };
  } catch {
    return DEFAULT_CHILD;
  }
}

export function writeChild(child: ChildProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(child));
}

import { describe, expect, it } from "vitest";
import { getReferenceTransitionId } from "@/features/practice/reference-tone-scheduler";

describe("reference tone scheduling", () => {
  it("fires once when a target enters its reference phase", () => {
    expect(getReferenceTransitionId("prepare", "target-1", null)).toBeNull();
    expect(getReferenceTransitionId("reference", "target-1", null)).toBe("target-1");
    expect(getReferenceTransitionId("reference", "target-1", "target-1")).toBeNull();
    expect(getReferenceTransitionId("reference", "target-2", "target-1")).toBe("target-2");
  });
});

/**
 * @jest-environment node
 */
import { MemoryStore } from "@/packages/server/kv";
import { visitorOf } from "@/services/store/visitor";

describe("counting a visitor without keeping who they are", () => {
  test("one connection is the same visitor all day, another use or another day counts it apart, and no address is kept", async () => {
    let now = Date.UTC(2026, 9, 14, 9, 0);
    const store = new MemoryStore(() => now);
    const first = await visitorOf(store, "contact", "203.0.113.7", now);

    expect(first).toMatch(/^[0-9a-f]{16}$/);
    expect(await visitorOf(store, "contact", "203.0.113.7", now + 60_000)).toBe(first);
    expect(await visitorOf(store, "contact", "2001:db8:1:2::9", now)).toBe(await visitorOf(store, "contact", "2001:db8:1:2:3:4:5:6", now));
    expect(await visitorOf(store, "voyage:board", "203.0.113.7", now)).not.toBe(first);

    now = Date.UTC(2026, 9, 15, 9, 0);
    expect(await visitorOf(store, "contact", "203.0.113.7", now)).not.toBe(first);
  });
});

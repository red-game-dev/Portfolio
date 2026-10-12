/**
 * @jest-environment node
 */
import { packText, unpackText } from "@/packages/encoding/compact";

describe("compact text", () => {
  test("packs to a link safe string and reads back the same text", async () => {
    const text = JSON.stringify({ name: "Pilot", list: Array.from({ length: 200 }, (_, index) => index % 7), note: "ünïcödé ✓" });
    const packed = await packText(text);

    expect(packed).toMatch(/^[zj][A-Za-z0-9_-]+$/);
    expect(packed.length).toBeLessThan(text.length);
    await expect(unpackText(packed)).resolves.toBe(text);
  });

  test("reads text packed without compression too", async () => {
    const plain = `j${Buffer.from("hello").toString("base64url")}`;

    await expect(unpackText(plain)).resolves.toBe("hello");
  });

  test("gives null for anything it cannot read", async () => {
    await expect(unpackText("x123")).resolves.toBeNull();
    await expect(unpackText("z!!not base64")).resolves.toBeNull();
    await expect(unpackText("")).resolves.toBeNull();
  });
});

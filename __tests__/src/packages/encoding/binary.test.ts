import { decodeFrame, toBinary, toBinaryMask } from "@/packages/encoding/binary";

describe("encoding/binary", () => {
  test("toBinary encodes each character as its char code in base 2", () => {
    expect(toBinary("Hi")).toBe("1001000 1101001");
    expect(toBinary("Hi", "")).toBe("10010001101001");
  });

  test("toBinaryMask keeps length and whitespace and only uses bits elsewhere", () => {
    const text = "Code review, PRs";
    const mask = toBinaryMask(text);

    expect(mask).toHaveLength(text.length);
    expect(mask.charAt(4)).toBe(" ");
    expect(mask.replace(/\s/g, "")).toMatch(/^[01]+$/);
  });

  test("toBinaryMask is deterministic, so server and client render the same", () => {
    expect(toBinaryMask("Debugging and fixing")).toBe(toBinaryMask("Debugging and fixing"));
  });

  test("decodeFrame reveals the text from the left and keeps bits after it", () => {
    const text = "30%";
    const mask = toBinaryMask(text);

    expect(decodeFrame(text, mask, 0)).toBe(mask);
    expect(decodeFrame(text, mask, 2).slice(0, 2)).toBe("30");
    expect(decodeFrame(text, mask, 2).charAt(2)).toMatch(/[01]/);
    expect(decodeFrame(text, mask, 3)).toBe(text);
  });

  test("decodeFrame flips unresolved bits as the tick moves, but never the revealed part", () => {
    const text = "Testing and verification";
    const mask = toBinaryMask(text);
    const frames = [1, 2, 3, 4].map((tick) => decodeFrame(text, mask, 7, tick));

    frames.forEach((frame) => expect(frame.slice(0, 7)).toBe("Testing"));
    expect(new Set(frames).size).toBeGreaterThan(1);
  });
});

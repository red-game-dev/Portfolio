import { blockHash, GENESIS_HASH } from "@/components/Web3/utils/blockHash";

describe("blockHash", () => {
  test("a capability's block hash is twelve hex digits after 0x, and the same every time", () => {
    expect(blockHash("Smart contracts")).toBe("0x2e8cad0377f7");
    expect(blockHash("a")).toBe("0x0000013a0000");
    expect(blockHash("Smart contracts")).toMatch(/^0x[0-9a-f]{12}$/);
    expect(GENESIS_HASH).toMatch(/^0x0{12}$/);
  });
});

import { formatMoney, isLedgerSnapshot, Ledger, toMinor, tradingAccount } from "@/packages/finance/ledger";

const RC = { code: "RC", decimals: 0 };
const VS = { code: "VS", decimals: 2 };

const ledger = () => new Ledger([RC, VS], [
  { id: "wallet", kind: "asset" },
  { id: "income:bounties", kind: "income" },
  { id: "expense:upgrades", kind: "expense" },
]);

describe("finance/ledger", () => {
  test("value moves between accounts and both sides read positive as they grow", () => {
    const books = ledger();

    books.transfer("income:bounties", "wallet", "RC", 250, "A swarm downed", 1);
    books.transfer("wallet", "expense:upgrades", "RC", 120, "Shield emitter", 2);

    expect(books.balance("wallet", "RC")).toBe(130);
    expect(books.balance("income:bounties", "RC")).toBe(250);
    expect(books.balance("expense:upgrades", "RC")).toBe(120);
    expect(books.history("wallet")).toHaveLength(2);
  });

  test("refuses anything that does not balance, or names what it does not know", () => {
    const books = ledger();

    expect(() => books.post({ id: "a", at: 1, memo: "", postings: [{ account: "wallet", currency: "RC", amount: 5 }, { account: "income:bounties", currency: "RC", amount: -4 }] }))
      .toThrow(/does not balance/);
    expect(() => books.post({ id: "b", at: 1, memo: "", postings: [{ account: "nowhere", currency: "RC", amount: 5 }, { account: "wallet", currency: "RC", amount: -5 }] }))
      .toThrow(/unknown account/);
    expect(() => books.post({ id: "c", at: 1, memo: "", postings: [{ account: "wallet", currency: "XX", amount: 5 }, { account: "wallet", currency: "XX", amount: -5 }] }))
      .toThrow(/unknown currency/);
    expect(() => books.transfer("income:bounties", "wallet", "RC", 2.5, "half a coin")).toThrow(/whole number/);
    expect(books.history()).toHaveLength(0);
  });

  test("currencies exchange within an account, each side balanced through its trading account", () => {
    const books = ledger();

    books.transfer("income:bounties", "wallet", "RC", 1000, "Boss down", 1);
    books.exchange("wallet", { currency: "RC", amount: 400 }, { currency: "VS", amount: toMinor(2.5, VS) }, "Bought void shards", 2);

    expect(books.balance("wallet", "RC")).toBe(600);
    expect(books.balance("wallet", "VS")).toBe(250);
    expect(books.balance(tradingAccount("RC"), "RC")).toBe(-400);
    expect(formatMoney(books.balance("wallet", "VS"), VS)).toBe("2.50 VS");
  });

  test("kept as plain data and read back, a ledger replays to the same balances", () => {
    const books = ledger();

    books.transfer("income:bounties", "wallet", "RC", 75, "Rock shot down", 1);

    const kept = JSON.parse(JSON.stringify(books.toSnapshot())) as unknown;

    expect(isLedgerSnapshot(kept)).toBe(true);

    if (isLedgerSnapshot(kept)) {
      expect(Ledger.from(kept).balance("wallet", "RC")).toBe(75);
    }

    expect(isLedgerSnapshot({ currencies: [], accounts: "none", journal: [] })).toBe(false);
  });
});

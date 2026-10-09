import { Ledger, LedgerSnapshot, Posting } from "@/packages/finance/ledger";

import { CurrencyCode, EarningReason, Purse, SpendingReason } from "../domain/economy";

export const CURRENCIES: ReadonlyArray<{ code: CurrencyCode; decimals: number }> = [
  { code: "RED", decimals: 0 },
  { code: "VOID", decimals: 0 },
];

const CODES: readonly CurrencyCode[] = ["RED", "VOID"];

export const WALLET = "assets:wallet";

// The account each earning comes from and each spending goes to, so the ledger says where every coin came from.
export const INCOME: Readonly<Record<EarningReason, string>> = {
  discovery: "income:discoveries",
  landing: "income:landings",
  bounty: "income:bounties",
  rescue: "income:rescues",
  boss: "income:bosses",
  universe: "income:universes",
  salvage: "income:salvage",
  flight: "income:flight",
  recycling: "income:recycling",
};

export const EXPENSE: Readonly<Record<SpendingReason, string>> = {
  upgrade: "expense:upgrades",
  crafting: "expense:crafting",
  repair: "expense:repairs",
  exchange: "expense:exchange",
};

// Past this many entries the oldest are closed into an opening balance, keeping this many.
const MAX_JOURNAL = 600;
const KEEP_JOURNAL = 300;

export const emptyPurse = (): Purse => ({ RED: 0, VOID: 0 });

// A pilot's money, kept as a double entry ledger in Red Coin and Void Shards: every coin earned comes from an
// income account named for the deed, every coin spent goes to an expense account named for what it bought, and
// the wallet is an asset whose balance is always what the ledger says it is.
export class Wallet {
  private constructor(private ledger: Ledger) {
    CURRENCIES.forEach((currency) => this.ledger.addCurrency(currency));
    this.ledger.open(WALLET, "asset");
    Object.values(INCOME).forEach((account) => this.ledger.open(account, "income"));
    Object.values(EXPENSE).forEach((account) => this.ledger.open(account, "expense"));
  }

  public get purse(): Purse {
    return { RED: this.ledger.balance(WALLET, "RED"), VOID: this.ledger.balance(WALLET, "VOID") };
  }

  public static open(): Wallet {
    return new Wallet(new Ledger(CURRENCIES));
  }

  // A wallet from its kept ledger, replayed through every check. An entry that no longer checks out is left out
  // on its own; the rest of the money is kept.
  public static from(snapshot: LedgerSnapshot): Wallet {
    return new Wallet(Ledger.recover(snapshot).ledger);
  }

  public canAfford(cost: Partial<Purse>): boolean {
    const purse = this.purse;

    return CODES.every((code) => (cost[code] ?? 0) <= purse[code]);
  }

  // Money in, from an income named for the deed, as one entry however many currencies it pays in.
  public earn(reason: EarningReason, amounts: Partial<Purse>, memo: string, at: number): void {
    this.move(INCOME[reason], WALLET, amounts, memo, at);
  }

  // Money out, to an expense named for what it bought; nothing moves unless all of it can be paid.
  public spend(reason: SpendingReason, amounts: Partial<Purse>, memo: string, at: number): boolean {
    if (!this.canAfford(amounts)) {
      return false;
    }

    this.move(WALLET, EXPENSE[reason], amounts, memo, at);

    return true;
  }

  // One currency for another within the wallet, through the ledger's trading accounts.
  public exchange(give: { currency: CurrencyCode; amount: number }, get: { currency: CurrencyCode; amount: number }, memo: string, at: number): boolean {
    if (give.amount <= 0 || get.amount <= 0 || !this.canAfford({ [give.currency]: give.amount })) {
      return false;
    }

    this.ledger.exchange(WALLET, give, get, memo, at);

    return true;
  }

  // The wallet's latest entries, newest first, each with what it did to the wallet in every currency.
  public history(limit: number): Array<{ id: string; at: number; memo: string; amounts: Purse }> {
    return this.ledger.history(WALLET).slice(-limit)
.reverse()
.map(({ id, at, memo, postings }) => {
      const amounts = emptyPurse();

      postings.filter((posting) => posting.account === WALLET).forEach(({ currency, amount }) => {
        if (currency === "RED" || currency === "VOID") {
          amounts[currency] += amount;
        }
      });

      return { id, at, memo, amounts };
    });
  }

  // Everything to keep, its oldest entries closed into one opening balance once the journal grows long.
  public toSnapshot(): LedgerSnapshot {
    if (this.ledger.history().length > MAX_JOURNAL) {
      this.ledger = this.ledger.compacted(KEEP_JOURNAL, "opening");
    }

    return this.ledger.toSnapshot();
  }

  private move(from: string, to: string, amounts: Partial<Purse>, memo: string, at: number): void {
    const postings: Posting[] = CODES.flatMap((code) => {
      const amount = Math.round(amounts[code] ?? 0);

      return amount > 0 ? [{ account: to, currency: code, amount }, { account: from, currency: code, amount: -amount }] : [];
    });

    if (postings.length > 0) {
      this.ledger.record(memo, postings, at);
    }
  }
}

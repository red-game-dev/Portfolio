import { Account, AccountKind, Currency, LedgerSnapshot, Posting, Transaction } from "../domain/types";
import { TransactionValidator } from "../validators/TransactionValidator";

// Accounts that grow with debits.
const DEBIT_NORMAL: readonly AccountKind[] = ["asset", "expense"];

// The account currency exchange runs through, one per currency, so each side of a trade balances by itself.
export const tradingAccount = (currency: string) => `equity:trading:${currency}`;

// A double entry ledger. Value moves between accounts in transactions that balance in every currency, checked
// before anything is written; the journal is only ever appended to; balances are read from it, by each
// account's normal side so an asset or an income both read positive as they grow; currencies exchange through
// trading accounts; and the whole of it goes to and from plain data to be kept.
export class Ledger {
  private readonly currencies = new Map<string, Currency>();
  private readonly accounts = new Map<string, Account>();
  private readonly journal: Transaction[] = [];
  private readonly balances = new Map<string, number>();
  private readonly validator: TransactionValidator;
  private sequence = 0;

  constructor(currencies: readonly Currency[], accounts: readonly Account[] = []) {
    currencies.forEach((currency) => this.currencies.set(currency.code, currency));
    accounts.forEach((account) => this.accounts.set(account.id, account));
    this.validator = new TransactionValidator(this.accounts, this.currencies);
  }

  // A ledger rebuilt from its snapshot by replaying every transaction through the same checks.
  public static from(snapshot: LedgerSnapshot): Ledger {
    const ledger = new Ledger(snapshot.currencies, snapshot.accounts);

    snapshot.journal.forEach((transaction) => ledger.post(transaction));

    return ledger;
  }

  public currency(code: string): Currency | undefined {
    return this.currencies.get(code);
  }

  public open(id: string, kind: AccountKind): void {
    if (!this.accounts.has(id)) {
      this.accounts.set(id, { id, kind });
    }
  }

  public addCurrency(currency: Currency): void {
    if (!this.currencies.has(currency.code)) {
      this.currencies.set(currency.code, currency);
    }
  }

  // Writes a transaction once it is proven to balance, or throws with every rule it breaks.
  public post(transaction: Transaction): Transaction {
    this.validator.assertValid(transaction);
    this.journal.push(transaction);
    transaction.postings.forEach(({ account, currency, amount }) => {
      const key = `${account}|${currency}`;

      this.balances.set(key, (this.balances.get(key) ?? 0) + amount);
    });

    return transaction;
  }

  // Writes postings as a transaction of their own, given its id.
  public record(memo: string, postings: Posting[], at = Date.now()): Transaction {
    return this.post({ id: this.nextId(at), at, memo, postings });
  }

  // Moves `amount` minor units of a currency from one account to another: a debit to `to`, a credit to `from`.
  public transfer(from: string, to: string, currency: string, amount: number, memo: string, at = Date.now()): Transaction {
    return this.post({ id: this.nextId(at), at, memo, postings: [{ account: to, currency, amount }, { account: from, currency, amount: -amount }] });
  }

  // Exchanges currencies within one account: `give` of one out, `get` of another in, each side balanced through
  // its currency's trading account.
  public exchange(account: string, give: { currency: string; amount: number }, get: { currency: string; amount: number }, memo: string, at = Date.now()): Transaction {
    [give.currency, get.currency].forEach((currency) => this.open(tradingAccount(currency), "equity"));

    const postings: Posting[] = [
      { account, currency: give.currency, amount: -give.amount },
      { account: tradingAccount(give.currency), currency: give.currency, amount: give.amount },
      { account, currency: get.currency, amount: get.amount },
      { account: tradingAccount(get.currency), currency: get.currency, amount: -get.amount },
    ];

    return this.post({ id: this.nextId(at), at, memo, postings });
  }

  // An account's balance in a currency, on its normal side: positive as it grows.
  public balance(account: string, currency: string): number {
    const raw = this.balances.get(`${account}|${currency}`) ?? 0;
    const kind = this.accounts.get(account)?.kind ?? "asset";

    return DEBIT_NORMAL.includes(kind) ? raw : -raw;
  }

  // Every transaction, or those touching one account, newest last.
  public history(account?: string): readonly Transaction[] {
    return account ? this.journal.filter((transaction) => transaction.postings.some((posting) => posting.account === account)) : this.journal;
  }

  // The same ledger with all but its last `keep` transactions closed into one opening entry that carries every
  // account's balance forward, as books are closed at a year's end: every balance is unchanged, and the journal
  // stops growing without bound.
  public compacted(keep: number, memo = "Opening balances"): Ledger {
    const cut = this.journal.length - keep;

    if (cut <= 1) {
      return Ledger.from(this.toSnapshot());
    }

    const carried = new Map<string, Posting>();

    this.journal.slice(0, cut).forEach((transaction) => transaction.postings.forEach(({ account, currency, amount }) => {
      const key = `${account}|${currency}`;
      const posting = carried.get(key) ?? { account, currency, amount: 0 };

      posting.amount += amount;
      carried.set(key, posting);
    }));

    const at = this.journal[cut - 1].at;
    const opening: Transaction = { id: `open-${at.toString(36)}`, at, memo, postings: [...carried.values()].filter((posting) => posting.amount !== 0) };

    return Ledger.from({ ...this.toSnapshot(), journal: opening.postings.length > 0 ? [opening, ...this.journal.slice(cut)] : this.journal.slice(cut) });
  }

  public toSnapshot(): LedgerSnapshot {
    return { currencies: [...this.currencies.values()], accounts: [...this.accounts.values()], journal: [...this.journal] };
  }

  private nextId(at: number): string {
    this.sequence += 1;

    return `${at.toString(36)}-${this.journal.length.toString(36)}-${this.sequence.toString(36)}`;
  }
}

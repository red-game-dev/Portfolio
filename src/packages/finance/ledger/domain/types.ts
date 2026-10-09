// A currency: its code, and how many decimal places its minor unit has (0 for a game coin, 2 for cents).
export interface Currency {
  code: string;
  decimals: number;
}

// The five kinds of account of double entry. Assets and expenses grow with debits; liabilities, equity and
// income grow with credits.
export type AccountKind = "asset" | "liability" | "equity" | "income" | "expense";

export interface Account {
  id: string;
  kind: AccountKind;
}

// One line of a transaction: an amount in a currency's minor units, positive a debit, negative a credit.
export interface Posting {
  account: string;
  currency: string;
  amount: number;
}

// A transaction: postings that balance to nothing in every currency, so value only ever moves, never appears.
export interface Transaction {
  id: string;
  at: number;
  memo: string;
  postings: Posting[];
}

// Everything a ledger holds, as plain data to keep and read back.
export interface LedgerSnapshot {
  currencies: Currency[];
  accounts: Account[];
  journal: Transaction[];
}

import { Guard, isArrayOf, isFiniteNumber, isRecord, isText } from "@/packages/core/domain";

import { Account, AccountKind, Currency, LedgerSnapshot, Posting, Transaction } from "../domain/types";

const KINDS: readonly AccountKind[] = ["asset", "liability", "equity", "income", "expense"];

const isCurrency: Guard<Currency> = (value): value is Currency => isRecord(value) && isText(value.code) && isFiniteNumber(value.decimals);

const isAccount: Guard<Account> = (value): value is Account => isRecord(value) && isText(value.id) && KINDS.some((kind) => kind === value.kind);

const isPosting: Guard<Posting> = (value): value is Posting => isRecord(value) && isText(value.account) && isText(value.currency) && isFiniteNumber(value.amount);

const isTransaction: Guard<Transaction> = (value): value is Transaction => isRecord(value) && isText(value.id) && isFiniteNumber(value.at) &&
  typeof value.memo === "string" && isArrayOf(isPosting)(value.postings);

// Whether a value read back is a ledger's snapshot in shape (its rules are checked as it is replayed).
export const isLedgerSnapshot: Guard<LedgerSnapshot> = (value): value is LedgerSnapshot => isRecord(value) && isArrayOf(isCurrency)(value.currencies) &&
  isArrayOf(isAccount)(value.accounts) && isArrayOf(isTransaction)(value.journal);

import { toValidationResult, ValidationResult, Validator } from "@/packages/core/domain";

import { Account, Currency, Transaction } from "../domain/types";

// The rules a transaction must keep: an id, at least two postings, known accounts and currencies, whole minor
// units, and debits equal to credits in every currency it touches.
export class TransactionValidator extends Validator<Transaction> {
  constructor(private readonly accounts: ReadonlyMap<string, Account>, private readonly currencies: ReadonlyMap<string, Currency>) {
    super();
  }

  public validate({ id, postings }: Transaction): ValidationResult {
    const errors: string[] = [];
    const sums = new Map<string, number>();

    if (!id) {
      errors.push("a transaction needs an id");
    }

    if (postings.length < 2) {
      errors.push(`${id} needs at least two postings`);
    }

    postings.forEach(({ account, currency, amount }) => {
      if (!this.accounts.has(account)) {
        errors.push(`${id} posts to an unknown account, ${account}`);
      }

      if (!this.currencies.has(currency)) {
        errors.push(`${id} posts in an unknown currency, ${currency}`);
      }

      if (!Number.isSafeInteger(amount) || amount === 0) {
        errors.push(`${id} posts ${amount} to ${account}, not a whole number of minor units`);
      }

      sums.set(currency, (sums.get(currency) ?? 0) + amount);
    });

    sums.forEach((sum, currency) => {
      if (sum !== 0) {
        errors.push(`${id} does not balance in ${currency}: off by ${sum}`);
      }
    });

    return toValidationResult(errors);
  }
}

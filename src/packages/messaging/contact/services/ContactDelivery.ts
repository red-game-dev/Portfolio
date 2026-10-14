import { ContactChannel, Delivery } from "../core/ContactChannel";
import { FallbackChannel } from "../core/FallbackChannel";
import { ContactProblem, ContactRefusal, ContactRequest } from "../domain/types";

// Whether a message can go through a channel that sends: yes, no, or no way to tell (no answer), when the form keeps
// its send button, since the send's own answer decides and the fallback is always there.
export type DeliveryStatus = "open" | "closed" | "unknown";

// What became of a message: sent, invalid (the fields to fix), or handed to the fallback with why the channels before
// it could not send it (null when there were none).
export type DeliveryResult =
  | { kind: "sent" }
  | { kind: "invalid"; problems: ContactProblem[] }
  | { kind: "fallback"; href: string; refusal: ContactRefusal | null };

// Delivers a message: through each channel that sends, in order, until one sends it, and past them to the fallback,
// which hands the visitor a link. A message invalid with fields to fix stops there (no channel would take it); one
// refused as invalid with nothing to fix (a request the server would not read) goes on like any refusal. A channel that
// throws (its code or its network gone) counts as failing. No send waits on a separate read of whether it can go.
export class ContactDelivery {
  private readonly senders: readonly ContactChannel[];
  private readonly fallback: FallbackChannel;

  constructor(senders: readonly ContactChannel[], fallback: FallbackChannel) {
    this.senders = senders;
    this.fallback = fallback;
  }

  public async status(): Promise<DeliveryStatus> {
    const answers = await Promise.all(this.senders.map((sender) => sender.isOpen().catch(() => null)));

    if (answers.some((answer) => answer === true)) {
      return "open";
    }

    return answers.length > 0 && answers.every((answer) => answer === false) ? "closed" : "unknown";
  }

  public linkFor(request: Pick<ContactRequest, "message" | "subject">): string {
    return this.fallback.linkFor(request);
  }

  public async deliver(request: ContactRequest): Promise<DeliveryResult> {
    let refusal: ContactRefusal | null = null;

    for (const sender of this.senders) {
      let delivery: Delivery;

      try {
        delivery = await sender.deliver(request);
      } catch {
        delivery = { kind: "refused", refusal: "failed", problems: [] };
      }

      if (delivery.kind === "sent") {
        return delivery;
      }

      if (delivery.kind === "refused" && delivery.refusal === "invalid" && delivery.problems.length > 0) {
        return { kind: "invalid", problems: delivery.problems };
      }

      refusal = delivery.kind === "refused" && delivery.refusal !== "invalid" ? delivery.refusal : "failed";
    }

    return { kind: "fallback", href: this.fallback.linkFor(request), refusal };
  }
}

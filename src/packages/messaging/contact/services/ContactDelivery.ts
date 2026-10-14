import { ContactChannel, Delivery } from "../core/ContactChannel";
import { ContactProblem, ContactRefusal, ContactRequest } from "../domain/types";

// What became of a message: sent, invalid (the fields to fix), or handed to the fallback with why the channels before
// it could not send it (null when none were open to try).
export type DeliveryResult =
  | { kind: "sent" }
  | { kind: "invalid"; problems: ContactProblem[] }
  | { kind: "fallback"; href: string; refusal: ContactRefusal | null };

// Delivers a message through its channels in order: each that is open is tried, the first that sends it ends the
// round, and an invalid message stops there (no channel would take it); past every channel that sends, the last one,
// the fallback that always works, hands the visitor a link. A channel that throws (its code or its network gone)
// counts as refusing.
export class ContactDelivery {
  private readonly channels: readonly ContactChannel[];

  constructor(channels: readonly ContactChannel[]) {
    this.channels = channels;
  }

  // Whether a channel before the fallback can deliver now.
  public async isOpen(): Promise<boolean> {
    const open = await Promise.all(this.channels.slice(0, -1).map((channel) => channel.isOpen().catch(() => false)));

    return open.some(Boolean);
  }

  public async deliver(request: ContactRequest): Promise<DeliveryResult> {
    let refusal: ContactRefusal | null = null;

    for (const channel of this.channels) {
      let delivery: Delivery;

      try {
        delivery = channel === this.channels[this.channels.length - 1] || await channel.isOpen()
          ? await channel.deliver(request)
          : { kind: "refused", refusal: "unavailable", problems: [] };
      } catch {
        delivery = { kind: "refused", refusal: "failed", problems: [] };
      }

      if (delivery.kind === "sent") {
        return delivery;
      }

      if (delivery.kind === "link") {
        return { kind: "fallback", href: delivery.href, refusal };
      }

      if (delivery.refusal === "invalid") {
        return { kind: "invalid", problems: delivery.problems };
      }

      refusal = delivery.refusal;
    }

    return { kind: "fallback", href: "", refusal };
  }
}

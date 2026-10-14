import { ContactRequest } from "../domain/types";
import { ContactChannel, Delivery } from "./ContactChannel";

// The channel that always works, handing the visitor a link to send the message themselves. The page draws that link
// beside the send button from it, and the delivery service hands a message to it when no other channel sent it.
export abstract class FallbackChannel extends ContactChannel {
  public isOpen(): Promise<boolean> {
    return Promise.resolve(true);
  }

  public deliver(request: ContactRequest): Promise<Delivery> {
    return Promise.resolve({ kind: "link", href: this.linkFor(request) });
  }

  public abstract linkFor(request: Pick<ContactRequest, "message" | "subject">): string;
}

import { ContactProblem, ContactRefusal, ContactRequest } from "../domain/types";

// What became of a message through a channel: sent, refused (with what was wrong, for an invalid one), or handed to the
// visitor as a link to send it themselves.
export type Delivery =
  | { kind: "sent" }
  | { kind: "refused"; refusal: ContactRefusal; problems: ContactProblem[] }
  | { kind: "link"; href: string };

// A way a message reaches me, from the browser: the site's own server, or the visitor's own email app. Each says
// whether it can deliver now and delivers; the delivery service tries them in order, the one that always works last.
export abstract class ContactChannel {
  public abstract readonly id: string;

  public abstract isOpen(): Promise<boolean>;

  public abstract deliver(request: ContactRequest): Promise<Delivery>;
}

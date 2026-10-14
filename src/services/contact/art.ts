import { createHash } from "crypto";

import { EMAIL_THEME } from "@/config/contact";
import { SITE_URL } from "@/config/site";
import { encodeGif } from "@/packages/graphics/gif";
import { contactArt, ContactKind, EmailArt } from "@/packages/messaging/contact";

const KINDS = Object.keys(EMAIL_THEME.accents) as ContactKind[];

// The art's names: each kind's motion and its bar at rest.
const NAMES = KINDS.flatMap((kind) => [`${kind}.gif`, `${kind}-still.gif`]);
const NAME = new RegExp(`^(${KINDS.join("|")})(-still)?\\.gif$`);

const drawn = new Map<string, Uint8Array>();
let version: string | null = null;

// The email's art by its name ("message.gif", "feedback-still.gif"), drawn once an instance, or null for any other name.
export const emailArt = (name: string): Uint8Array | null => {
  const match = NAME.exec(name);

  if (!match) {
    return null;
  }

  if (!drawn.has(name)) {
    const art = contactArt(EMAIL_THEME.accents[match[1] as ContactKind], EMAIL_THEME.journey, EMAIL_THEME.panel);

    drawn.set(name, encodeGif(match[2] ? art.still : art.moving));
  }

  return drawn.get(name) ?? null;
};

// The art's version, from the bytes of every piece of it, so any change to the colours, the drawing or the encoder gives
// new addresses, and nothing an inbox has kept hides the new art.
export const artVersion = (): string => {
  if (!version) {
    const hash = createHash("sha256");

    NAMES.forEach((name) => hash.update(emailArt(name) ?? new Uint8Array()));
    version = hash.digest("hex").slice(0, 8);
  }

  return version;
};

// Where an email's art is fetched from: this deployment while it is a preview, so a preview's emails show what it would
// ship, and the site's own address otherwise.
export const artOrigin = (environment = process.env.VERCEL_ENV, deployment = process.env.VERCEL_URL): string =>
  (environment === "preview" && deployment ? `https://${deployment}` : SITE_URL);

// Each kind's art as addresses on an origin, carrying the version; none, and so the plain bar, if the art cannot be drawn,
// since the art must never stop an email going out.
export const emailArtLinks = (origin = artOrigin(), versionOf = artVersion): Record<ContactKind, EmailArt> | undefined => {
  try {
    const current = versionOf();

    return Object.fromEntries(KINDS.map((kind) => [kind, {
      moving: `${origin}/api/email/${kind}.gif?v=${current}`,
      still: `${origin}/api/email/${kind}-still.gif?v=${current}`,
    }])) as Record<ContactKind, EmailArt>;
  } catch {
    return undefined;
  }
};

import { EMAIL_THEME } from "@/config/contact";
import { SITE_URL } from "@/config/site";
import { hexHash } from "@/packages/encoding/hash";
import { encodeGif } from "@/packages/graphics/gif";
import { CONTACT_ART, contactArt, ContactKind, EmailArt } from "@/packages/messaging/contact";

const KINDS = Object.keys(EMAIL_THEME.accents) as ContactKind[];

// The art's version, from everything it is drawn from, so a change gives new addresses and nothing cached keeps the old.
export const ART_VERSION = hexHash(JSON.stringify([EMAIL_THEME.accents, EMAIL_THEME.journey, EMAIL_THEME.panel, CONTACT_ART]), 8);

// The art's names: each kind's motion and its bar at rest.
const NAME = new RegExp(`^(${KINDS.join("|")})(-still)?\\.gif$`);

const drawn = new Map<string, Uint8Array>();

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

// Where an email's art is fetched from: this deployment while it is a preview, so a preview's emails show what it would
// ship, and the site's own address otherwise.
export const artOrigin = (environment = process.env.VERCEL_ENV, deployment = process.env.VERCEL_URL): string =>
  (environment === "preview" && deployment ? `https://${deployment}` : SITE_URL);

// Each kind's art as addresses on an origin, carrying the version.
export const emailArtLinks = (origin = artOrigin()): Record<ContactKind, EmailArt> => Object.fromEntries(KINDS.map((kind) => [kind, {
  moving: `${origin}/api/email/${kind}.gif?v=${ART_VERSION}`,
  still: `${origin}/api/email/${kind}-still.gif?v=${ART_VERSION}`,
}])) as Record<ContactKind, EmailArt>;

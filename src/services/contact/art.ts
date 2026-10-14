import { createHash } from "crypto";

import { EMAIL_THEME } from "@/config/contact";
import { SITE_URL } from "@/config/site";
import portrait from "@/data/email/portrait.json";
import { encodeGif, GifImage } from "@/packages/graphics/gif";
import type { ContactKind } from "@/packages/messaging/contact";
import { contactArt, contactAvatar, EmailArt, EmailArtwork } from "@/packages/messaging/contact-email";

const KINDS = Object.keys(EMAIL_THEME.accents) as ContactKind[];

// The art's names: each kind's bar, and my portrait, each moving and at rest.
const PIECES = [...KINDS, "avatar"];
const NAMES = PIECES.flatMap((piece) => [`${piece}.gif`, `${piece}-still.gif`]);
const NAME = new RegExp(`^(${PIECES.join("|")})(-still)?\\.gif$`);

// The portrait as raw pixels, written by `npm run email:portrait` from the profile picture, in the engineering green
// the site's own portrait reveals in.
const avatarArt = () => contactAvatar(
  { width: portrait.width, height: portrait.height, pixels: new Uint8Array(Buffer.from(portrait.pixels, "base64")) },
  EMAIL_THEME.accents.message,
  EMAIL_THEME.panel,
);

const artOf = (piece: string): { moving: GifImage; still: GifImage } => (piece === "avatar"
  ? avatarArt()
  : contactArt(EMAIL_THEME.accents[piece as ContactKind], EMAIL_THEME.journey, EMAIL_THEME.panel));

const drawn = new Map<string, Uint8Array>();
let version: string | null = null;

// The email's art by its name ("message.gif", "feedback-still.gif", "avatar.gif"), drawn once an instance, or null for any
// other name.
export const emailArt = (name: string): Uint8Array | null => {
  const match = NAME.exec(name);

  if (!match) {
    return null;
  }

  if (!drawn.has(name)) {
    const art = artOf(match[1]);

    drawn.set(name, encodeGif(match[2] ? art.still : art.moving));
  }

  return drawn.get(name) ?? null;
};

// The art's version, from the bytes of every piece of it, so any change to the colours, the drawing, the portrait or the
// encoder gives new addresses, and nothing an inbox has kept hides the new art.
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

// The art as addresses on an origin, carrying the version; none, and so the plain bar and no portrait, if the art cannot
// be drawn, since the art must never stop an email going out.
export const emailArtLinks = (origin = artOrigin(), versionOf = artVersion): EmailArtwork | undefined => {
  try {
    const current = versionOf();
    const linkOf = (piece: string): EmailArt => ({
      moving: `${origin}/api/email/${piece}.gif?v=${current}`,
      still: `${origin}/api/email/${piece}-still.gif?v=${current}`,
    });

    return { bars: Object.fromEntries(KINDS.map((kind) => [kind, linkOf(kind)])) as Record<ContactKind, EmailArt>, avatar: linkOf("avatar") };
  } catch {
    return undefined;
  }
};

import { createHash } from "crypto";
import { inflateSync } from "zlib";

import { EMAIL_THEME } from "@/config/contact";
import { SITE_URL } from "@/config/site";
import portrait from "@/data/email/portrait.json";
import { encodeGif, GifImage } from "@/packages/graphics/gif";
import type { ContactKind } from "@/packages/messaging/contact";
import { contactArt, contactPortrait, EmailArt, EmailArtwork } from "@/packages/messaging/contact-email";

const KINDS = Object.keys(EMAIL_THEME.accents) as ContactKind[];

// The art's pieces, each kind's bar and my portrait, and their names: each moving and at rest.
const PIECES = [...KINDS, "portrait"];
const NAME = new RegExp(`^(${PIECES.join("|")})(-still)?\\.gif$`);

// The portrait as raw pixels, deflated, written by `npm run email:portrait` from the profile picture, revealed in the
// engineering green the site's own portrait reveals in, whichever kind of message it tops.
const portraitArt = () => contactPortrait(
  { width: portrait.width, height: portrait.height, pixels: new Uint8Array(inflateSync(Uint8Array.from(Buffer.from(portrait.pixels, "base64")))) },
  EMAIL_THEME.accents.message,
  EMAIL_THEME.panel,
);

const drawnPieces = new Map<string, { moving: GifImage; still: GifImage }>();
const encoded = new Map<string, Uint8Array>();
const versions = new Map<string, string>();

// A piece drawn once an instance, its motion and its rest together, since the rest is the motion's last frame.
const pieceOf = (piece: string) => {
  if (!drawnPieces.has(piece)) {
    drawnPieces.set(piece, piece === "portrait"
      ? portraitArt()
      : contactArt(EMAIL_THEME.accents[piece as ContactKind], EMAIL_THEME.journey, EMAIL_THEME.panel));
  }

  return drawnPieces.get(piece) as { moving: GifImage; still: GifImage };
};

// The email's art by its name ("message.gif", "feedback-still.gif", "portrait.gif"), encoded once an instance, or null
// for any other name.
export const emailArt = (name: string): Uint8Array | null => {
  const match = NAME.exec(name);

  if (!match) {
    return null;
  }

  if (!encoded.has(name)) {
    const piece = pieceOf(match[1]);

    encoded.set(name, encodeGif(match[2] ? piece.still : piece.moving));
  }

  return encoded.get(name) ?? null;
};

// A piece's version, from the bytes of its motion and its rest, so any change to the colours, the drawing, the portrait
// or the encoder gives it new addresses, and nothing an inbox has kept hides the new art.
export const artVersion = (piece: string): string => {
  if (!versions.has(piece)) {
    const hash = createHash("sha256");

    [`${piece}.gif`, `${piece}-still.gif`].forEach((name) => hash.update(emailArt(name) ?? new Uint8Array()));
    versions.set(piece, hash.digest("hex").slice(0, 8));
  }

  return versions.get(piece) as string;
};

// Where an email's art is fetched from: this deployment while it is a preview, so a preview's emails show what it would
// ship, and the site's own address otherwise.
export const artOrigin = (environment = process.env.VERCEL_ENV, deployment = process.env.VERCEL_URL): string =>
  (environment === "preview" && deployment ? `https://${deployment}` : SITE_URL);

// The art as addresses on an origin, each piece carrying its version. A piece that cannot be drawn is left out on its
// own: no portrait leaves the bars, and no bars leave the plain bar and no art at all, since the art must never stop
// an email going out.
export const emailArtLinks = (origin = artOrigin(), versionOf = artVersion): EmailArtwork | undefined => {
  const linkOf = (piece: string): EmailArt => {
    const version = versionOf(piece);

    return { moving: `${origin}/api/email/${piece}.gif?v=${version}`, still: `${origin}/api/email/${piece}-still.gif?v=${version}` };
  };

  try {
    const bars = Object.fromEntries(KINDS.map((kind) => [kind, linkOf(kind)])) as Record<ContactKind, EmailArt>;

    try {
      return { bars, portrait: linkOf("portrait") };
    } catch {
      return { bars };
    }
  } catch {
    return undefined;
  }
};

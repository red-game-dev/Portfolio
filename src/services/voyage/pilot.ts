import { SITE_URL } from "@/config/site";
import { createStore } from "@/packages/browser/store";
import { packText, unpackText } from "@/packages/encoding/compact";
import { Armory, Career, Hangar, pilotEnvelope, PilotRepository, Progress, readPilot } from "@/packages/games/voyage";
import type { PilotProfile } from "@/packages/games/voyage";
import { PILOT_CHANNEL, PilotSaved } from "@/services/voyage/channel";

// Where a pilot's progress lives: IndexedDB where the browser has it, localStorage where it does not, and memory
// for this visit only when neither works. Nothing is ever sent anywhere.
const NAMESPACE = "redgame.voyage";

export interface Pilot {
  hangar: Hangar;
  career: Career;
  armory: Armory;
  progress: Progress;
  repository: PilotRepository;
}

// The visitor's hangar, career, armoury and progress, read back from this browser (a new pilot when nothing is kept).
// Loaded with the voyage, on first open, so none of it is in the page bundle. The armoury comes first, since the
// hangar's ability bar asks it which weapons the pilot owns.
export const openPilot = async (): Promise<Pilot> => {
  const repository = new PilotRepository(await createStore(NAMESPACE, { size: "large", isDurable: true }));

  const profile = await repository.load();

  const armory = new Armory(profile.armory);

  return { repository, armory, progress: new Progress(profile.progress), hangar: new Hangar(profile, { weapons: armory.port() }), career: new Career(profile.career) };
};

// The pilot as one profile, as it is saved.
export const profileOf = ({ hangar, career, armory, progress }: Pilot): PilotProfile =>
  ({ ...hangar.toProfile(), career: career.toProfile(), armory: armory.toProfile(), progress: progress.toProfile() });

// A pilot moves to another device inside a link's fragment (#pilot=...), which a browser never sends to a server, or in
// a small file where the link is too long for a QR code. Either way it is read back as this device reads its own.
export const PILOT_ANCHOR = "pilot=";
// Anything larger is not a pilot (a real one is tens of kilobytes): refused before it is read, so a crafted link or file
// cannot swell the page.
const MOST_LINK = 256 * 1024;
const MOST_FILE = 1024 * 1024;

// The link opens the site it was made on (a preview's link opens that preview), or the site itself away from a browser.
const pageAddress = (): string => (typeof window === "undefined" ? `${SITE_URL}/` : `${window.location.origin}${window.location.pathname}`);

export const pilotLink = async (profile: PilotProfile): Promise<string> =>
  `${pageAddress()}#${PILOT_ANCHOR}${await packText(JSON.stringify(pilotEnvelope(profile)))}`;

const parsePilot = (text: string | null): PilotProfile | null => {
  if (!text) {
    return null;
  }

  try {
    return readPilot(JSON.parse(text));
  } catch {
    return null;
  }
};

export const readPilotLink = async (hash: string): Promise<PilotProfile | null> =>
  (hash.startsWith(`#${PILOT_ANCHOR}`) && hash.length <= MOST_LINK ? parsePilot(await unpackText(hash.slice(PILOT_ANCHOR.length + 1))) : null);

export const pilotFile = (profile: PilotProfile): Blob => new Blob([JSON.stringify(pilotEnvelope(profile))], { type: "application/json" });

export const readPilotFile = async (file: Blob): Promise<PilotProfile | null> => {
  if (file.size > MOST_FILE) {
    return null;
  }

  try {
    return parsePilot(await file.text());
  } catch {
    return null;
  }
};

// What a pilot is, in two numbers: the pilot's own level and the ship's.
export const summarisePilot = (profile: PilotProfile): { level: number; ship: number } =>
  ({ level: new Progress(profile.progress).level, ship: profile.level });

// A pilot from another device written as this device's own while the voyage is closed, newer than anything kept, and
// any voyage open in another tab told to take it on. Where the browser keeps nothing (memory only), nothing is kept for
// the voyage to open, so it is reported as not saved.
export const landPilot = async (profile: PilotProfile): Promise<boolean> => {
  const adapter = await createStore(NAMESPACE, { size: "large", isDurable: true });

  if (adapter.kind === "memory") {
    adapter.close();

    return false;
  }

  const repository = new PilotRepository(adapter);
  const landed = { ...profile, savedAt: Date.now() };
  const isSaved = await repository.save(landed);

  repository.close();

  if (isSaved && typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(PILOT_CHANNEL);

    channel.postMessage({ savedAt: landed.savedAt, isReplaced: true } satisfies PilotSaved);
    channel.close();
  }

  return isSaved;
};

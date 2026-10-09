import { createStore } from "@/packages/browser/store";
import { Career, Hangar, PilotRepository } from "@/packages/games/voyage";

// Where a pilot's progress lives: IndexedDB where the browser has it, localStorage where it does not, and memory
// for this visit only when neither works. Nothing is ever sent anywhere.
const NAMESPACE = "redgame.voyage";

export interface Pilot {
  hangar: Hangar;
  career: Career;
  repository: PilotRepository;
}

// The visitor's hangar and career, read back from this browser (a new pilot when nothing is kept). Loaded with the voyage,
// on first open, so neither is in the page bundle.
export const openPilot = async (): Promise<Pilot> => {
  const repository = new PilotRepository(await createStore(NAMESPACE, { size: "large", isDurable: true }));

  const profile = await repository.load();

  return { repository, hangar: new Hangar(profile), career: new Career(profile.career) };
};

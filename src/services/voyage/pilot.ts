import { createStore } from "@/packages/browser/store";
import { Armory, Career, Hangar, PilotRepository, Progress } from "@/packages/games/voyage";

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

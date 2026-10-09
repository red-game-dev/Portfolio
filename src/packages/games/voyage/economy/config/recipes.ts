import { FaultKind } from "../../domain/faults";
import { Recipe } from "../domain/economy";
import { ItemStack, stack } from "../domain/items";

const recipe = (id: string, needs: ItemStack[], coin: number, isKnown: boolean, count = 1): Recipe => ({ id, makes: stack(id, count), needs, coin, isKnown });

// What can be made from the hold. The basics are known from the start; the rest are plans found in wrecks and
// on the fallen.
export const RECIPES: readonly Recipe[] = [
  recipe("repairKit", [stack("scrap", 3), stack("wiring")], 5, true),
  recipe("fuelCell", [stack("ice", 2), stack("scrap")], 2, true),
  recipe("hullPlate", [stack("scrap", 4), stack("titanium")], 5, true),
  recipe("fuelLine", [stack("scrap", 2), stack("carbon")], 3, true),
  recipe("nozzle", [stack("titanium", 2), stack("carbon")], 10, false),
  recipe("sensorArray", [stack("circuits", 2), stack("wiring")], 10, false),
  recipe("radiatorFin", [stack("titanium"), stack("coolant", 2)], 8, false),
  recipe("coolantFlask", [stack("coolant", 2), stack("ice")], 4, false),
  recipe("emitter", [stack("circuits", 2), stack("titanium")], 15, false),
  recipe("shieldCell", [stack("circuits"), stack("wiring", 2)], 8, false),
  recipe("alloy", [stack("titanium", 2), stack("carbon", 2)], 20, false),
];

export const recipeById = (id: string): Recipe | undefined => RECIPES.find((entry) => entry.id === id);

// A blueprint's id for a recipe, and the recipe a blueprint is for.
export const recipeBlueprint = (id: string) => `recipe:${id}`;

// What fixes each fault: its own part, or a field repair from salvage. A repair kit fixes any.
export const FAULT_FIXES: Readonly<Record<FaultKind, readonly ItemStack[][]>> = {
  misfire: [[stack("nozzle")], [stack("scrap", 2), stack("wiring")]],
  fuelLeak: [[stack("fuelLine")], [stack("scrap"), stack("carbon")]],
  coolantLeak: [[stack("radiatorFin")], [stack("coolant", 2)]],
  glitch: [[stack("sensorArray")], [stack("circuits"), stack("wiring")]],
  emitter: [[stack("emitter")], [stack("circuits", 2), stack("wiring")]],
  breach: [[stack("hullPlate")], [stack("scrap", 3), stack("titanium")]],
};

export const UNIVERSAL_FIX: readonly ItemStack[] = [stack("repairKit")];

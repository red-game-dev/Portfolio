import ai from "@/data/blueprints/ai";
import casino from "@/data/blueprints/casino";
import chain from "@/data/blueprints/chain";
import mmo from "@/data/blueprints/mmo";
import platform from "@/data/blueprints/platform";
import { VENTURE_BLUEPRINTS } from "@/data/blueprints/ventures";
import { Blueprint, BlueprintSection } from "@/types/blueprints";

// Every drawing at once, for the data tests. The page never imports this: it loads each section on demand.
export const SECTION_BLUEPRINTS: Record<BlueprintSection, Blueprint[]> = { ai, chain, platform, casino, mmo };

export const ALL_VENTURE_BLUEPRINTS = VENTURE_BLUEPRINTS;

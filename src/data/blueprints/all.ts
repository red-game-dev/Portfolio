import ai from "@/data/blueprints/ai";
import casino from "@/data/blueprints/casino";
import chain from "@/data/blueprints/chain";
import delivery from "@/data/blueprints/delivery";
import devops from "@/data/blueprints/devops";
import mmo from "@/data/blueprints/mmo";
import payments from "@/data/blueprints/payments";
import platform from "@/data/blueprints/platform";
import { VENTURE_BLUEPRINTS } from "@/data/blueprints/ventures";
import { Blueprint, BlueprintSection } from "@/types/blueprints";

// Every drawing at once, for the data tests. The page never imports this: it loads each section on demand.
export const SECTION_BLUEPRINTS: Record<BlueprintSection, Blueprint[]> = { ai, chain, delivery, platform, payments, devops, casino, mmo };

export const ALL_VENTURE_BLUEPRINTS = VENTURE_BLUEPRINTS;

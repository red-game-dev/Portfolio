import { ContentService, ContentSource } from "@/packages/core/content";
import { Guard, Mapper, Validator } from "@/packages/core/domain";

import { SolarSystemData, StarSystem } from "../domain/content";
import { isSolarSystemData } from "../guards/isSolarSystemData";
import { SystemLayout, SystemMapper } from "../mappers/SystemMapper";
import { SolarSystemValidator } from "../validators/SolarSystemValidator";

// The solar system from any source, proven, checked and laid out as the game's world.
export class SystemService extends ContentService<SolarSystemData, StarSystem> {
  protected readonly guard: Guard<SolarSystemData> = isSolarSystemData;
  protected readonly validator: Validator<SolarSystemData> = new SolarSystemValidator();
  protected readonly mapper: Mapper<SolarSystemData, StarSystem>;

  constructor(source: ContentSource, layout: SystemLayout) {
    super(source);
    this.mapper = new SystemMapper(layout);
  }
}

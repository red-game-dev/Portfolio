import { ContentService, ContentSource } from "@/packages/core/content";
import { Guard, Mapper, Validator } from "@/packages/core/domain";

import { Route, SolarSystemData } from "../domain/content";
import { isSolarSystemData } from "../guards/isSolarSystemData";
import { RouteLayout, RouteMapper } from "../mappers/RouteMapper";
import { SolarSystemValidator } from "../validators/SolarSystemValidator";

// The solar system from any source, proven, checked and laid out as the game's route.
export class RouteService extends ContentService<SolarSystemData, Route> {
  protected readonly guard: Guard<SolarSystemData> = isSolarSystemData;
  protected readonly validator: Validator<SolarSystemData> = new SolarSystemValidator();
  protected readonly mapper: Mapper<SolarSystemData, Route>;

  constructor(source: ContentSource, layout: RouteLayout) {
    super(source);
    this.mapper = new RouteMapper(layout);
  }
}

import { voyageMessage, voyagePlace } from "@/components/Finale/Voyage/messages";
import { portfolioData } from "@/data/resume";
import { SOLAR_ROUTE, VoyageSnapshot } from "@/packages/games/voyage";

const { voyage } = portfolioData.finale;
const universes = ["The Matrix", "AI", "Chain", "Casino", "Game world"];
const at = (snapshot: Partial<VoyageSnapshot>): VoyageSnapshot => ({
  status: "flying", phase: "solar", universe: -1, universes: 0, shields: 3, score: 0, au: 1, passing: null, ...snapshot,
});

describe("the voyage's messages", () => {
  test("every stop on the way out has a name", () => {
    expect(SOLAR_ROUTE.filter((stop) => !voyage.stops[stop.id])).toEqual([]);
  });

  test("each stop is said once as it comes up, and nothing is said while nothing changes", () => {
    const moon = at({ passing: "moon" });

    expect(voyageMessage(voyage, moon, at({}), universes)).toBe("Passing the Moon");
    expect(voyageMessage(voyage, moon, moon, universes)).toBeNull();
    expect(voyageMessage(voyage, at({ passing: "jupiter", au: 5 }), moon, universes)).toBe("Passing Jupiter");
  });

  test("the black hole, being lost in it, and where the ship comes out", () => {
    const pluto = at({ passing: "pluto", au: 39.5 });
    const singularity = at({ phase: "singularity", passing: "pluto" });
    const lost = at({ phase: "lost", passing: "pluto" });

    expect(voyageMessage(voyage, singularity, pluto, universes)).toBe(voyage.singularity);
    expect(voyageMessage(voyage, lost, singularity, universes)).toBe(voyage.lost);
    expect(voyageMessage(voyage, at({ phase: "universe", universe: 0, universes: 1 }), lost, universes)).toBe("You wake up in The Matrix");
    expect(voyageMessage(voyage, at({ phase: "universe", universe: 3, universes: 2 }), at({ phase: "lost", universe: 0, universes: 1 }), universes))
      .toBe("Thrown into Casino");
  });

  test("a run that has ended says nothing more", () => {
    expect(voyageMessage(voyage, at({ status: "over", passing: "mars" }), at({ passing: "moon" }), universes)).toBeNull();
  });

  test("the top of the screen gives the distance on the way out, then the universe and how many so far", () => {
    expect(voyagePlace(voyage, at({ au: 5.2 }), universes)).toBe("5.2 AU from the Sun");
    expect(voyagePlace(voyage, at({ phase: "universe", universe: 1, universes: 3 }), universes)).toBe("Universe 3: AI");
    expect(voyagePlace(voyage, at({ phase: "lost" }), universes)).toBe(voyage.lost);
  });
});

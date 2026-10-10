import { DEFAULT_UNIVERSE_NAMES, DEFAULT_VOYAGE_CONFIG, SolarSystemSource, SystemService, UniverseGenerator } from "@/packages/games/voyage";

it("sun", () => {
  const system = new SystemService(new SolarSystemSource(), DEFAULT_VOYAGE_CONFIG.layout).getView();
  const generator = new UniverseGenerator(DEFAULT_VOYAGE_CONFIG.layout, DEFAULT_UNIVERSE_NAMES);
  const mus = Array.from({ length: 200 }, (_, i) => generator.generate(6, 100 + i * 13, null)).map((s) => `${s.starKind}:${s.system.star.mu.toFixed(1)}`);
  console.log(`sun mu ${system.star.mu.toFixed(2)} radius ${system.star.radius.toFixed(2)} earth mu ${system.bodies.find((b) => b.id === "earth")!.mu.toFixed(4)} jupiter ${system.bodies.find((b) => b.id === "jupiter")!.mu.toFixed(3)} edge ${system.edge.toFixed(0)}\n${[...new Set(mus)].slice(0, 30).join(" ")}`);
});

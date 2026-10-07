import {
  BinaryGlyphSource,
  CharacterGlyphSource,
  createGrid,
  DEFAULT_RAIN_CONFIG,
  isMessageComplete,
  RainSimulation
} from "@/packages/effects/binary-rain";
import { createSeededRandom } from "@/packages/math/random";

const MESSAGE = ["33,000+ prompts", "Feb to Oct 2026"];

const createSimulation = (seed = 7, glyphs = new BinaryGlyphSource()) => new RainSimulation(
  createGrid(900, 300, DEFAULT_RAIN_CONFIG),
  MESSAGE,
  { config: DEFAULT_RAIN_CONFIG, glyphs, random: createSeededRandom(seed) }
);

const runFor = (simulation: RainSimulation, from: number, durationMs: number, stepMs = 33) => {
  for (let time = from + stepMs; time <= from + durationMs; time += stepMs) {
    simulation.step(stepMs, time);
  }
};

describe("effects/binary-rain RainSimulation", () => {
  test("a seed replays the exact same rain", () => {
    const first = createSimulation(11);
    const second = createSimulation(11);

    runFor(first, 0, 1000);
    runFor(second, 0, 1000);

    expect(first.state.columns).toEqual(second.state.columns);
  });

  test("draws its glyphs from the injected source", () => {
    const simulation = createSimulation(3, new CharacterGlyphSource("x"));

    runFor(simulation, 0, 2000);

    expect(simulation.state.columns.every((column) => column.glyphs.every((glyph) => glyph === "x"))).toBe(true);
  });

  test("nothing locks before the message is armed", () => {
    const simulation = createSimulation();

    runFor(simulation, 0, 5000);

    expect(simulation.state.message.every((cell) => cell.lockedAt === null)).toBe(true);
  });

  test("arming sends a fresh stream from above through every letter column", () => {
    const simulation = createSimulation();
    const letterColumns = new Set(simulation.state.message.map((cell) => cell.column));

    simulation.arm(0);

    letterColumns.forEach((column) => {
      expect(simulation.state.columns[column].stream.head).toBeLessThanOrEqual(0);
    });
  });

  test("letters lock as their stream passes and all of them land within the deadline", () => {
    const simulation = createSimulation();
    const { forceLockAfterMs, forceLockStaggerMs } = DEFAULT_RAIN_CONFIG;
    const deadline = forceLockAfterMs + simulation.state.message.length * forceLockStaggerMs;

    simulation.arm(0);
    runFor(simulation, 0, 600);

    expect(simulation.state.message.some((cell) => cell.lockedAt !== null)).toBe(true);

    runFor(simulation, 600, deadline);

    expect(isMessageComplete(simulation.state)).toBe(true);
  });

  test("lockAll places every letter at once without a fresh flash", () => {
    const simulation = createSimulation();

    simulation.lockAll();

    expect(isMessageComplete(simulation.state)).toBe(true);
    expect(simulation.state.message.every((cell) => cell.lockedAt === Number.NEGATIVE_INFINITY)).toBe(true);
  });

  test("a stream that leaves the bottom respawns above the top", () => {
    const simulation = createSimulation();
    const column = simulation.state.columns[0];

    column.stream = { head: simulation.state.grid.rows + 50, speed: 10, length: 5 };
    simulation.step(33, 33);

    expect(simulation.state.columns[0].stream.head).toBeLessThanOrEqual(0);
  });
});

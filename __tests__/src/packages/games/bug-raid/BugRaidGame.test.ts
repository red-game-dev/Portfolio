import { ManualScheduler } from "@/packages/animation/frame-loop";
import { BugRaidGame, BugRaidRenderer, BugRaidSnapshot } from "@/packages/games/bug-raid";
import { createSeededRandom } from "@/packages/math/random";

const FRAME_MS = 1000 / 60;

const createGame = (config = {}) => {
  const resize = jest.fn();
  const draw = jest.fn();
  const renderer: BugRaidRenderer = { resize, draw };
  const scheduler = new ManualScheduler();
  const changes: BugRaidSnapshot[] = [];
  const game = new BugRaidGame(renderer, {
    config,
    scheduler,
    random: createSeededRandom(11),
    onChange: (snapshot) => changes.push(snapshot),
  });

  game.resize({ width: 400, height: 300 }, 1);

  let time = 0;
  const tick = (frames = 1) => {
    for (let frame = 0; frame < frames; frame += 1) {
      time += FRAME_MS;
      scheduler.tick(time);
    }
  };

  return { game, draw, resize, scheduler, changes, tick };
};

describe("games/bug-raid BugRaidGame", () => {
  test("resize sizes the renderer and draws a still frame", () => {
    const { resize, draw } = createGame();

    expect(resize).toHaveBeenCalledWith({ width: 400, height: 300 }, 1);
    expect(draw).toHaveBeenCalledTimes(1);
  });

  test("play starts the loop and publishes the new run once", () => {
    const { game, changes, scheduler } = createGame();

    game.play();

    expect(game.isRunning).toBe(true);
    expect(scheduler.pendingCount).toBe(1);
    expect(changes).toEqual([{ status: "playing", score: 0, lives: 3, wave: 1 }]);
  });

  test("snapshots are published on change, not every frame", () => {
    const { game, changes, tick } = createGame();

    game.play();
    tick(30);

    expect(changes).toHaveLength(1);
  });

  test("input is ignored while paused and resume carries on", () => {
    const { game, tick } = createGame();

    game.play();
    tick(2);
    game.pause();

    expect(game.isRunning).toBe(false);
    expect(game.strike(200, 0)).toBe(false);

    game.resume();
    expect(game.isRunning).toBe(true);
  });

  test("the loop stops by itself when the run ends", () => {
    const { game, changes, tick } = createGame({ lives: 1, spawnEveryMs: 300, minSpawnEveryMs: 300 });

    game.play();
    tick(60 * 30);

    expect(game.isRunning).toBe(false);
    expect(changes[changes.length - 1]).toMatchObject({ status: "over", lives: 0 });

    game.resume();
    expect(game.isRunning).toBe(false);
  });
});

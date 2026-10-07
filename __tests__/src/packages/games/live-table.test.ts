import { FrameLoop, ManualScheduler } from "@/packages/animation/frame-loop";
import {
  DealerPainter,
  DEFAULT_DEALER_LOOK,
  DEFAULT_DEALER_OUTFITS,
  createDealerModel,
  LiveTableGame,
  LiveTableRenderer,
  LiveTableSimulation,
  resolveLiveTableConfig
} from "@/packages/games/live-table";
import { DrawableSurface } from "@/packages/graphics/canvas";
import { RigActor, RigRenderer } from "@/packages/graphics/rig";

const CARDS = ["wallets", "bonuses", "sportsbook"];
const config = resolveLiveTableConfig({
  phases: [
    { phase: "place", ms: 1000 },
    { phase: "final", ms: 500 },
    { phase: "closed", ms: 500 },
    { phase: "reveal", ms: 500 },
  ],
  opponents: 2,
  opponentHand: 3,
  opponentThrowsPerSecond: 0,
});

const simulation = (overrides = {}, random = () => 0.5) => new LiveTableSimulation(CARDS, { config: { ...config, ...overrides }, random });

describe("games/live-table", () => {
  test("a round runs place, final, closed and reveal, then the next round starts", () => {
    const table = simulation();
    const phases = [table.phase];

    [1000, 500, 500, 500].forEach((ms) => {
      table.step(ms);
      phases.push(table.phase);
    });

    expect(phases).toEqual(["place", "final", "closed", "reveal", "place"]);
    expect(table.snapshot.round).toBe(2);
  });

  test("bets are taken while they are open and refused once no more bets is called", () => {
    const table = simulation();

    expect(table.play("bonuses")).toEqual({ accepted: true });
    table.step(1000);
    expect(table.play("wallets")).toEqual({ accepted: true });
    table.step(500);
    expect(table.phase).toBe("closed");
    expect(table.play("sportsbook")).toEqual({ accepted: false, reason: "closed" });
    expect(table.snapshot.played).toEqual(["bonuses", "wallets"]);
    expect(table.snapshot.hand).toEqual(["sportsbook"]);
    expect(table.snapshot.canPlay).toBe(false);
  });

  test("a card can only be played once, and redeal picks every card back up in order", () => {
    const table = simulation();

    table.play("sportsbook");

    expect(table.play("sportsbook")).toEqual({ accepted: false, reason: "not-in-hand" });

    table.redeal();

    expect(table.snapshot.hand).toEqual(CARDS);
    expect(table.snapshot.played).toEqual([]);
  });

  test("other players throw only while bets are open, and the table is swept for the next round", () => {
    const table = simulation({ opponentThrowsPerSecond: 1000 }, () => 0);
    const events = table.step(100);

    expect(events.filter((event) => event.type === "throw")).toHaveLength(2);
    expect(table.snapshot.opponents.map((opponent) => opponent.cardsLeft)).toEqual([2, 2]);

    table.step(1400);
    expect(table.phase).toBe("closed");

    const before = table.scene.throws.length;

    table.step(100);
    expect(table.scene.throws.length).toBe(before);

    const sweep = table.step(900);

    expect(sweep.map((event) => event.type)).toContain("sweep");
    expect(table.snapshot.opponents.map((opponent) => opponent.cardsLeft)).toEqual([3, 3]);
  });

  test("your cards stay on the table across rounds", () => {
    const table = simulation();

    table.play("wallets");
    table.step(2500);

    expect(table.snapshot.round).toBe(2);
    expect(table.snapshot.played).toEqual(["wallets"]);
  });

  test("the game reports changes, not frames, and draws every frame", () => {
    const draws: number[] = [];
    const renderer: LiveTableRenderer = { resize: () => undefined, draw: (_, now) => draws.push(now) };
    const changes: string[] = [];
    const scheduler = new ManualScheduler();
    const game = new LiveTableGame(renderer, CARDS, { config, scheduler, random: () => 0.5, onChange: (snapshot) => changes.push(snapshot.phase) });

    expect(game).toBeInstanceOf(FrameLoop);
    game.start();

    // The first frame steps one frame's worth (about 33ms at 30fps), then each tick 50ms: about 1.98s in all.
    for (let frame = 0; frame < 40; frame += 1) {
      scheduler.tick(frame * 50);
    }

    expect(draws.length).toBeGreaterThan(30);
    expect(changes).toEqual(["final", "closed"]);
    expect(game.play("bonuses")).toEqual({ accepted: false, reason: "closed" });
  });
});

describe("games/live-table dealer", () => {
  const fakeSurface = (width: number, height: number): DrawableSurface => {
    const surface = { width, height } as unknown as OffscreenCanvas;

    // Accepts any drawing call, so the real painter runs against it.
    const context = new Proxy({ canvas: surface }, {
      get: (target, key) => (key === "canvas" ? target.canvas
        : key === "createLinearGradient" || key === "createRadialGradient" ? () => ({ addColorStop: () => undefined }) : () => undefined),
      set: () => true,
    }) as unknown as OffscreenCanvasRenderingContext2D;

    return { surface, context };
  };
  const dealerActor = (context: CanvasRenderingContext2D) => new RigActor(context, {
    model: createDealerModel(),
    skins: DEFAULT_DEALER_OUTFITS,
    scheduler: new ManualScheduler(),
    renderer: new RigRenderer(createDealerModel(), { createSurface: fakeSurface }),
  });

  const fakeContext = () => {
    const canvas = { width: 0, height: 0 };
    const calls: string[] = [];
    const context = {
      canvas,
      setTransform: () => calls.push("setTransform"),
      clearRect: () => calls.push("clear"),
      drawImage: () => calls.push("draw"),
      translate: () => undefined,
      rotate: () => undefined,
      save: () => undefined,
      restore: () => undefined,
    } as unknown as CanvasRenderingContext2D;

    return { canvas, calls, context };
  };

  test("sizes the canvas from its width at the drawing's proportions and device resolution", () => {
    const { canvas, context } = fakeContext();
    const dealer = dealerActor(context);

    dealer.resize(150, 2);

    expect(canvas).toEqual({ width: 300, height: 360 });
  });

  test("outfits wrap around in both directions", () => {
    const { context } = fakeContext();
    const dealer = dealerActor(context);

    dealer.setSkin(dealer.skinCount);
    expect(dealer.skin).toBe(0);
    dealer.setSkin(-1);
    expect(dealer.skin).toBe(dealer.skinCount - 1);
  });

  test("only a sequin dress is cached per twinkle; the others keep one body frame", () => {
    const model = createDealerModel();
    const body = model.layers.find((layer) => layer.id === "body");
    const keysFor = (index: number) => (typeof body?.keyChannels === "function" ? body.keyChannels(DEFAULT_DEALER_OUTFITS[index]) : []);

    expect(DEFAULT_DEALER_OUTFITS.map((_, index) => keysFor(index))).toEqual(DEFAULT_DEALER_OUTFITS.map((outfit) => (outfit.hasSparkle ? ["sparkle"] : [])));
  });

  test("she talks while the talk cue plays and blinks on her own", () => {
    const model = createDealerModel();
    const playing = (name: string) => ({ progress: (cue: string) => (cue === name ? 0.5 : null) });
    const idle = { progress: () => null };
    const mouths = Array.from({ length: 20 }, (_, index) => model.channels(index * 37, playing("talk")).mouth);

    expect(new Set(mouths).size).toBeGreaterThan(1);
    expect(model.channels(500, idle).mouth).toBe(0);
    expect(model.channels(500, playing("blink")).blink).toBe(2);
  });

  test("the painter draws every outfit in every pose without throwing", () => {
    const painter = new DealerPainter(DEFAULT_DEALER_LOOK);
    const context = new Proxy({}, {
      get: (_, key) => (key === "createLinearGradient" || key === "createRadialGradient" ? () => ({ addColorStop: () => undefined }) : () => undefined),
      set: () => true,
    }) as unknown as CanvasRenderingContext2D;

    DEFAULT_DEALER_OUTFITS.forEach((outfit) => {
      [{ time: 0, isTalking: false, blink: 0 }, { time: 1.3, isTalking: true, blink: 1 }].forEach((pose) => {
        expect(() => painter.paint(context, outfit, pose)).not.toThrow();
      });
    });
  });
});

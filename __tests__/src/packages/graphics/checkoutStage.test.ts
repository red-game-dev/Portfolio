import { approvedAt, CHECKOUT_LAYOUT, checkoutAt, CheckoutSkin, keysFor } from "@/packages/graphics/checkout";
import { CHECKOUT_MODELS, checkoutStageMap, warmCheckoutStage } from "@/packages/graphics/checkout-stage";
import { HAND_GRIPS, handField, RIGHT_HAND } from "@/packages/graphics/hand";
import type { ActorState, Stage, StageScene } from "@/packages/graphics/stage3d";
import { conjugate, dot, normalize, rotate, sub, vec3 } from "@/packages/math/space";

const keys = keysFor("€18.40");

const skinOf = (gesture: CheckoutSkin["look"]["gesture"]): CheckoutSkin => ({
  id: `test-${gesture}`,
  look: { gesture, app: 0, face: ["#000000", "#111111"], mark: { width: 1, height: 1, parts: [] } },
  amount: "€18.40",
  accent: "#36e3c4",
});

const actorOf = (frame: ReturnType<ReturnType<typeof checkoutStageMap>["frameOf"]>, id: string) => frame.actors.find((actor) => actor.id === id);

const GESTURES = ["tap", "wallet", "scan", "insert", "swipe", "face"] as const;

// How near the glass a hand's flesh comes: its lowest point in stage space, from the hand's field in the pose it holds.
const lowestOf = (scene: StageScene, state: ActorState): number => {
  const unit = scene.actors.find((actor) => actor.id === state.id)?.unit ?? 1;
  const towardsGlass = rotate(conjugate(state.rotation), vec3(0, 0, -1));

  return state.position.z - unit * handField(RIGHT_HAND, state.joints ?? []).reach(towardsGlass);
};

describe("the checkout on a 3D stage", () => {
  it("holds a card with the hand meshed pinching one and a phone with the hand meshed pinching that, and cuts away only a card's end in a reader", () => {
    const card = checkoutStageMap(skinOf("tap")).scene;
    const phone = checkoutStageMap(skinOf("wallet")).scene;
    const gripModel = (scene: typeof card) => {
      const grip = scene.actors.find((actor) => actor.id === "grip");

      return grip?.parts[0].shape.kind === "model" ? grip.parts[0].shape.model : null;
    };

    expect(gripModel(card)).toBe(CHECKOUT_MODELS.card);
    expect(gripModel(phone)).toBe(CHECKOUT_MODELS.phone);
    const { body } = CHECKOUT_LAYOUT;
    const cutOf = (gesture: CheckoutSkin["look"]["gesture"]) => checkoutStageMap(skinOf(gesture)).scene.actors.find((actor) => actor.id === "card")?.hiddenInside;

    expect(cutOf("insert")).toEqual({ x: body.x, y: body.y, width: body.width, height: body.height });
    expect(cutOf("swipe")).toEqual(cutOf("insert"));
    expect(cutOf("tap")).toBeUndefined();
  });

  it("holds a card and a phone the size their grips were found for, so no finger passes into them here either", () => {
    const unit = checkoutStageMap(skinOf("tap")).scene.actors.find((actor) => actor.id === "grip")?.unit ?? 0;
    const { card, phone } = CHECKOUT_LAYOUT;

    [HAND_GRIPS.card, HAND_GRIPS.cardEnd].forEach((grip) => {
      expect(grip.size.width * unit).toBeCloseTo(card.long, 0);
      expect(grip.size.height * unit).toBeCloseTo(card.short, 0);
    });
    expect(HAND_GRIPS.phone.size.width * unit).toBeCloseTo(phone.width, 0);
    expect(HAND_GRIPS.phone.size.height * unit).toBeCloseTo(phone.height, 0);
    expect(HAND_GRIPS.phone.size.thickness * unit).toBeCloseTo(phone.depth, 0);
  });

  it("shows the cashier while keying, then the card held to the terminal by the customer's hand", () => {
    const map = checkoutStageMap(skinOf("tap"));
    const keying = map.frameOf(checkoutAt(0.15, "full", "tap", 0, keys));
    const paying = map.frameOf(checkoutAt(approvedAt("full", "tap", 0, keys) - 0.12, "full", "tap", 0, keys));

    expect(actorOf(keying, "cashier")?.isShown).toBe(true);
    expect(actorOf(keying, "card")?.isShown).toBe(false);
    expect(actorOf(paying, "card")?.isShown).toBe(true);
    expect(actorOf(paying, "grip")?.isShown).toBe(true);
    // Off the glass, in front of the terminal.
    expect(actorOf(paying, "card")?.position.z).toBeGreaterThan(5);
  });

  it("keeps a card going into the reader in front of the glass, with the hand that holds it", () => {
    const map = checkoutStageMap(skinOf("swipe"));
    // Halfway down the stripe.
    const frames = Array.from({ length: 200 }, (_, step) => checkoutAt(step / 200, "full", "swipe", 0, keys));
    const halfway = frames.find((frame) => frame.item && frame.item.x < 205 && frame.item.y > 90) ?? frames[0];
    const swiping = map.frameOf(halfway);
    const grip = actorOf(swiping, "grip");

    expect(actorOf(swiping, "card")?.position.z).toBeGreaterThan(0);
    expect(grip?.isShown).toBe(true);
    expect(grip && lowestOf(map.scene, grip)).toBeGreaterThanOrEqual(0);
  });

  it("swipes with the hand beside the terminal, clear of the screen's readout", () => {
    const map = checkoutStageMap(skinOf("swipe"));
    const { body, screen } = CHECKOUT_LAYOUT;

    for (let step = 0; step <= 200; step += 1) {
      const story = checkoutAt(step / 200, "full", "swipe", 0, keys);
      const grip = actorOf(map.frameOf(story), "grip");

      // Once the card is at the stripe, the hand's leftmost flesh is right of the screen's left three quarters.
      if (grip?.isShown && story.item && story.item.y > body.y && story.item.x < body.x + body.width + 20) {
        const leftmost = grip.position.x - 0.7 * handField(RIGHT_HAND, grip.joints ?? []).reach(rotate(conjugate(grip.rotation), vec3(-1, 0, 0)));

        expect(leftmost).toBeGreaterThan(screen.x + screen.width * 0.75);
      }
    }
  });

  it("never lets a hand pass behind the terminal's glass, whatever the way to pay", () => {
    GESTURES.forEach((gesture) => {
      const map = checkoutStageMap(skinOf(gesture));

      for (let step = 0; step <= 80; step += 1) {
        map.frameOf(checkoutAt(step / 80, "full", gesture, 0, keys)).actors
          .filter((actor) => actor.isShown && ["cashier", "pin", "grip"].includes(actor.id))
          .forEach((actor) => expect({ gesture, step, id: actor.id, lowest: lowestOf(map.scene, actor) >= 0 }).toEqual({ gesture, step, id: actor.id, lowest: true }));
      }
    });
  });

  it("compiles every material a payment can show once per stage, in a scene the stage keeps", async () => {
    const mounted: StageScene[] = [];
    const stage = { mount: (scene: StageScene) => Promise.resolve(mounted.push(scene)).then(() => ({ id: mounted.length })) } as unknown as Stage;

    await warmCheckoutStage(stage);
    await warmCheckoutStage(stage);

    expect(mounted).toHaveLength(1);

    const [scene] = mounted;
    const models = scene.actors.flatMap((actor) => actor.parts.flatMap((part) => (part.shape.kind === "model" ? [part.shape.model] : [])));
    const cards = scene.actors.filter((actor) => actor.id.startsWith("card-"));

    // Every hand wears the same skin, so the pointing hand and one holding hand cover it; the customer's head too.
    expect(new Set(models)).toEqual(new Set([CHECKOUT_MODELS.point, CHECKOUT_MODELS.card, CHECKOUT_MODELS.customer, CHECKOUT_MODELS.customerBlink]));
    expect(scene.actors.some((actor) => actor.id === "phone")).toBe(true);
    expect(new Set(cards.map((card) => card.parts[0].material?.finish))).toEqual(new Set(["metal", "gloss", "matte", "frosted"]));
    expect(cards.filter((card) => card.hiddenInside)).toHaveLength(4);
  });

  it("puts the customer paying by face beside the terminal, her face to its camera, moving as she stands", () => {
    const map = checkoutStageMap(skinOf("face"));
    const customer = map.scene.actors.find((actor) => actor.id === "customer");
    const frames = Array.from({ length: 101 }, (_, step) => checkoutAt(step / 100, "full", "face", 0, keys));
    const scanning = frames.filter((frame) => frame.screen.state === "face").map((frame) => actorOf(map.frameOf(frame), "customer"));
    const standing = scanning[0];
    const { body, camera: lens } = CHECKOUT_LAYOUT;

    expect(customer?.parts[0].shape).toEqual({ kind: "model", model: CHECKOUT_MODELS.customer });
    expect(scanning.length).toBeGreaterThan(5);
    expect(scanning.every((state) => state?.isShown)).toBe(true);

    if (!standing) {
      throw new Error("No customer while her face is read");
    }

    const facing = rotate(standing.rotation, vec3(0, 0, 1));
    const towardCamera = normalize(sub(vec3(lens.x, -lens.y, 0), standing.position));

    expect(standing.position.x).toBeGreaterThan(body.x + body.width);
    expect(dot(facing, towardCamera)).toBeGreaterThan(0.95);
    // Never still: she moves between frames, and blinks, her shut eyed head shown in her place for it.
    expect(scanning.some((state) => state?.position.x !== standing.position.x)).toBe(true);

    const story = Array.from({ length: 401 }, (_, step) => checkoutAt(step / 400, "full", "face", 0, keys)).filter((frame) => frame.screen.state !== "idle");
    const heads = story.map((frame) => [actorOf(map.frameOf(frame), "customer")?.isShown, actorOf(map.frameOf(frame), "customer-blink")?.isShown]);

    expect(heads.every(([open, shut]) => open !== shut)).toBe(true);
    expect(story.filter((frame, index) => heads[index][1]).every((frame) => frame.customer.blink > 0.5)).toBe(true);
    expect(heads.some(([, shut]) => shut)).toBe(true);
    expect(actorOf(map.frameOf(checkoutAt(null, "full", "face", 0, keys)), "customer")?.isShown).toBe(false);
    expect(checkoutStageMap(skinOf("tap")).scene.actors.some((actor) => actor.id === "customer")).toBe(false);
  });

  it("frames what the story's camera frames, and brightens the screen's glow as the payment is approved", () => {
    const map = checkoutStageMap(skinOf("tap"));
    const asking = map.frameOf(checkoutAt(0.5, "full", "tap", 0, keys));
    const approved = map.frameOf(checkoutAt(1, "full", "tap", 0, keys));
    const story = checkoutAt(0.5, "full", "tap", 0, keys);

    expect(asking.view.centre).toEqual({ x: story.camera.x, y: story.camera.y });
    expect(asking.view.zoom).toBe(story.camera.zoom);
    expect(approved.lights?.glow.intensity).toBeGreaterThan(asking.lights?.glow.intensity ?? 0);
  });
});

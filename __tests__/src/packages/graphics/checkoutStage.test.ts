import { approvedAt, checkoutAt, CheckoutSkin, keysFor } from "@/packages/graphics/checkout";
import { CHECKOUT_MODELS, checkoutStageMap } from "@/packages/graphics/checkout-stage";

const keys = keysFor("€18.40");

const skinOf = (gesture: CheckoutSkin["look"]["gesture"]): CheckoutSkin => ({
  id: `test-${gesture}`,
  look: { gesture, app: 0, face: ["#000000", "#111111"], mark: { width: 1, height: 1, parts: [] } },
  amount: "€18.40",
  accent: "#36e3c4",
});

const actorOf = (frame: ReturnType<ReturnType<typeof checkoutStageMap>["frameOf"]>, id: string) => frame.actors.find((actor) => actor.id === id);

describe("the checkout on a 3D stage", () => {
  it("holds a card with the hand meshed pinching one, a phone with the hand meshed pinching that, and hides the readers' insides", () => {
    const card = checkoutStageMap(skinOf("tap")).scene;
    const phone = checkoutStageMap(skinOf("wallet")).scene;
    const gripModel = (scene: typeof card) => {
      const grip = scene.actors.find((actor) => actor.id === "grip");

      return grip?.parts[0].shape.kind === "model" ? grip.parts[0].shape.model : null;
    };

    expect(gripModel(card)).toBe(CHECKOUT_MODELS.card);
    expect(gripModel(phone)).toBe(CHECKOUT_MODELS.phone);
    expect(card.actors.find((actor) => actor.id === "reader")?.isOccluder).toBe(true);
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

  it("puts a card going into the reader behind the terminal's face", () => {
    const map = checkoutStageMap(skinOf("insert"));
    const inserted = map.frameOf(checkoutAt(approvedAt("full", "insert", 0, keys) - 0.05, "full", "insert", 0, keys));

    expect(actorOf(inserted, "card")?.position.z).toBeLessThan(0);
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

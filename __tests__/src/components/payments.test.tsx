import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import { BlueprintTabs } from "@/components/Blueprint/BlueprintTabs";
import { LensProvider } from "@/components/Lens/context/LensContext";
import { approvedMsOf, payMsOf, RESET_MS, START_WAIT_MS } from "@/components/Payments/config";
import { PayTerminal } from "@/components/Payments/PayTerminal";
import { PaymentLayer } from "@/components/Payments/scene/PaymentLayer";
import { SwitchStage, useSwitch } from "@/components/SwitchStage";
import { isPaymentEffect, PAYMENT_SWITCH_MS, PaymentEffect, ZONE_EFFECTS } from "@/components/SwitchStage/config";
import {
  CARD_METHODS, isOnPhone, methodForSwitch, PAY_GESTURES, PAY_SEQUENCE, payAppOf, PAYMENT_DRAWING_ANCHORS, PAYMENT_GROUPS,
  PAYMENT_METHODS,
} from "@/config/payments";
import { audienceForHash, PAYMENT_CASES_ANCHOR, SECTION_IDS } from "@/config/sections";
import payments from "@/data/blueprints/payments";
import { portfolioData } from "@/data/resume";
import { MOTION_ATTRIBUTE } from "@/packages/accessibility/motion";
import { QUICK_STORY_MS } from "@/packages/graphics/checkout";

const PAYMENT_EFFECTS: PaymentEffect[] = ["pay", "tap", "sync", "route", "authorise", "split"];

describe("the ways to pay", () => {
  it("pays round the switches with every card network and wallet, and with QR apps and coins between them", () => {
    const paid = new Set(PAY_SEQUENCE);

    expect([...PAYMENT_GROUPS.cards, ...PAYMENT_GROUPS.wallets].filter((method) => !paid.has(method))).toEqual([]);
    expect(PAY_SEQUENCE.some((method) => PAYMENT_GROUPS.qr.includes(method))).toBe(true);
    expect(PAY_SEQUENCE.some((method) => PAYMENT_GROUPS.crypto.includes(method))).toBe(true);
    expect(PAY_SEQUENCE.filter((method) => !PAYMENT_METHODS.includes(method))).toEqual([]);
  });

  it("never meets the terminal the same way twice in a row, even as the round wraps", () => {
    const repeats = PAY_SEQUENCE.filter((method, index) =>
      PAY_GESTURES[method] === PAY_GESTURES[PAY_SEQUENCE[(index + 1) % PAY_SEQUENCE.length]]);

    expect(repeats).toEqual([]);
  });

  it("counts switches from one and wraps round", () => {
    expect(methodForSwitch(PAY_SEQUENCE, 1)).toBe(PAY_SEQUENCE[0]);
    expect(methodForSwitch(PAY_SEQUENCE, PAY_SEQUENCE.length + 2)).toBe(PAY_SEQUENCE[1]);
  });

  it("taps only cards at the POS, and keeps wallets and QR codes on a phone", () => {
    expect(CARD_METHODS.length).toBeGreaterThan(1);
    expect(CARD_METHODS.filter(isOnPhone)).toEqual([]);
    expect(PAYMENT_METHODS.filter((method) => PAY_GESTURES[method] === "wallet").every(isOnPhone)).toBe(true);
    // Paying by face holds neither a card nor a phone, and is never one of the POS drawing's cards.
    expect(PAYMENT_GROUPS.new.some(isOnPhone)).toBe(false);
    expect(CARD_METHODS.some((method) => PAY_GESTURES[method] === "face")).toBe(false);
  });

  it("names every method and group in the content, and lists each method in one group only", () => {
    const { methods, groups } = portfolioData.payments.terminal;

    expect(PAYMENT_METHODS.filter((method) => !methods[method])).toEqual([]);
    expect(Object.values(groups).every(Boolean)).toBe(true);
    expect(new Set(PAYMENT_METHODS).size).toBe(PAYMENT_METHODS.length);
  });

  it("opens the card app for cards and wallets, QR pay for the QR apps and the crypto app for every coin", () => {
    expect([...PAYMENT_GROUPS.cards, ...PAYMENT_GROUPS.wallets].every((method) => payAppOf(method) === "card")).toBe(true);
    expect(PAYMENT_GROUPS.qr.every((method) => payAppOf(method) === "qr")).toBe(true);
    expect(PAYMENT_GROUPS.crypto.every((method) => payAppOf(method) === "crypto")).toBe(true);
  });
});

describe("the payments switches", () => {
  it("are their own, never a zone's", () => {
    expect(PAYMENT_EFFECTS.every(isPaymentEffect)).toBe(true);
    expect(Object.values(ZONE_EFFECTS).some(isPaymentEffect)).toBe(false);
  });

  it("give every payments drawing a subject, each a different one", () => {
    const motions = payments.map((blueprint) => blueprint.motion);

    expect(motions.every(Boolean)).toBe(true);
    expect(new Set(motions).size).toBe(motions.length);
  });

  it.each(PAYMENT_EFFECTS)("draws %s as a layer the switch stage skips and screen readers never hear", (effect) => {
    const { container } = render(<PaymentLayer effect={effect} count={3} />);
    const layer = container.firstElementChild;

    expect(layer).toHaveAttribute("data-switch-fx");
    expect(layer).toHaveAttribute("aria-hidden", "true");
  });

  it("plays a payment's layer only where the stage is given one", () => {
    const Stage = ({ effect }: { effect: PaymentEffect | "scan" }) => {
      const switcher = useSwitch();

      return (
        <>
          <button type="button" onClick={() => switcher.play(1, "matrix", effect === "scan" ? undefined : effect)}>Switch</button>
          <SwitchStage switcher={switcher} paymentLayer={(played, count) => <span data-testid="layer">{`${played} ${count}`}</span>}>
            <p>Content</p>
          </SwitchStage>
        </>
      );
    };

    const { unmount } = render(<Stage effect="split" />);

    fireEvent.click(screen.getByRole("button", { name: "Switch" }));
    expect(screen.getByTestId("layer")).toHaveTextContent("split 1");
    unmount();

    render(<Stage effect="scan" />);
    fireEvent.click(screen.getByRole("button", { name: "Switch" }));
    expect(screen.queryByTestId("layer")).toBeNull();
  });
});

describe("the payments section's links", () => {
  it("is linked from the Payments & Ledger Architecture service", () => {
    const service = portfolioData.serviceGroups.flatMap((group) => group.services).find((item) => item.see);

    expect(service?.see?.href).toBe(`#${SECTION_IDS.payments}`);
  });

  it("opens the case studies on payments from the section's way on to them", () => {
    expect(audienceForHash(`#${PAYMENT_CASES_ANCHOR}`)).toBe("payments");
    expect(audienceForHash("#for-payments")).toBe("payments");
  });
});

describe("PayTerminal", () => {
  const content = portfolioData.payments.terminal;
  const visa = `Pay with ${content.methods.visa}`;
  // jsdom draws no counter, so it never says it started: the approval is counted from the press after the wait.
  const visaApprovedMs = START_WAIT_MS + approvedMsOf("visa", content.amount);
  const visaMs = payMsOf("visa", content.amount);

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    // Unmounted first, so the terminal does not hear the page's motion setting change back.
    cleanup();
    document.documentElement.removeAttribute(MOTION_ATTRIBUTE);
  });

  it("offers every way to pay as a button named for it", () => {
    render(<PayTerminal content={content} onPaid={jest.fn()} />);

    expect(screen.getAllByRole("button")).toHaveLength(PAYMENT_METHODS.length);
    expect(screen.getByRole("button", { name: visa })).toBeInTheDocument();
  });

  it("approves once the card has met the terminal, reads it out and opens the next drawing", () => {
    const onPaid = jest.fn();

    render(<PayTerminal content={content} onPaid={onPaid} />);
    fireEvent.click(screen.getByRole("button", { name: visa }));

    expect(onPaid).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    act(() => {
      jest.advanceTimersByTime(visaApprovedMs);
    });

    expect(onPaid).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(`${content.methods.visa}: approved.`);

    act(() => {
      jest.advanceTimersByTime(visaMs - approvedMsOf("visa", content.amount) + RESET_MS);
    });

    // Back to waiting for the next customer: no method is being paid with.
    expect(screen.getByRole("button", { name: visa })).not.toHaveAttribute("data-current");
  });

  it("takes no second payment while one is going through", () => {
    const onPaid = jest.fn();

    render(<PayTerminal content={content} onPaid={onPaid} />);
    fireEvent.click(screen.getByRole("button", { name: visa }));
    fireEvent.click(screen.getByRole("button", { name: `Pay with ${content.methods.applePay}` }));

    act(() => {
      jest.advanceTimersByTime(visaApprovedMs + 10);
    });

    expect(onPaid).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(content.methods.visa);
  });

  it("groups the ways to pay under their names", () => {
    render(<PayTerminal content={content} onPaid={jest.fn()} />);

    const crypto = screen.getByRole("group", { name: content.groups.crypto });

    expect(crypto.querySelectorAll("button")).toHaveLength(PAYMENT_GROUPS.crypto.length);
    expect(screen.getByRole("button", { name: `Pay with ${content.methods.solana}` })).toBeInTheDocument();
  });

  it("reads the same method paid twice out again, as a new line", () => {
    document.documentElement.setAttribute(MOTION_ATTRIBUTE, "reduced");
    render(<PayTerminal content={content} onPaid={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: visa }));
    const first = screen.getByRole("status").firstChild;

    fireEvent.click(screen.getByRole("button", { name: visa }));

    expect(screen.getByRole("status").firstChild).not.toBe(first);
    expect(screen.getByRole("status")).toHaveTextContent(`${content.methods.visa}: approved.`);
  });

  it("approves at once with nothing moving when the page keeps still", () => {
    document.documentElement.setAttribute(MOTION_ATTRIBUTE, "reduced");

    const onPaid = jest.fn();

    render(<PayTerminal content={content} onPaid={onPaid} />);
    fireEvent.click(screen.getByRole("button", { name: visa }));

    expect(onPaid).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(`${content.methods.visa}: approved.`);
  });
});

describe("the links to each payments drawing", () => {
  it("name every drawing once, each by its own anchor", () => {
    expect(payments.map((blueprint) => blueprint.anchor).sort()).toEqual(Object.values(PAYMENT_DRAWING_ANCHORS).sort());
  });
});

describe("BlueprintTabs", () => {
  afterEach(() => {
    window.history.replaceState(null, "", window.location.pathname);
  });

  it("opens the drawing a link names, when it arrives and as the hash changes", async () => {
    const labels = portfolioData.blueprintLabels;
    const selected = () => screen.getAllByRole("tab").find((tab) => tab.getAttribute("aria-selected") === "true")?.textContent;

    window.history.replaceState(null, "", `#${PAYMENT_DRAWING_ANCHORS.gateway}`);
    render(<LensProvider><BlueprintTabs blueprints={payments} labels={labels} /></LensProvider>);
    expect(selected()).toBe("Gateway");

    act(() => {
      window.history.replaceState(null, "", `#${PAYMENT_DRAWING_ANCHORS.payouts}`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(selected()).toBe("Payouts");

    // A tab chosen by hand stays chosen while the hash still names the other drawing.
    fireEvent.click(screen.getByRole("tab", { name: "POS" }));
    expect(selected()).toBe("POS");

    await act(async () => {
      await import("@/components/Payments/scene/PaymentLayer");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  it("opens the next drawing on each advance, wrapping round", async () => {
    const labels = portfolioData.blueprintLabels;
    const { rerender } = render(<LensProvider><BlueprintTabs blueprints={payments} labels={labels} advance={0} /></LensProvider>);
    const selected = () => screen.getAllByRole("tab").findIndex((tab) => tab.getAttribute("aria-selected") === "true");

    expect(selected()).toBe(0);

    rerender(<LensProvider><BlueprintTabs blueprints={payments} labels={labels} advance={1} /></LensProvider>);
    expect(selected()).toBe(1);

    payments.slice(1).forEach((_, index) => {
      rerender(<LensProvider><BlueprintTabs blueprints={payments} labels={labels} advance={index + 2} /></LensProvider>);
    });

    expect(selected()).toBe(0);

    // The payments switch arrives in a chunk of its own; let it land inside the test.
    await act(async () => {
      await import("@/components/Payments/scene/PaymentLayer");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });
});

describe("the checkout in a drawing's switch", () => {
  it("tells its payment in exactly the time the switch takes", () => {
    expect(QUICK_STORY_MS).toBe(PAYMENT_SWITCH_MS);
  });
});

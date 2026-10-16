import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import { BlueprintTabs } from "@/components/Blueprint/BlueprintTabs";
import { LensProvider } from "@/components/Lens/context/LensContext";
import { APPROVE_SHARE, RESET_MS, TERMINAL_PAY_MS } from "@/components/Payments/config";
import { PayTerminal } from "@/components/Payments/PayTerminal";
import { PaymentLayer } from "@/components/Payments/scene/PaymentLayer";
import { SwitchStage, useSwitch } from "@/components/SwitchStage";
import { isPaymentEffect, PaymentEffect, ZONE_EFFECTS } from "@/components/SwitchStage/config";
import {
  CARD_METHODS, isOnPhone, methodForSwitch, PAY_GESTURES, PAY_SEQUENCE, PAYMENT_METHODS,
} from "@/config/payments";
import { audienceForHash, PAYMENT_CASES_ANCHOR } from "@/config/sections";
import payments from "@/data/blueprints/payments";
import { portfolioData } from "@/data/resume";
import { MOTION_ATTRIBUTE } from "@/packages/accessibility/motion";

const PAYMENT_EFFECTS: PaymentEffect[] = ["pay", "tap", "sync", "route", "authorise", "split"];

describe("the ways to pay", () => {
  it("pays with every method once per round of switches", () => {
    expect([...PAY_SEQUENCE].sort()).toEqual([...PAYMENT_METHODS].sort());
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
  });

  it("names every method in the content", () => {
    const { methods } = portfolioData.payments.terminal;

    expect(PAYMENT_METHODS.filter((method) => !methods[method])).toEqual([]);
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
  it("opens the case studies on payments from the section's way on to them", () => {
    expect(audienceForHash(`#${PAYMENT_CASES_ANCHOR}`)).toBe("payments");
    expect(audienceForHash("#for-payments")).toBe("payments");
  });
});

describe("PayTerminal", () => {
  const content = portfolioData.payments.terminal;
  const visa = `Pay with ${content.methods.visa}`;

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
    expect(screen.getByText(content.processing)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(TERMINAL_PAY_MS * APPROVE_SHARE);
    });

    expect(onPaid).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(`${content.methods.visa}: approved.`);
    expect(screen.getByText(content.approved)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(RESET_MS);
    });

    expect(screen.getByText(content.amount)).toBeInTheDocument();
  });

  it("takes no second payment while one is going through", () => {
    const onPaid = jest.fn();

    render(<PayTerminal content={content} onPaid={onPaid} />);
    fireEvent.click(screen.getByRole("button", { name: visa }));
    fireEvent.click(screen.getByRole("button", { name: `Pay with ${content.methods.applePay}` }));

    act(() => {
      jest.advanceTimersByTime(TERMINAL_PAY_MS);
    });

    expect(onPaid).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(content.methods.visa);
  });

  it("shows a QR method's code on the screen while the phone scans it", () => {
    render(<PayTerminal content={content} onPaid={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: `Pay with ${content.methods.paypal}` }));

    expect(screen.queryByText(content.amount)).toBeNull();

    act(() => {
      jest.advanceTimersByTime(TERMINAL_PAY_MS * APPROVE_SHARE);
    });

    expect(screen.getByText(content.approved)).toBeInTheDocument();
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

describe("BlueprintTabs", () => {
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

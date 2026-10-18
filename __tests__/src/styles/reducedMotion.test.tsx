import tw, { css, styled } from "twin.macro";

import { render } from "@testing-library/react";

import { Stage } from "@/components/SwitchStage/effects";
import { media, noAnimationWhenReduced } from "@/styles/mixins";

// The page is kept still through the root's data-motion, and every component reaches it with media.reducedMotion. A rule
// written that way has to match the element it styles once the root says reduced: written as `:root[...] &`, the
// compiler took the leading colon for a pseudo-class of the component and glued it on (`.abc:root[...] .x`), a
// selector no element can match, so for a while nothing written with it stopped moving.
const TopLevel = styled.div(() => [
  css`
    transition: opacity 1s;

    ${media.reducedMotion} {
      transition: none;
    }
  `,
]);

const Nested = styled.ul(() => [
  css`
    & > li {
      transition: transform 1s;

      ${media.reducedMotion} {
        transition: none;
      }
    }
  `,
]);

const WithTwin = styled.span(() => [tw`block`, noAnimationWhenReduced]);

const reducedSelectors = () => [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules])
  .flatMap((rule) => (rule instanceof CSSStyleRule ? rule.selectorText.split(",").map((part) => part.trim()) : []))
  .filter((selector) => selector.includes("data-motion"));

describe("a rule for a page kept still", () => {
  beforeEach(() => {
    document.documentElement.dataset.motion = "reduced";
  });

  afterEach(() => {
    delete document.documentElement.dataset.motion;
  });

  test("matches the element it styles, at the top level, nested and beside twin's classes", () => {
    const { getByTestId } = render(
      <>
        <TopLevel data-testid="top" />
        <Nested>
          <li data-testid="item" />
        </Nested>
        <WithTwin data-testid="twin" />
      </>,
    );
    const selectors = reducedSelectors();
    const matched = (element: HTMLElement) => selectors.some((selector) => element.matches(selector));

    expect(selectors.length).toBeGreaterThan(0);
    expect(matched(getByTestId("top"))).toBe(true);
    expect(matched(getByTestId("item"))).toBe(true);
    expect(matched(getByTestId("twin"))).toBe(true);
  });

  test("never ties the root's state to the component's own class", () => {
    render(<TopLevel />);

    expect(reducedSelectors().filter((selector) => /\.[\w-]+:root/.test(selector))).toEqual([]);
  });

  test("blanks only the layers a switch's own effect lays over its items", () => {
    const blanked = () => [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules])
      .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText.includes("data-switch-item")
        && rule.style.getPropertyValue("content") === "none")
      .map((rule) => rule.selectorText);
    const item = <div><span data-switch-item="" /></div>;

    // A stage that lays nothing over its items (Web3's blocks, or none yet) leaves their own pseudo-elements alone, as
    // a chain node's block hash.
    render(<Stage effect={null}>{item}</Stage>);
    render(<Stage effect="blocks">{item}</Stage>);
    expect(blanked()).toEqual([]);

    render(<Stage effect="beamed">{item}</Stage>);
    expect(blanked().some((selector) => selector.endsWith("[data-switch-item]::after"))).toBe(true);
    expect(blanked().some((selector) => selector.endsWith("[data-switch-item]::before"))).toBe(false);
  });
});

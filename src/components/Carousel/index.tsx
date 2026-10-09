import { KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useSwipe } from "@/components/Carousel/hooks/useSwipe";
import { carouselPage, describePage, realignStart, wrapPage } from "@/components/Carousel/paging";
import { SwitchStage, useSwitch } from "@/components/SwitchStage";
import useMediaQuery from "@/hooks/useMediaQuery";
import { firstFocusable, isFocusLost, isInside, isTypingTarget } from "@/packages/interaction/focus";
import { HORIZONTAL_ARROWS, KeyMap } from "@/packages/interaction/keys";
import { honourHidden } from "@/styles/mixins";
import { CarouselLabels } from "@/types/carousel";

interface CarouselProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T, order: number) => ReactNode;
  label: string;
  labels: CarouselLabels;
  // Cards side by side on wide screens; phones always show one.
  perView?: 1 | 2 | 3;
}

// A swipe shorter than this is a tap or a scroll, not a page turn.
const SWIPE_PX = 40;

// Left and right turn the page, except while typing into a field among the cards.
const PAGE_KEYS = new KeyMap(HORIZONTAL_ARROWS, { skip: (event) => isTypingTarget(event.target) });

const Root = tw.section`flex flex-col gap-[14px]`;

const Slides = styled(SwitchStage)(({ perView }: { perView: number }) => [
  tw`grid gap-[18px] items-stretch`,
  perView === 2 && tw`lg:grid-cols-2`,
  perView === 3 && tw`lg:grid-cols-3`,
  css`
    touch-action: pan-y;
  `,
]);

const Slide = styled.div(() => [tw`min-w-0`, honourHidden]);

const Controls = tw.div`flex flex-row items-center justify-between gap-[12px]`;

const Arrow = styled.button(() => [
  tw`flex items-center justify-center w-[40px] h-[40px] cursor-pointer text-[var(--accent)] bg-[#0d0d0d] rounded-[2px] border-[1px] border-solid
     border-[var(--accent-muted)]`,
  css`
    transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease;

    &:hover,
    &:focus-visible {
      color: #101010;
      background: var(--accent);
      border-color: var(--accent);
    }
  `,
]);

const Middle = tw.div`flex-1 flex flex-col items-center gap-[8px] min-w-0`;

const Position = tw.span`text-xs text-[#999]`;

// One segment per page, the current one lit: a quest progress bar more than a row of dots.
const Track = tw.div`flex flex-row gap-[3px] w-full max-w-[320px]`;

const Segment = styled.button(({ isOn }: { isOn: boolean }) => [
  tw`flex-1 h-[16px] p-0 cursor-pointer bg-transparent border-0 relative`,
  css`
    &::before {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      top: 6px;
      height: 4px;
      background: ${isOn ? "var(--accent)" : "#2a2a2a"};
      box-shadow: ${isOn ? "0 0 8px rgba(var(--accent-rgb), 0.6)" : "none"};
      transition: background 0.2s ease;
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
    }
  `,
]);

// Cards shown a page at a time, with the switch of the universe the carousel sits in. Every card stays in
// the page, the others hidden, so search engines, find in page and screen readers still reach them. Arrows,
// swipes and the arrow keys turn the page, and it wraps at either end.
export const Carousel = <T,>({ items, getKey, renderItem, label, labels, perView = 2 }: CarouselProps<T>) => {
  const isWide = useMediaQuery("(min-width: 1024px)");
  const perPage = isWide ? perView : 1;
  const [start, setStart] = useState(0);
  const switcher = useSwitch();
  const rootRef = useRef<HTMLElement>(null);
  // Whether focus was among the cards or controls when the page turned, so it can follow the turn.
  const hadFocus = useRef(false);
  const { pages, page, first, last } = carouselPage(start, perPage, items.length);

  // A narrower or wider screen keeps the same first card in view.
  useEffect(() => {
    setStart((current) => realignStart(current, perPage));
  }, [perPage]);

  const goTo = (target: number, direction: 1 | -1) => {
    const next = wrapPage(target, pages);

    if (next !== page) {
      hadFocus.current = isInside(rootRef.current, document.activeElement);
      switcher.play(direction);
      setStart(next * perPage);
    }
  };

  // A page turned from the keyboard hides the card that had focus, and the browser drops focus to the page, where
  // the arrows no longer reach the carousel: focus moves to the first control on the page now shown, or to the
  // carousel itself.
  useEffect(() => {
    const root = rootRef.current;

    if (!hadFocus.current || !root) {
      return;
    }

    hadFocus.current = false;

    if (isFocusLost(document.activeElement)) {
      (firstFocusable(root) ?? root).focus({ preventScroll: true });
    }
  }, [start]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => PAGE_KEYS.handle(event, (step) => goTo(page + step, step));
  const swipe = useSwipe((step) => goTo(page + step, step), SWIPE_PX);

  const describe = (from: number, to: number) => describePage(from, to, items.length, labels);

  return (
    <Root ref={rootRef} tabIndex={-1} aria-roledescription="carousel" aria-label={label} onKeyDown={onKeyDown}>
      <Slides switcher={switcher} perView={perView} onPointerDown={swipe.onPointerDown} onPointerUp={swipe.onPointerUp}>
        {items.map((item, index) => (
          <Slide
            key={getKey(item)}
            hidden={index < first || index >= last}
            aria-roledescription="slide"
            aria-label={`${index + 1} / ${items.length}`}
          >
            {renderItem(item, index - first)}
          </Slide>
        ))}
      </Slides>
      {pages > 1 && (
        <Controls>
          <Arrow type="button" aria-label={labels.previous} onClick={() => goTo(page - 1, -1)}>
            <FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" />
          </Arrow>
          <Middle>
            <Position aria-live="polite">{describe(first + 1, last)}</Position>
            <Track>
              {Array.from({ length: pages }, (_, index) => (
                <Segment
                  key={index}
                  type="button"
                  isOn={index === page}
                  aria-label={describe(index * perPage + 1, Math.min(items.length, (index + 1) * perPage))}
                  aria-current={index === page ? "true" : undefined}
                  onClick={() => goTo(index, index > page ? 1 : -1)}
                />
              ))}
            </Track>
          </Middle>
          <Arrow type="button" aria-label={labels.next} onClick={() => goTo(page + 1, 1)}>
            <FontAwesomeIcon icon={faChevronRight} aria-hidden="true" />
          </Arrow>
        </Controls>
      )}
    </Root>
  );
};

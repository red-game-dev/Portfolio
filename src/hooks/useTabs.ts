import { KeyboardEvent, useCallback, useId, useRef, useState } from "react";

import { rovingTarget } from "@/packages/accessibility/roving";

interface TabsOptions {
  count: number;
  // Called before the switch with the tab being opened and the one being left, for direction aware effects.
  onSelect?: (next: number, previous: number) => void;
}

// The WAI-ARIA tabs pattern in one place: one tab stop for the whole row, arrows, Home and End to move,
// a tab opens as it is focused, and each tab and its panel wired together by id. Spread `listProps` on the
// tablist, `tabProps(index)` on each tab and `panelProps(index)` on each panel. Rendering every panel and
// letting `hidden` hide the others keeps all of them in the server HTML; a showcase that only ever mounts
// the open one passes `panelProps(active)`.
const useTabs = ({ count, onSelect }: TabsOptions) => {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const panelId = (index: number) => `${baseId}-panel-${index}`;
  const tabId = (index: number) => `${baseId}-tab-${index}`;

  const select = useCallback((index: number) => {
    if (index === active) {
      return;
    }

    onSelect?.(index, active);
    setActive(index);
  }, [active, onSelect]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    const next = rovingTarget(event.key, active, count);

    if (next === null) {
      return;
    }

    event.preventDefault();
    // A dialog around the tabs may also listen for arrows, to travel between its own items.
    event.stopPropagation();
    select(next);
    listRef.current?.querySelectorAll<HTMLElement>("[role=tab]")[next]?.focus();
  }, [active, count, select]);

  return {
    active,
    select,
    listProps: { ref: listRef, role: "tablist" as const },
    tabProps: (index: number) => ({
      "id": tabId(index),
      "type": "button" as const,
      "role": "tab" as const,
      "aria-selected": index === active,
      "aria-controls": panelId(index),
      "tabIndex": index === active ? 0 : -1,
      "onClick": () => select(index),
      onKeyDown,
    }),
    panelProps: (index: number) => ({
      "id": panelId(index),
      "role": "tabpanel" as const,
      "aria-labelledby": tabId(index),
      "hidden": index !== active,
    }),
  };
};

export default useTabs;

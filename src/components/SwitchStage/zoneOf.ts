import { ZONE_BOUNDARIES, ZoneId } from "@/config/zones";

// The zone an element sits in: the last zone whose first section starts at or before it in the page.
// Read from document order, not from the scroll position, so it is right wherever the reader is.
export const zoneOf = (element: Element | null): ZoneId => {
  let zone = ZONE_BOUNDARIES[0].zone;

  if (!element) {
    return zone;
  }

  ZONE_BOUNDARIES.forEach(({ zone: candidate, startsAt }) => {
    const start = document.getElementById(startsAt);
    // compareDocumentPosition returns a bit mask; FOLLOWING set means the element comes after the start.
    // eslint-disable-next-line no-bitwise
    const isAtOrAfter = start && (start.contains(element) || Boolean(start.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING));

    if (isAtOrAfter) {
      zone = candidate;
    }
  });

  return zone;
};

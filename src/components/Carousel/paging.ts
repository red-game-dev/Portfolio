import { fill } from "@/packages/text/format";

export interface CarouselPage {
  pages: number;
  page: number;
  // The first card on the page and one past the last, as indexes into the items.
  first: number;
  last: number;
}

// The page holding `start`, for `count` cards shown `perPage` at a time. An empty carousel still has one page.
export const carouselPage = (start: number, perPage: number, count: number): CarouselPage => {
  const pages = Math.max(1, Math.ceil(count / perPage));
  const page = Math.min(pages - 1, Math.max(0, Math.floor(start / perPage)));
  const first = page * perPage;

  return { pages, page, first, last: Math.min(count, first + perPage) };
};

// Turning past either end wraps around.
export const wrapPage = (target: number, pages: number) => ((target % pages) + pages) % pages;

// When the cards per page change, start on the page that holds the card that was first.
export const realignStart = (start: number, perPage: number) => Math.floor(start / perPage) * perPage;

// "3 to 4 of 23", or "3 of 23" for a page of one card.
export const describePage = (from: number, to: number, count: number, labels: { position: string; single: string }) => fill(
  from === to ? labels.single : labels.position,
  { from, to, count },
);

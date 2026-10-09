import { carouselPage, describePage, realignStart, wrapPage } from "@/components/Carousel/paging";

describe("carousel paging", () => {
  test("pages hold perPage cards, and the last page holds what is left", () => {
    expect(carouselPage(0, 2, 23)).toEqual({ pages: 12, page: 0, first: 0, last: 2 });
    expect(carouselPage(22, 2, 23)).toEqual({ pages: 12, page: 11, first: 22, last: 23 });
  });

  test("a start past the end lands on the last page, and an empty carousel has one empty page", () => {
    expect(carouselPage(40, 2, 5)).toEqual({ pages: 3, page: 2, first: 4, last: 5 });
    expect(carouselPage(0, 2, 0)).toEqual({ pages: 1, page: 0, first: 0, last: 0 });
  });

  test("turning wraps at either end", () => {
    expect(wrapPage(-1, 12)).toBe(11);
    expect(wrapPage(12, 12)).toBe(0);
    expect(wrapPage(-13, 12)).toBe(11);
  });

  test("a new page size keeps the first card in view", () => {
    expect(realignStart(5, 2)).toBe(4);
    expect(realignStart(5, 1)).toBe(5);
  });

  test("the position reads as a range, or as one card", () => {
    const labels = { position: "{from} to {to} of {count}", single: "{from} of {count}" };

    expect(describePage(3, 4, 23, labels)).toBe("3 to 4 of 23");
    expect(describePage(3, 3, 23, labels)).toBe("3 of 23");
  });
});

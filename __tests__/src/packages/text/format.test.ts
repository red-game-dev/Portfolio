import {
  collapseWhitespace, fill, formatDateTime, formatDuration, formatHours, formatLatLon, formatLocalTime, formatNumber, twoDigits, utcDay,
} from "@/packages/text/format";

describe("fill", () => {
  it("fills every placeholder, numbers included, wherever and however often it appears", () => {
    expect(fill("{from} to {to} of {count}", { from: 3, to: 4, count: 23 })).toBe("3 to 4 of 23");
    expect(fill("{n} and {n} again", { n: 2 })).toBe("2 and 2 again");
  });

  it("leaves a placeholder without a value as written, so it shows rather than vanishes", () => {
    expect(fill("Stop {n} of {total}", { n: 1 })).toBe("Stop 1 of {total}");
  });

  it("does not read values off the object's prototype", () => {
    expect(fill("{toString}", {})).toBe("{toString}");
  });
});

describe("collapseWhitespace", () => {
  it("joins a multi line template literal into one line", () => {
    expect(collapseWhitespace(`  The breadth of his
      knowledge   is excellent. `)).toBe("The breadth of his knowledge is excellent.");
  });
});

describe("numbers and time", () => {
  it("writes numbers in thousands, to at most or exactly so many places", () => {
    expect(formatNumber(27500)).toBe("27,500");
    expect(formatNumber(2.5, 2)).toBe("2.5");
    expect(formatNumber(2.5, 2, true)).toBe("2.50");
    expect(formatNumber(1234.567)).toBe("1,235");
  });

  it("writes lengths of time as clocks show them, with or without hours", () => {
    expect(twoDigits(7)).toBe("07");
    expect(formatDuration(247)).toBe("4:07");
    expect(formatDuration(540, { withHours: true })).toBe("00:09:00");
    expect(formatDuration(3725.9, { withHours: true })).toBe("01:02:05");
    expect(formatDuration(-3)).toBe("0:00");
  });

  it("reads the time of day on a place's own clock, and the date in UTC", () => {
    const moment = Date.parse("2026-10-09T03:24:00Z");

    expect(formatLocalTime("America/New_York", moment)).toBe("23:24");
    expect(formatLocalTime("Europe/Malta", moment)).toBe("05:24");
    expect(formatLocalTime("Not/AZone", moment)).toBe("");
    expect(formatDateTime(moment)).toBe("9 Oct 2026, 03:24");
    expect(utcDay(moment)).toBe("2026-10-09");
  });

  it("writes a time of day from hours and a place from its latitude and longitude", () => {
    expect(formatHours(16.34)).toBe("16:20");
    expect(formatHours(25.5)).toBe("01:30");
    expect(formatLatLon(28.6084, -80.6043)).toBe("28.6° N, 80.6° W");
    expect(formatLatLon(-4.5, 137.4)).toBe("4.5° S, 137.4° E");
  });
});

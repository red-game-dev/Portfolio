import { isOffline, watchConnection } from "@/packages/browser/network";

describe("the browser's word on the connection", () => {
  it("is offline only when the browser says so", () => {
    const onLine = jest.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);

    try {
      expect(isOffline()).toBe(false);
      onLine.mockReturnValue(false);
      expect(isOffline()).toBe(true);
    } finally {
      onLine.mockRestore();
    }
  });

  it("hears the connection come and go until it stops listening", () => {
    const onChange = jest.fn();
    const stop = watchConnection(onChange);

    window.dispatchEvent(new Event("offline"));
    window.dispatchEvent(new Event("online"));
    expect(onChange).toHaveBeenCalledTimes(2);

    stop();
    window.dispatchEvent(new Event("offline"));
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

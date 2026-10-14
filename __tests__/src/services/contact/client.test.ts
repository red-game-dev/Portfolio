import { ApiClient } from "@/packages/http/api-client";
import { contactIsOpen, sendContact } from "@/services/contact/client";

const MESSAGE = { kind: "feedback" as const, message: "More case studies, please." };

describe("the form's client", () => {
  afterEach(() => jest.restoreAllMocks());

  const answering = (result: unknown) => jest.spyOn(ApiClient, "global").mockReturnValue({
    get: async () => result,
    post: async () => result,
  } as unknown as ApiClient);

  test("says the site can send only when it says so plainly", async () => {
    answering({ ok: true, status: 200, data: { isOpen: true } });
    expect(await contactIsOpen()).toBe(true);
    answering({ ok: true, status: 200, data: { isOpen: false } });
    expect(await contactIsOpen()).toBe(false);
    answering({ ok: false, status: 0, message: "offline", isCancelled: false });
    expect(await contactIsOpen()).toBe(false);
  });

  test("reads a refusal from its status (a full day and no way to send alike), and a server that cannot be reached as a failure", async () => {
    answering({ ok: true, status: 200, data: { ok: true } });
    expect(await sendContact(MESSAGE)).toEqual({ ok: true });

    const cases: Array<[number, string]> = [[400, "invalid"], [429, "limited"], [503, "unavailable"], [502, "failed"], [500, "failed"], [0, "failed"]];

    for (const [status, error] of cases) {
      answering({ ok: false, status, message: "", isCancelled: false });
      expect(await sendContact(MESSAGE)).toEqual({ error });
    }
  });
});

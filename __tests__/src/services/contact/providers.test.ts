/**
 * @jest-environment node
 */
import { ResendMailAdapter } from "@/packages/server/mail";
import { MAIL_ADAPTERS, mailAdapters } from "@/services/contact/server";

describe("the mail providers the site can send through", () => {
  const environment = { ...process.env };

  afterEach(() => {
    process.env = { ...environment };
  });

  test("each is built from its own environment, or is not there without its key", () => {
    delete process.env.RESEND_API_KEY;
    expect(MAIL_ADAPTERS.resend()).toBeNull();
    expect(mailAdapters(["resend"])).toEqual([]);

    process.env.RESEND_API_KEY = "re_test";
    expect(MAIL_ADAPTERS.resend()).toBeInstanceOf(ResendMailAdapter);
  });

  test("are tried in the order MAIL_PROVIDERS gives, those unknown or not set up left out", () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.MAIL_PROVIDERS = "nobody, resend";

    expect(mailAdapters().map((adapter) => adapter.id)).toEqual(["resend"]);
  });
});

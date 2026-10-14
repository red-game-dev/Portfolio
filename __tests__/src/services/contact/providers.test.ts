/**
 * @jest-environment node
 */
import { EMAIL_THEME } from "@/config/contact";
import { contactMail } from "@/packages/messaging/contact";
import { ResendMailAdapter } from "@/packages/server/mail";
import { contactRoute, MAIL_ADAPTERS, mailAdapters } from "@/services/contact/server";

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

describe("where a message goes", () => {
  test("to the inbox it is given, styled as the site looks, so no email goes out as plain text alone", () => {
    const route = contactRoute("inbox@example.test");
    const mail = route && contactMail({ kind: "message", subject: "Hiring", email: "visitor@example.test", message: "Hello there, a role for you." }, route);

    expect(route?.look?.theme).toBe(EMAIL_THEME);
    expect(mail?.to).toBe("inbox@example.test");
    expect(mail?.html).toContain(EMAIL_THEME.accents.message);
  });

  test("nowhere without an inbox, when the service says it cannot send", () => {
    expect(contactRoute("")).toBeNull();
  });
});

import { ApiClient } from "@/packages/http/api-client";
import { ResendMailSender } from "@/packages/server/mail";

// A client that keeps the config it was made with and the posts it was asked to make, answering with `status`.
const clientAnswering = (status: number) => {
  const calls: { config: unknown; posts: Array<{ path: string; body: unknown; options: unknown }> } = { config: null, posts: [] };
  const instance = {
    post: async (path: string, body: unknown, options: unknown) => {
      calls.posts.push({ path, body, options });

      return status === 200 ? { ok: true, status, data: { id: "email-1" } } : { ok: false, status, message: "refused", isCancelled: false };
    },
  };
  const client = { withConfig: (config: unknown) => {
    calls.config = config;

    return instance;
  } } as unknown as ApiClient;

  return { client, calls };
};

describe("sending mail through Resend", () => {
  const mail = { from: "Site <site@example.test>", to: "inbox@example.test", subject: "[example.test] Hello", text: "Hi there", replyTo: "visitor@example.test" };

  test("posts the email to Resend's API with the key, no retries, and a reply address only when there is one", async () => {
    const { client, calls } = clientAnswering(200);
    const sender = new ResendMailSender("re_test", client);

    expect(await sender.send(mail, "key-1")).toBe("sent");
    expect(calls.config).toMatchObject({ baseURL: "https://api.resend.com", headers: { Authorization: "Bearer re_test" }, retry: { retries: 0 } });
    expect(calls.posts[0]).toEqual({
      path: "/emails",
      body: { from: mail.from, to: mail.to, subject: mail.subject, text: mail.text, reply_to: mail.replyTo },
      options: { headers: { "Idempotency-Key": "key-1" } },
    });

    await sender.send({ ...mail, replyTo: undefined });
    expect(calls.posts[1].body).not.toHaveProperty("reply_to");
  });

  test("reads Resend's limits as limited, and anything else that fails as failed", async () => {
    expect(await new ResendMailSender("re_test", clientAnswering(429).client).send(mail)).toBe("limited");
    expect(await new ResendMailSender("re_test", clientAnswering(403).client).send(mail)).toBe("failed");
    expect(await new ResendMailSender("re_test", clientAnswering(0).client).send(mail)).toBe("failed");
  });
});

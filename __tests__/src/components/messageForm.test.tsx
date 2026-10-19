import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { MessageForm } from "@/components/Contact/MessageForm";
import { SECTION_IDS } from "@/config/sections";
import { portfolioData } from "@/data/resume";
import { ContactChannel, ContactDelivery, ContactRequest, Delivery, MailtoChannel } from "@/packages/messaging/contact";

import { stubCanvases } from "../fixtures/dom";
import { instanceOf } from "../fixtures/guards";

jest.mock("@/services/contact/client", () => {
  const contactIsOpen = jest.fn();
  const sendContact = jest.fn();

  return { contactIsOpen, sendContact, createContactDelivery: () => ({ status: () => contactIsOpen(), deliver: (request: unknown) => sendContact(request) }) };
});

const client = jest.requireMock<{ contactIsOpen: jest.Mock; sendContact: jest.Mock }>("@/services/contact/client");
const { forms, details } = portfolioData;

// A channel that can always send and refuses every message as the server would an invalid email.
class RefusingChannel extends ContactChannel {
  public readonly id = "refusing";
  public readonly asked = jest.fn();
  public readonly given = jest.fn();

  public isOpen(): Promise<boolean | null> {
    this.asked();

    return Promise.resolve(true);
  }

  public deliver(request: ContactRequest): Promise<Delivery> {
    this.given(request);

    return Promise.resolve({ kind: "refused", refusal: "invalid", problems: ["emailInvalid"] });
  }
}

// The key each message the site was asked to send carried.
const keyOf = (request: unknown) => (typeof request === "object" && request !== null && "key" in request ? request.key : undefined);

const renderForm = (kind: "message" | "feedback") => render(
  <MessageForm kind={kind} subject={kind === "message" ? "Hiring: CTO" : forms.feedback.subject} email={details.email} contactTime={details.contactTime}
    words={kind === "message" ? forms.message : forms.feedback} shared={forms.shared} />,
);

describe("the message and feedback form", () => {
  let restore: () => void;

  beforeEach(() => {
    // The form asks whether the site can send once it is on screen.
    restore = stubCanvases();
    client.contactIsOpen.mockResolvedValue("open");
    client.sendContact.mockReset();
  });

  afterEach(() => restore());

  it("labels every field and says which are needed; a message wants an email, feedback may stay anonymous", async () => {
    renderForm("message");
    await waitFor(() => expect(client.contactIsOpen).toHaveBeenCalled());

    expect(screen.getByLabelText(new RegExp(forms.message.name))).toHaveAttribute("aria-required", "false");
    expect(screen.getByLabelText(new RegExp(forms.message.email))).toHaveAttribute("aria-required", "true");
    expect(screen.getByLabelText(new RegExp(forms.message.message))).toHaveAttribute("aria-required", "true");
    expect(screen.getByRole("form", { name: forms.message.heading })).toBeInTheDocument();
  });

  it("says what is wrong, field by field, and puts focus on the first wrong one, sending nothing", async () => {
    renderForm("message");
    await waitFor(() => expect(client.contactIsOpen).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText(new RegExp(forms.message.message)), { target: { value: "hi" } });
    fireEvent.click(screen.getByRole("button", { name: forms.message.send }));

    const email = screen.getByLabelText(new RegExp(forms.message.email));

    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveFocus();
    expect(screen.getByText(forms.shared.problems.emailMissing)).toBeInTheDocument();
    expect(screen.getByText(/at least 10 characters/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(forms.shared.check);
    expect(client.sendContact).not.toHaveBeenCalled();
  });

  it("sends anonymous feedback, then says it is on its way and moves focus to that line", async () => {
    client.sendContact.mockResolvedValue({ kind: "sent" });
    renderForm("feedback");
    expect(screen.queryByLabelText(new RegExp(forms.message.name))).toBeNull();
    fireEvent.change(screen.getByLabelText(new RegExp(forms.feedback.message)), { target: { value: "More case studies, please." } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: forms.feedback.send }));
    });

    expect(client.sendContact).toHaveBeenCalledWith({
      kind: "feedback", message: "More case studies, please.", subject: forms.feedback.subject, key: expect.any(String),
    });
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(forms.feedback.sent));
    expect(screen.getByRole("status")).toHaveFocus();
  });

  it("when the day is full, says so and offers the visitor's own email app with what they wrote", async () => {
    client.sendContact.mockResolvedValue({ kind: "fallback", href: "mailto:x", refusal: "full" });
    renderForm("message");
    fireEvent.change(screen.getByLabelText(new RegExp(forms.message.email)), { target: { value: "ada@example.test" } });
    fireEvent.change(screen.getByLabelText(new RegExp(forms.message.message)), { target: { value: "Shall we talk about the role?" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: forms.message.send }));
    });

    expect(client.sendContact).toHaveBeenCalledWith({
      kind: "message", message: "Shall we talk about the role?", email: "ada@example.test", subject: "Hiring: CTO", key: expect.any(String),
    });
    expect(screen.getByRole("alert")).toHaveTextContent(forms.shared.full);
    expect(screen.getByRole("link", { name: forms.shared.ownApp }))
      .toHaveAttribute("href", `mailto:${details.email}?subject=Hiring%3A%20CTO&body=Shall%20we%20talk%20about%20the%20role%3F`);
  });

  it("when the site says it cannot send, the email app is the way from the start, asked again as the visitor comes back", async () => {
    client.contactIsOpen.mockResolvedValue("closed");
    renderForm("feedback");

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(forms.shared.closed));
    expect(screen.queryByRole("button", { name: forms.feedback.send })).toBeNull();
    expect(screen.getByRole("link", { name: forms.shared.ownApp })).toBeInTheDocument();

    client.contactIsOpen.mockResolvedValue("open");
    await act(async () => {
      fireEvent.focus(screen.getByLabelText(new RegExp(forms.feedback.message)));
    });
    expect(screen.getByRole("button", { name: forms.feedback.send })).toBeInTheDocument();
  });

  it("with no connection, says the site needs one and offers the visitor's own email app, the send button back once online", async () => {
    const online = jest.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);

    try {
      renderForm("message");

      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(forms.shared.offline));
      expect(screen.queryByRole("button", { name: forms.message.send })).toBeNull();
      expect(screen.getByRole("link", { name: forms.shared.ownApp })).toBeInTheDocument();

      fireEvent.submit(screen.getByRole("form", { name: forms.message.heading }));
      expect(client.sendContact).not.toHaveBeenCalled();

      online.mockReturnValue(true);
      act(() => {
        window.dispatchEvent(new Event("online"));
      });
      expect(screen.getByRole("button", { name: forms.message.send })).toBeInTheDocument();
      expect(screen.getByRole("status")).not.toHaveTextContent(forms.shared.offline);
    } finally {
      online.mockRestore();
    }
  });

  it("with no answer about whether the site can send, or code that cannot load, keeps the send button, the send's answer deciding", async () => {
    client.contactIsOpen.mockResolvedValue("unknown");
    const { unmount } = renderForm("feedback");

    await waitFor(() => expect(client.contactIsOpen).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: forms.feedback.send })).toBeInTheDocument();
    unmount();

    client.contactIsOpen.mockClear();
    client.contactIsOpen.mockRejectedValue(new Error("chunk failed"));
    renderForm("feedback");
    await waitFor(() => expect(client.contactIsOpen).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: forms.feedback.send })).toBeInTheDocument();
  });

  it("sends a message tried again under the same key, and a changed one (its text or its email) under a new key", async () => {
    client.sendContact.mockResolvedValue({ kind: "fallback", href: "mailto:x", refusal: "failed" });
    renderForm("feedback");
    await waitFor(() => expect(client.contactIsOpen).toHaveBeenCalled());

    const field = screen.getByLabelText(new RegExp(forms.feedback.message));
    const send = async () => act(async () => {
      fireEvent.click(screen.getByRole("button", { name: forms.feedback.send }));
    });

    fireEvent.change(field, { target: { value: "More case studies, please." } });
    await send();
    await send();
    fireEvent.change(field, { target: { value: "More case studies and blueprints, please." } });
    await send();
    fireEvent.change(screen.getByLabelText(new RegExp(forms.feedback.email)), { target: { value: "ada@example.test" } });
    await send();

    const keys = client.sendContact.mock.calls.map(([request]) => keyOf(request));

    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[0]);
    expect(keys[3]).not.toBe(keys[2]);
  });

  it("keeps the field for bots out of sight and out of reach, and passes on what a bot fills in, for the server to drop", async () => {
    client.sendContact.mockResolvedValue({ kind: "sent" });
    const { container } = renderForm("feedback");
    const trap = container.querySelector("input[name='contact-extra']");

    expect(trap).toHaveAttribute("tabindex", "-1");
    expect(trap?.closest("[aria-hidden='true']")).not.toBeNull();

    fireEvent.change(instanceOf(trap, HTMLInputElement), { target: { value: "https://spam.example" } });
    fireEvent.change(screen.getByLabelText(new RegExp(forms.feedback.message)), { target: { value: "Buy cheap things here now." } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: forms.feedback.send }));
    });
    expect(client.sendContact).toHaveBeenCalledWith(expect.objectContaining({ website: "https://spam.example" }));
  });

  it("when the code that sends cannot load, says it did not go through and offers the visitor's own email app, never stuck sending", async () => {
    client.sendContact.mockRejectedValue(new Error("chunk failed"));
    renderForm("feedback");
    await waitFor(() => expect(client.contactIsOpen).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText(new RegExp(forms.feedback.message)), { target: { value: "More case studies, please." } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: forms.feedback.send }));
    });

    expect(screen.getByRole("alert")).toHaveTextContent(forms.shared.failed);
    expect(screen.getByRole("button", { name: forms.feedback.send })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: forms.shared.ownApp })).toBeInTheDocument();
  });

  it("keeps a link to the visitor's own email app short enough for every mail app", async () => {
    renderForm("feedback");
    await waitFor(() => expect(client.contactIsOpen).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText(new RegExp(forms.feedback.message)), { target: { value: "a".repeat(3000) } });

    expect(screen.getByRole("link", { name: forms.shared.ownApp }).getAttribute("href")).toMatch(/body=a{1800}$/);
  });

  it("delivers through whichever delivery it is given, the email app staying the fallback", async () => {
    const channel = new RefusingChannel();
    const delivery = new ContactDelivery([channel], new MailtoChannel(details.email, forms.feedback.subject));

    render(
      <MessageForm kind="feedback" subject={forms.feedback.subject} email={details.email} contactTime={details.contactTime} words={forms.feedback}
        shared={forms.shared} loadDelivery={async () => delivery} />,
    );
    await waitFor(() => expect(channel.asked).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText(new RegExp(forms.feedback.message)), { target: { value: "More case studies, please." } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: forms.feedback.send }));
    });

    // Feedback goes under the form's own subject too, so the inbox reads it as the form words it.
    expect(channel.given).toHaveBeenCalledWith(expect.objectContaining({ kind: "feedback", message: "More case studies, please.", subject: forms.feedback.subject }));
    // What the server found wrong shows on its field, as the form's own checks would.
    expect(screen.getByText(forms.shared.problems.emailInvalid)).toBeInTheDocument();
    expect(client.sendContact).not.toHaveBeenCalled();
  });

  it("plays the zone it sits in: a scan by default, a warp out past the game world at the finale", async () => {
    const { container, unmount } = renderForm("feedback");

    await waitFor(() => expect(container.querySelector("form")).toHaveAttribute("data-effect", "scan"));
    unmount();

    const finale = document.createElement("section");

    finale.id = SECTION_IDS.finale;
    document.body.appendChild(finale);

    const beyond = render(
      <MessageForm kind="feedback" subject={forms.feedback.subject} email={details.email} contactTime={details.contactTime} words={forms.feedback}
        shared={forms.shared} />,
      { container: finale },
    );

    await waitFor(() => expect(beyond.container.querySelector("form")).toHaveAttribute("data-effect", "warp"));
    beyond.unmount();
    finale.remove();
  });

  it("marks the send button while the message is on its way, and the line saying it went, for their animations", async () => {
    let finish: (value: unknown) => void = () => undefined;

    client.sendContact.mockImplementation(() => new Promise((resolve) => {
      finish = resolve;
    }));
    renderForm("feedback");
    await waitFor(() => expect(client.contactIsOpen).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText(new RegExp(forms.feedback.message)), { target: { value: "More case studies, please." } });
    fireEvent.click(screen.getByRole("button", { name: forms.feedback.send }));

    await waitFor(() => expect(screen.getByRole("button", { name: forms.shared.sending })).toHaveAttribute("aria-disabled", "true"));
    expect(screen.getByRole("status")).not.toHaveAttribute("data-sent");
    await act(async () => {
      finish({ kind: "sent" });
    });
    expect(screen.getByRole("status")).toHaveAttribute("data-sent", "true");
  });
});

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { MessageForm } from "@/components/Contact/MessageForm";
import { portfolioData } from "@/data/resume";

import { stubCanvases } from "./fixtures/canvas";

jest.mock("@/services/contact/client", () => {
  const contactIsOpen = jest.fn();
  const sendContact = jest.fn();

  return { contactIsOpen, sendContact, createContactDelivery: () => ({ status: () => contactIsOpen(), deliver: (request: unknown) => sendContact(request) }) };
});

const client = jest.requireMock<{ contactIsOpen: jest.Mock; sendContact: jest.Mock }>("@/services/contact/client");
const { forms, details } = portfolioData;

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

    expect(client.sendContact).toHaveBeenCalledWith({ kind: "feedback", message: "More case studies, please.", key: expect.any(String) });
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

  it("sends a message tried again under the same key, and a changed one under a new key", async () => {
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

    const keys = client.sendContact.mock.calls.map(([request]) => (request as { key: string }).key);

    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[0]);
  });

  it("keeps the field for bots out of sight and out of reach, and passes on what a bot fills in, for the server to drop", async () => {
    client.sendContact.mockResolvedValue({ kind: "sent" });
    const { container } = renderForm("feedback");
    const trap = container.querySelector("input[name='contact-extra']");

    expect(trap).toHaveAttribute("tabindex", "-1");
    expect(trap?.closest("[aria-hidden='true']")).not.toBeNull();

    fireEvent.change(trap as Element, { target: { value: "https://spam.example" } });
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
    const delivery = { status: jest.fn(async () => "open"), deliver: jest.fn(async () => ({ kind: "invalid" as const, problems: ["emailInvalid" as const] })) };

    render(
      <MessageForm kind="feedback" subject={forms.feedback.subject} email={details.email} contactTime={details.contactTime} words={forms.feedback}
        shared={forms.shared} loadDelivery={async () => delivery as never} />,
    );
    await waitFor(() => expect(delivery.status).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText(new RegExp(forms.feedback.message)), { target: { value: "More case studies, please." } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: forms.feedback.send }));
    });

    expect(delivery.deliver).toHaveBeenCalledWith(expect.objectContaining({ kind: "feedback", message: "More case studies, please." }));
    // What the server found wrong shows on its field, as the form's own checks would.
    expect(screen.getByText(forms.shared.problems.emailInvalid)).toBeInTheDocument();
    expect(client.sendContact).not.toHaveBeenCalled();
  });
});

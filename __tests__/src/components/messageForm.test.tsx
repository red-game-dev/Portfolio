import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { MessageForm } from "@/components/Contact/MessageForm";
import { portfolioData } from "@/data/resume";

import { stubCanvases } from "./fixtures/canvas";

jest.mock("@/services/contact/client", () => ({ contactIsOpen: jest.fn(), sendContact: jest.fn() }));

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
    client.contactIsOpen.mockResolvedValue(true);
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
    fireEvent.change(screen.getByLabelText(new RegExp(forms.message.message)), { target: { value: "hi" } });
    fireEvent.click(screen.getByRole("button", { name: forms.message.send }));

    const email = screen.getByLabelText(new RegExp(forms.message.email));

    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveFocus();
    expect(screen.getByText(forms.shared.problems.emailMissing)).toBeInTheDocument();
    expect(screen.getByText(/at least 10 characters/)).toBeInTheDocument();
    expect(client.sendContact).not.toHaveBeenCalled();
  });

  it("sends anonymous feedback, then says it is on its way and moves focus to that line", async () => {
    client.sendContact.mockResolvedValue({ ok: true });
    renderForm("feedback");
    expect(screen.queryByLabelText(new RegExp(forms.message.name))).toBeNull();
    fireEvent.change(screen.getByLabelText(new RegExp(forms.feedback.message)), { target: { value: "More case studies, please." } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: forms.feedback.send }));
    });

    expect(client.sendContact).toHaveBeenCalledWith({ kind: "feedback", message: "More case studies, please." });
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(forms.feedback.sent));
    expect(screen.getByRole("status")).toHaveFocus();
  });

  it("when the day is full, says so and offers the visitor's own email app with what they wrote", async () => {
    client.sendContact.mockResolvedValue({ error: "full" });
    renderForm("message");
    fireEvent.change(screen.getByLabelText(new RegExp(forms.message.email)), { target: { value: "ada@example.test" } });
    fireEvent.change(screen.getByLabelText(new RegExp(forms.message.message)), { target: { value: "Shall we talk about the role?" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: forms.message.send }));
    });

    expect(client.sendContact).toHaveBeenCalledWith({ kind: "message", message: "Shall we talk about the role?", email: "ada@example.test", subject: "Hiring: CTO" });
    expect(screen.getByRole("alert")).toHaveTextContent(forms.shared.full);
    expect(screen.getByRole("link", { name: forms.shared.ownApp }))
      .toHaveAttribute("href", `mailto:${details.email}?subject=Hiring%3A%20CTO&body=Shall%20we%20talk%20about%20the%20role%3F`);
  });

  it("when the site cannot send at all, the visitor's own email app is the way, from the start", async () => {
    client.contactIsOpen.mockResolvedValue(false);
    renderForm("feedback");

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(forms.shared.closed));
    expect(screen.queryByRole("button", { name: forms.feedback.send })).toBeNull();
    expect(screen.getByRole("link", { name: forms.shared.ownApp })).toBeInTheDocument();
  });

  it("keeps the field for bots out of sight and out of reach, and passes on what a bot fills in, for the server to drop", async () => {
    client.sendContact.mockResolvedValue({ ok: true });
    const { container } = renderForm("feedback");
    const trap = container.querySelector("input[name='website']");

    expect(trap).toHaveAttribute("tabindex", "-1");
    expect(trap?.closest("[aria-hidden='true']")).not.toBeNull();

    fireEvent.change(trap as Element, { target: { value: "https://spam.example" } });
    fireEvent.change(screen.getByLabelText(new RegExp(forms.feedback.message)), { target: { value: "Buy cheap things here now." } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: forms.feedback.send }));
    });
    expect(client.sendContact).toHaveBeenCalledWith(expect.objectContaining({ website: "https://spam.example" }));
  });
});

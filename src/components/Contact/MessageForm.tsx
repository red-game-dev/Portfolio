import { ChangeEvent, FC, FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";

import { ActionButton, ActionLink } from "@/components/Controls";
import useInView from "@/hooks/useInView";
import {
  CONTACT_LIMITS, ContactDelivery, ContactKind, ContactProblem, contactProblems, ContactRefusal, ContactRequest, DeliveryStatus,
} from "@/packages/messaging/contact";
import { fill } from "@/packages/text/format";
import { contactFallback } from "@/services/contact/fallback";
import { FeedbackFormContent, FormsSharedContent, MessageFormContent } from "@/types/forms";

import { Field, Form, Heading, Input, Intro, Label, Marker, Note, Problem, Row, Status, TextArea, Trap } from "./MessageForm.styles";

interface MessageFormProps {
  kind: ContactKind;
  // The subject a message goes under, sent here or from the visitor's own email app.
  subject: string;
  // The address the visitor's own email app writes to.
  email: string;
  // When replies usually come, for the line once a message is on its way.
  contactTime: string;
  words: MessageFormContent | FeedbackFormContent;
  shared: FormsSharedContent;
  // How a message is delivered, loaded on first use: the site's own server, then the visitor's email app, unless given
  // another.
  loadDelivery?: (address: string, subject: string) => Promise<ContactDelivery>;
}

// The site's delivery, its code loaded only when the form first needs it.
const loadSiteDelivery = (address: string, subject: string) =>
  import("@/services/contact/client").then((module) => module.createContactDelivery(address, subject));

type FieldName = "name" | "email" | "message";

type SendState = "idle" | "sending" | "sent" | ContactRefusal;

// Which field each problem belongs to, in the order the fields stand, so the first wrong one takes focus.
const FIELD_OF: Record<ContactProblem, FieldName | null> = {
  nameLong: "name",
  emailMissing: "email",
  emailInvalid: "email",
  messageShort: "message",
  messageLong: "message",
  subjectLong: null,
};

const FIELD_ORDER: readonly FieldName[] = ["name", "email", "message"];

// A new key for a message, which names it once however often its send is tried.
const newKey = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36)
    .slice(2)}`;
};

// A message to me or feedback, delivered through the site's channels (its own server, then the fallback, the visitor's
// own email app with what they typed already in it): the email app is the way when the site says it cannot send now
// (no way to send set up, or the day's sends used up), when a send is refused or fails, and always beside the send
// button. Feedback may stay anonymous. Every field has its label and says whether it is needed, a wrong one says why
// and takes focus, what becomes of the message is said as it happens, and a field no person sees catches bots.
export const MessageForm: FC<MessageFormProps> = ({ kind, subject, email, contactTime, words, shared, loadDelivery = loadSiteDelivery }: MessageFormProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const id = useId();
  const [values, setValues] = useState({ name: "", email: "", message: "", website: "" });
  const [problems, setProblems] = useState<ContactProblem[]>([]);
  const [state, setState] = useState<SendState>("idle");
  // Whether the site can send: not asked yet (null), open, closed, or no answer, when the send button stays.
  const [isOpen, setIsOpen] = useState<DeliveryStatus | null>(null);
  const isNear = useInView(formRef, { once: true, threshold: 0 });
  const isMessage = kind === "message";
  const fieldId = (name: FieldName | "trap") => `${id}-${name}`;
  const fallback = useMemo(() => contactFallback(email, subject), [email, subject]);
  const delivery = useRef<Promise<ContactDelivery> | null>(null);
  // The key the message being written goes under, kept while its text stays the same, so a send tried again is the
  // same message to the server.
  const sendKey = useRef<{ message: string; key: string } | null>(null);
  // The delivery, loaded once for this form; a load that failed is tried afresh next time.
  const deliveryOf = () => {
    delivery.current ??= loadDelivery(email, subject).catch((error: unknown) => {
      delivery.current = null;

      throw error;
    });

    return delivery.current;
  };

  // Whether the site can send. Code that cannot be loaded, or no answer, is no way to tell, and the send button stays.
  const askStatus = () => deliveryOf()
    .then((loaded) => loaded.status())
    .catch((): DeliveryStatus => "unknown");

  // Asked once the form is near, with the code that asks loaded only then.
  useEffect(() => {
    if (!isNear || isOpen !== null) {
      return undefined;
    }

    let isCurrent = true;

    void askStatus().then((status) => {
      if (isCurrent) {
        setIsOpen(status);
      }
    });

    return () => {
      isCurrent = false;
    };
    // Asked once, when the form first comes near.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNear, isOpen]);

  // Closed, asked again as the visitor comes back to the form (the answer is kept a moment, so this costs little).
  const onFocus = () => {
    if (isOpen === "closed") {
      void askStatus().then(setIsOpen);
    }
  };

  // Once the message is on its way the fields go, so the line saying so takes focus.
  useEffect(() => {
    if (state === "sent") {
      statusRef.current?.focus();
    }
  }, [state]);

  const mailto = fallback.linkFor({ message: values.message });
  const onChange = (name: keyof typeof values) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
  };

  const keyFor = (message: string) => {
    if (sendKey.current?.message !== message) {
      sendKey.current = { message, key: newKey() };
    }

    return sendKey.current.key;
  };

  const requestOf = (): ContactRequest => ({
    kind,
    message: values.message,
    key: keyFor(values.message),
    ...(values.email.trim() ? { email: values.email.trim() } : {}),
    ...(isMessage && values.name.trim() ? { name: values.name.trim() } : {}),
    ...(isMessage ? { subject } : {}),
    ...(values.website ? { website: values.website } : {}),
  });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (state === "sending") {
      return;
    }

    const request = requestOf();
    const found = contactProblems(request);

    setProblems(found);
    setState("idle");

    if (found.length > 0) {
      const first = FIELD_ORDER.find((name) => found.some((problem) => FIELD_OF[problem] === name));

      if (first) {
        document.getElementById(fieldId(first))?.focus();
      }

      return;
    }

    setState("sending");

    try {
      const result = await (await deliveryOf()).deliver(request);

      if (result.kind === "sent") {
        setValues({ name: "", email: "", message: "", website: "" });
        sendKey.current = null;
        setState("sent");
      } else if (result.kind === "invalid") {
        setProblems(result.problems);
        setState("idle");
      } else {
        setState(result.refusal ?? "unavailable");
      }
    } catch {
      // The code that sends could not be loaded: the visitor's own email app is the way.
      setState("failed");
    }
  };

  const problemsOf = (name: FieldName) => problems.filter((problem) => FIELD_OF[problem] === name);
  const problemText = (problem: ContactProblem) =>
    fill(shared.problems[problem], { least: CONTACT_LIMITS.messageLeast, most: problem === "nameLong" ? CONTACT_LIMITS.nameMost : CONTACT_LIMITS.messageMost });
  const describedBy = (name: FieldName) => (problemsOf(name).length > 0 ? `${fieldId(name)}-problem` : undefined);
  const refusal = ({ full: shared.full, unavailable: shared.closed, limited: shared.limited, invalid: shared.failed, failed: shared.failed } as const)[
    state as ContactRefusal] ?? null;
  // Said as it changes: sent, sending, what to fix (the fields say what, the line says so), or that the site cannot send.
  const status = state === "sent"
    ? fill(words.sent, { time: contactTime.toLowerCase() })
    : state === "sending" ? shared.sending : problems.length > 0 ? shared.check : isOpen === "closed" ? shared.closed : "";

  const field = (name: FieldName, label: string, isRequired: boolean, isLong = false) => (
    <Field>
      <Label htmlFor={fieldId(name)}>
        {label}
        <Marker>{`(${isRequired ? shared.required : shared.optional})`}</Marker>
      </Label>
      {isLong ? (
        <TextArea id={fieldId(name)} name={name} value={values[name]} onChange={onChange(name)} aria-required={isRequired}
          aria-invalid={problemsOf(name).length > 0} aria-describedby={describedBy(name)} />
      ) : (
        <Input id={fieldId(name)} name={name} type={name === "email" ? "email" : "text"} autoComplete={name === "email" ? "email" : "name"}
          value={values[name]} onChange={onChange(name)} aria-required={isRequired} aria-invalid={problemsOf(name).length > 0} aria-describedby={describedBy(name)} />
      )}
      {problemsOf(name).length > 0 && (
        <Problem id={`${fieldId(name)}-problem`}>
          {problemsOf(name).map(problemText)
            .join(" ")}
        </Problem>
      )}
    </Field>
  );

  return (
    <Form ref={formRef} onSubmit={(event) => void onSubmit(event)} onFocus={onFocus} noValidate aria-labelledby={`${id}-heading`}>
      <Heading id={`${id}-heading`}>{words.heading}</Heading>
      <Intro>{words.intro}</Intro>
      {state !== "sent" && (
        <>
          {isMessage && "name" in words && field("name", words.name, false)}
          {field("email", words.email, isMessage)}
          {field("message", words.message, true, true)}
          <Trap aria-hidden="true">
            <label htmlFor={fieldId("trap")}>
              {shared.trap}
              <input id={fieldId("trap")} name="contact-extra" type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={onChange("website")} />
            </label>
          </Trap>
          <Row>
            {isOpen !== "closed" && (
              <ActionButton type="submit" isPrimary aria-disabled={state === "sending"}>
                {state === "sending" ? shared.sending : words.send}
              </ActionButton>
            )}
            <ActionLink href={mailto} isPrimary={isOpen === "closed"}>{shared.ownApp}</ActionLink>
          </Row>
          {refusal && <Problem role="alert">{refusal}</Problem>}
          <Note>{shared.privacy}</Note>
        </>
      )}
      <Status ref={statusRef} role="status" tabIndex={-1}>{status}</Status>
    </Form>
  );
};

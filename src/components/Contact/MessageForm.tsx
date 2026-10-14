import { ChangeEvent, FC, FormEvent, useEffect, useId, useRef, useState } from "react";

import { ActionButton, ActionLink } from "@/components/Controls";
import useInView from "@/hooks/useInView";
import { CONTACT_LIMITS, ContactKind, ContactProblem, contactProblems, ContactRefusal, ContactRequest } from "@/packages/contact";
import { fill } from "@/packages/text/format";
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
}

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

// A message to me or feedback, sent by the site, or written in the visitor's own email app with what they typed
// already in it: the way when the site cannot send now (no way to send set up, or the day's sends used up), when a
// send is refused or fails, and always beside the send button. Feedback may stay anonymous. Every field has its label
// and says whether it is needed, a wrong one says why and takes focus, what becomes of the message is said as it
// happens, and a field no person sees catches bots.
export const MessageForm: FC<MessageFormProps> = ({ kind, subject, email, contactTime, words, shared }: MessageFormProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const id = useId();
  const [values, setValues] = useState({ name: "", email: "", message: "", website: "" });
  const [problems, setProblems] = useState<ContactProblem[]>([]);
  const [state, setState] = useState<SendState>("idle");
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const isNear = useInView(formRef, { once: true, threshold: 0 });
  const isMessage = kind === "message";
  const fieldId = (name: FieldName | "trap") => `${id}-${name}`;

  // Whether the site can send is asked once the form is near, with the code that asks loaded only then.
  useEffect(() => {
    if (!isNear || isOpen !== null) {
      return undefined;
    }

    let isCurrent = true;

    void import("@/services/contact/client").then(({ contactIsOpen }) => contactIsOpen()).then((open) => {
      if (isCurrent) {
        setIsOpen(open);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [isNear, isOpen]);

  // Once the message is on its way the fields go, so the line saying so takes focus.
  useEffect(() => {
    if (state === "sent") {
      statusRef.current?.focus();
    }
  }, [state]);

  const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(values.message.trim())}`;
  const onChange = (name: keyof typeof values) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
  };

  const requestOf = (): ContactRequest => ({
    kind,
    message: values.message,
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

    if (found.length > 0) {
      const first = FIELD_ORDER.find((name) => found.some((problem) => FIELD_OF[problem] === name));

      if (first) {
        document.getElementById(fieldId(first))?.focus();
      }

      return;
    }

    setState("sending");

    const { sendContact } = await import("@/services/contact/client");
    const result = await sendContact(request);

    if ("ok" in result) {
      setValues({ name: "", email: "", message: "", website: "" });
      setState("sent");
    } else {
      setState(result.error);
    }
  };

  const problemsOf = (name: FieldName) => problems.filter((problem) => FIELD_OF[problem] === name);
  const problemText = (problem: ContactProblem) =>
    fill(shared.problems[problem], { least: CONTACT_LIMITS.messageLeast, most: problem === "nameLong" ? CONTACT_LIMITS.nameMost : CONTACT_LIMITS.messageMost });
  const describedBy = (name: FieldName) => (problemsOf(name).length > 0 ? `${fieldId(name)}-problem` : undefined);
  const refusal = ({ full: shared.full, limited: shared.limited, invalid: shared.failed, unavailable: shared.failed, failed: shared.failed } as const)[
    state as ContactRefusal] ?? null;
  const status = state === "sent"
    ? fill(words.sent, { time: contactTime.toLowerCase() })
    : state === "sending" ? shared.sending : isOpen === false ? shared.closed : "";

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
    <Form ref={formRef} onSubmit={(event) => void onSubmit(event)} noValidate aria-labelledby={`${id}-heading`}>
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
              <input id={fieldId("trap")} name="website" type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={onChange("website")} />
            </label>
          </Trap>
          <Row>
            {isOpen !== false && (
              <ActionButton type="submit" isPrimary aria-disabled={state === "sending"}>
                {state === "sending" ? shared.sending : words.send}
              </ActionButton>
            )}
            <ActionLink href={mailto} isPrimary={isOpen === false}>{shared.ownApp}</ActionLink>
          </Row>
          {refusal && <Problem role="alert">{refusal}</Problem>}
          <Note>{shared.privacy}</Note>
        </>
      )}
      <Status ref={statusRef} role="status" tabIndex={-1}>{status}</Status>
    </Form>
  );
};

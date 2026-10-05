import { FC, FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { Text } from "@/components/Text";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { TerminalEffect, TerminalLineKind, TerminalSession } from "@/packages/interaction/terminal";
import { SectionIntros } from "@/types/sections-intros";
import { TerminalContent } from "@/types/terminal";

interface TerminalProps {
  intro: SectionIntros;
  content: TerminalContent;
  createSession: () => TerminalSession;
}

const SECTION_ID = "section-terminal";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const Section = tw.div`relative px-[30px] py-[50px] lg:px-[20%] lg:py-[70px] z-[6]`;

const Window = styled.div(() => [
  tw`relative mt-[25px] lg:mt-[35px] bg-[#0a0f0c] border-[1px] border-solid border-[#1E1E1E]`,
  css`
    box-shadow: 0 0 30px rgba(var(--accent-rgb), 0.06);
  `,
]);

const TitleBar = tw.div`flex flex-row items-center justify-between gap-[10px] px-[16px] py-[10px] text-xs text-[#888]
border-0 border-b-[1px] border-solid border-[#1E1E1E]`;

const Hint = tw.span`hidden md:inline`;

const Screen = styled.div(() => [
  tw`relative overflow-y-auto h-[340px] px-[16px] py-[14px] text-[13px] leading-[1.6]`,
  css`
    font-family: ${MONO};
    scrollbar-width: thin;
  `,
]);

const LINE_COLOURS: Record<TerminalLineKind, string> = {
  input: "var(--accent)",
  heading: "#ffffff",
  output: "#bbbbbb",
  error: "#ff7a7a",
  system: "#7c8a83",
};

const Line = styled.div(({ kind }: { kind: TerminalLineKind }) => [
  tw`whitespace-pre-wrap break-words`,
  css`
    color: ${LINE_COLOURS[kind]};
    font-weight: ${kind === "heading" ? 600 : 400};
    margin-top: ${kind === "heading" || kind === "input" ? "6px" : "0"};
  `,
]);

const Form = tw.form`flex flex-row items-center gap-[8px] px-[16px] py-[12px] border-0 border-t-[1px] border-solid border-[#1E1E1E]`;

const Prompt = styled.label(() => [
  tw`flex-shrink-0 text-[13px] text-[var(--accent)]`,
  css`
    font-family: ${MONO};
  `,
]);

const Input = styled.input(() => [
  tw`flex-1 min-w-0 p-0 text-[13px] text-white bg-transparent border-0 outline-none`,
  css`
    font-family: ${MONO};
    caret-color: var(--accent);
  `,
]);

const Suggestions = tw.div`flex flex-row flex-wrap gap-[8px] mt-[14px]`;

const Suggestion = styled.button(() => [
  tw`cursor-pointer text-xs leading-none py-[8px] px-[12px] rounded-full text-[var(--accent)] bg-[#1d1d1d] border-[1px] border-solid border-[var(--accent-muted)]`,
  css`
    font-family: ${MONO};
    transition: background-color 0.2s ease, color 0.2s ease;

    &:hover,
    &:focus-visible {
      color: #101010;
      background-color: var(--accent);
    }
  `,
]);

const isTyping = (target: EventTarget | null) => target instanceof HTMLElement
  && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

// A real command line over the portfolio. The session is plain state from the terminal package; this
// component only renders it and carries out the effects a command asks for.
export const Terminal: FC<TerminalProps> = ({ intro, content, createSession }: TerminalProps) => {
  const [session] = useState(createSession);
  const [, setVersion] = useState(0);
  const [value, setValue] = useState("");
  const sectionRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const apply = (effect: TerminalEffect | undefined) => {
    if (effect?.type === "navigate") {
      if (effect.target.startsWith("for-")) {
        window.location.hash = effect.target;
      } else {
        document.getElementById(effect.target)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }
    }

    if (effect?.type === "open") {
      window.open(effect.url, "_blank", "noopener");
    }
  };

  const run = (command: string) => {
    apply(session.execute(command));
    setVersion((version) => version + 1);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    run(value);
    setValue("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      setValue(session.recall(event.key === "ArrowUp" ? "previous" : "next"));
    }

    if (event.key === "Tab" && value.trim()) {
      event.preventDefault();
      setValue(session.complete(value));
    }
  };

  useEffect(() => {
    const screen = screenRef.current;

    if (screen) {
      screen.scrollTop = screen.scrollHeight;
    }
  });

  // Backtick from anywhere on the page brings you to the prompt, like a game console.
  useEffect(() => {
    const onWindowKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "`" || isTyping(event.target)) {
        return;
      }

      event.preventDefault();
      sectionRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
      inputRef.current?.focus({ preventScroll: true });
    };

    window.addEventListener("keydown", onWindowKey);

    return () => window.removeEventListener("keydown", onWindowKey);
  }, []);

  return (
    <Section id={SECTION_ID} ref={sectionRef}>
      <Text title={intro.title} paragraphs={intro.description} isSection={false} />
      <Window>
        <TitleBar>
          <span>{content.prompt.replace(/:.*$/, "")}</span>
          <Hint>{content.shortcutHint}</Hint>
        </TitleBar>
        <Screen ref={screenRef} role="log" aria-live="polite" aria-label={intro.title}>
          {session.output.map((line, index) => (
            <Line key={index} kind={line.kind}>{line.text}</Line>
          ))}
        </Screen>
        <Form onSubmit={onSubmit}>
          <Prompt htmlFor="terminal-input">{content.prompt}</Prompt>
          <Input
            id="terminal-input"
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={onKeyDown}
            aria-label={content.inputLabel}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </Form>
      </Window>
      <Suggestions>
        {content.suggestions.map((suggestion) => (
          <Suggestion key={suggestion} type="button" onClick={() => run(suggestion)}>
            {suggestion}
          </Suggestion>
        ))}
      </Suggestions>
    </Section>
  );
};

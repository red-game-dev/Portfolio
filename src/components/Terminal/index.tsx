import { FC, FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

import { keyframes } from "styled-components";
import tw, { css, styled } from "twin.macro";

import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Section } from "@/components/Section";
import { useWindowKeys } from "@/components/Terminal/hooks/useWindowKeys";
import { LazyTerminalDialog } from "@/components/Terminal/LazyTerminalDialog";
import { SectionText } from "@/components/Text/SectionText";
import { ASK_HISTORY_TURNS, type AskSourceKey } from "@/config/ask";
import { SECTION_IDS } from "@/config/sections";
import { prefersReducedMotion, scrollBehavior } from "@/packages/accessibility/motion";
import type { AskDepth, AskErrorCode, AskTurn } from "@/packages/ai/ask";
import { isTypingTarget } from "@/packages/interaction/focus";
import { KeyMap } from "@/packages/interaction/keys";
import { scrollToElement, settleAtTop } from "@/packages/interaction/scroll-frame";
import {
  error,
  output,
  system,
  TerminalDialog as TerminalDialogContent,
  TerminalEffect,
  TerminalLine,
  TerminalLineKind,
  TerminalSession
} from "@/packages/interaction/terminal";
import { fill } from "@/packages/text/format";
import { caretBlink } from "@/styles/keyframes";
import { accentFillOnHover, media, noAnimationWhenReduced } from "@/styles/mixins";
import { SectionIntros } from "@/types/sections-intros";
import { TerminalContent } from "@/types/terminal";

interface TerminalProps {
  intro: SectionIntros;
  content: TerminalContent;
  createSession: () => TerminalSession;
}

// New output arrives a line at a time, like a model streaming its answer.
const STREAM_MS = 90;
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

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

// A ring that grows and fades out of the chip: scaled and faded only, so the compositor runs it.
const glow = keyframes`
  from { transform: scale(1); opacity: 0.6; }
  to { transform: scale(1.35, 1.8); opacity: 0; }
`;

const Suggestion = styled.button(({ isFeatured }: { isFeatured: boolean }) => [
  tw`inline-flex flex-row items-center gap-[6px] cursor-pointer text-xs leading-none py-[8px] px-[12px] rounded-full text-[var(--accent)] bg-[#1d1d1d]
     border-[1px] border-solid border-[var(--accent-muted)]`,
  css`
    font-family: ${MONO};
    ${accentFillOnHover()}
  `,
  // The place to start pulses gently and carries a star, until it has been used once.
  isFeatured && css`
    color: #101010;
    background-color: var(--accent);
    border-color: var(--accent);
    position: relative;

    &::after {
      content: "";
      position: absolute;
      inset: -1px;
      border-radius: inherit;
      border: 2px solid var(--accent);
      pointer-events: none;
      animation: ${glow} 1.8s ease-out infinite;
    }

    ${media.reducedMotion} {
      &::after {
        animation: none;
        opacity: 0;
      }
    }
  `,
]);

const FeaturedLabel = tw.span`font-sans font-semibold`;

// The cursor at the end of an answer still being written.
const Caret = styled.span(() => [
  tw`inline-block w-[7px] h-[1em] ml-[2px] align-text-bottom bg-[var(--accent)]`,
  css`
    animation: ${caretBlink} 1s steps(1) infinite;

    ${noAnimationWhenReduced}
  `,
]);

const FollowUps = tw.div`flex flex-row flex-wrap items-center gap-[8px] mt-[14px]`;

const SourcesLabel = tw.span`text-xs text-[#888]`;

// What is being answered right now, while it streams in.
interface Asking {
  depth: AskDepth;
  text: string;
}

// What the reader can do after an answer: ask for more, or go to the sections it came from.
interface FollowUp {
  sources: AskSourceKey[];
  canDeepen: boolean;
}

const scrollToSection = (target: string) => {
  const element = document.getElementById(target);

  if (!element) {
    return;
  }

  // An audience anchor goes through the hash, so the sections filtering on it follow.
  if (target.startsWith("for-")) {
    window.location.hash = target;
    settleAtTop(element);
  } else {
    scrollToElement(element, scrollBehavior());
  }
};

// Backtick like a game console, or slash like most search boxes, from anywhere but a field being typed in. The
// physical key counts too, since on many European layouts the backtick key types something else or waits for a
// second key.
const SHORTCUT = new KeyMap({ "`": "prompt", "/": "prompt" }, {
  codes: { Backquote: "prompt" },
  ignore: ["ctrl", "meta"],
  skip: (event) => isTypingTarget(event.target),
});

// Up and down walk through the commands typed before; Tab completes the one being typed.
const PROMPT_KEYS = new KeyMap<"previous" | "next" | "complete">({ ArrowUp: "previous", ArrowDown: "next", Tab: "complete" });

// A real command line over the portfolio. The session is plain state from the terminal package; this
// component only renders it and carries out the effects a command asks for.
export const Terminal: FC<TerminalProps> = ({ intro, content, createSession }: TerminalProps) => {
  const [session] = useState(createSession);
  const [, setVersion] = useState(0);
  const [value, setValue] = useState("");
  const sectionRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [visibleCount, setVisibleCount] = useState(() => session.output.length);
  // A dialog waits until the lines before it have finished streaming.
  const [pendingDialog, setPendingDialog] = useState<TerminalDialogContent | null>(null);
  const [dialog, setDialog] = useState<TerminalDialogContent | null>(null);
  const [hasRunFeatured, setHasRunFeatured] = useState(false);
  const [asking, setAsking] = useState<Asking | null>(null);
  const [followUp, setFollowUp] = useState<FollowUp | null>(null);
  const askHistory = useRef<AskTurn[]>([]);
  const askController = useRef<AbortController | null>(null);
  const hasShownNotice = useRef(false);
  const total = session.output.length;

  const isSource = (key: string): key is AskSourceKey => key in content.ask.sources;

  // Lines that arrive after their command are shown at once: they already streamed in as the answer.
  const printNow = (lines: TerminalLine[]) => {
    session.print(lines);
    setVisibleCount(session.output.length);
    setVersion((version) => version + 1);
  };

  const ask = async (question: string, depth: AskDepth) => {
    askController.current?.abort();

    const controller = new AbortController();

    askController.current = controller;
    setFollowUp(null);

    if (!hasShownNotice.current) {
      hasShownNotice.current = true;
      session.print([system(content.ask.notice)]);
    }

    setAsking({ depth, text: "" });

    // The client is fetched on the first question, so a visit that never asks never downloads it.
    const { askRed } = await import("@/services/ask/client");
    let text = "";
    let model = "";
    let sources: AskSourceKey[] = [];
    let failure: AskErrorCode | null = null;

    for await (const event of askRed({ question, depth, history: askHistory.current }, controller.signal)) {
      if (event.type === "model") {
        model = event.label;
      } else if (event.type === "text") {
        text += event.text;
        setAsking({ depth, text });
      } else if (event.type === "sources") {
        sources = event.keys.filter(isSource);
      } else if (event.type === "error") {
        failure = event.code;
      }
    }

    // A newer question took over; its answer prints instead.
    if (askController.current !== controller) {
      return;
    }

    const answer = text.trim();

    askController.current = null;
    setAsking(null);
    printNow([
      ...(answer ? [output(answer)] : []),
      ...(answer && model ? [system(fill(content.ask.answeredBy, { model }))] : []),
      ...(failure ? [error(content.ask.errors[failure])] : []),
    ]);

    if (answer && !failure) {
      askHistory.current = [...askHistory.current, { question, answer }].slice(-ASK_HISTORY_TURNS);
      setFollowUp({ sources, canDeepen: depth === "quick" && !controller.signal.aborted });
    }
  };

  const stopAsking = () => askController.current?.abort();

  useEffect(() => () => askController.current?.abort(), []);

  const apply = (effect: TerminalEffect | undefined) => {
    if (effect?.type === "navigate") {
      scrollToSection(effect.target);
    }

    if (effect?.type === "open") {
      window.open(effect.url, "_blank", "noopener");
    }

    if (effect?.type === "dialog") {
      setPendingDialog(effect.dialog);
    }

    if (effect?.type === "ask") {
      void ask(effect.question, effect.depth);
    }
  };

  useEffect(() => {
    if (visibleCount >= total) {
      if (visibleCount > total) {
        setVisibleCount(total);
      } else if (pendingDialog) {
        setDialog(pendingDialog);
        setPendingDialog(null);
      }

      return;
    }

    if (prefersReducedMotion()) {
      setVisibleCount(total);

      return;
    }

    const delay = session.output[visibleCount].kind === "input" ? 0 : STREAM_MS;
    const timeout = window.setTimeout(() => setVisibleCount((count) => count + 1), delay);

    return () => window.clearTimeout(timeout);
  }, [pendingDialog, session, total, visibleCount]);

  const run = (command: string) => {
    if (command.trim().toLowerCase() === content.featured) {
      setHasRunFeatured(true);
    }

    apply(session.execute(command));
    setVersion((version) => version + 1);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    run(value);
    setValue("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => PROMPT_KEYS.offer(event, (intent) => {
    if (intent !== "complete") {
      setValue(session.recall(intent));

      return true;
    }

    // With nothing typed, Tab moves focus on as usual.
    if (!value.trim()) {
      return false;
    }

    setValue(session.complete(value));

    return true;
  });

  useEffect(() => {
    const screen = screenRef.current;

    if (screen) {
      screen.scrollTop = screen.scrollHeight;
    }
  });

  // Backtick from anywhere on the page brings you to the prompt, like a game console.
  useWindowKeys(SHORTCUT, () => {
    sectionRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
    inputRef.current?.focus({ preventScroll: true });
  });

  return (
    <Section id={SECTION_IDS.terminal} ref={sectionRef}>
      <SectionText intro={intro} />
      <Window>
        <TitleBar>
          <span>{content.prompt.replace(/:.*$/, "")}</span>
          <Hint>{content.shortcutHint}</Hint>
        </TitleBar>
        <Screen ref={screenRef} role="log" aria-live="polite" aria-label={intro.title}>
          {session.output.slice(0, visibleCount).map((line, index) => (
            <Line key={index} kind={line.kind}>{line.text}</Line>
          ))}
          {asking && (
            <Line kind="output" aria-hidden="true">
              {asking.text}
              <Caret />
            </Line>
          )}
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
      {(asking || followUp) && (
        <FollowUps aria-label={content.ask.summary}>
          {asking && <Suggestion type="button" isFeatured={false} onClick={stopAsking}>{content.ask.stopLabel}</Suggestion>}
          {followUp?.canDeepen && <Suggestion type="button" isFeatured onClick={() => run("deeper")}>{content.ask.deeperLabel}</Suggestion>}
          {followUp && followUp.sources.length > 0 && <SourcesLabel>{content.ask.sourcesLabel}</SourcesLabel>}
          {followUp?.sources.map((key) => (
            <Suggestion key={key} type="button" isFeatured={false} onClick={() => scrollToSection(SECTION_IDS[key])}>
              {content.ask.sources[key]}
            </Suggestion>
          ))}
        </FollowUps>
      )}
      <Suggestions>
        {content.suggestions.map((suggestion) => {
          const isFeatured = suggestion === content.featured && !hasRunFeatured;

          return (
            <Suggestion key={suggestion} type="button" isFeatured={isFeatured} onClick={() => run(suggestion)}>
              {suggestion === content.featured && <FontAwesomeIcon icon={faStar} aria-hidden="true" />}
              {suggestion}
              {isFeatured && <FeaturedLabel>{content.featuredLabel}</FeaturedLabel>}
            </Suggestion>
          );
        })}
      </Suggestions>
      {dialog && (
        <LazyTerminalDialog
          dialog={dialog}
          closeLabel={content.red.labels.close}
          onClose={() => {
            setDialog(null);
            inputRef.current?.focus({ preventScroll: true });
          }}
          onNavigate={scrollToSection}
        />
      )}
    </Section>
  );
};

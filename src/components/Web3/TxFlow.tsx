import { FC, useCallback, useEffect, useRef, useState } from "react";

import tw, { css, styled } from "twin.macro";

import { blockHash } from "@/components/Web3/utils/blockHash";
import { prefersReducedMotion } from "@/packages/accessibility/motion";
import { FlowScenario, TxFlowContent } from "@/types/domains";

type StepState = "pending" | "active" | "passed" | "blocked";

type RunStatus = "idle" | "running" | "done" | "blocked";

interface RunState {
  scenario: FlowScenario | null;
  // How many steps have been reached so far.
  reached: number;
  status: RunStatus;
  hash: string;
}

const STEP_MS = 650;
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const IDLE: RunState = { scenario: null, reached: 0, status: "idle", hash: "" };

const Wrapper = tw.div`mb-[22px] p-[18px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`;

const Title = tw.h3`m-0 text-base font-semibold text-white`;

const Text = tw.p`m-0 mt-[6px] text-sm text-[#bbb] max-w-[70ch]`;

const Note = tw.p`m-0 mt-[4px] text-xs text-[#888]`;

const Controls = tw.div`flex flex-row flex-wrap gap-[10px] mt-[14px]`;

const Button = styled.button(({ variant }: { variant: "primary" | "danger" | "plain" }) => [
  tw`inline-flex items-center h-[36px] px-[14px] cursor-pointer text-sm font-semibold rounded-[2px] border-[1px] border-solid disabled:opacity-40
     disabled:cursor-default`,
  variant === "primary" && tw`text-[#101010] bg-[var(--accent)] border-[var(--accent)]`,
  variant === "danger" && tw`text-[#ff8a8a] bg-transparent border-[#6b2a2a]`,
  variant === "plain" && tw`text-[#bbb] bg-transparent border-[#2a2a2a]`,
]);

const Pipeline = tw.ol`list-none m-0 mt-[18px] p-0 grid gap-[8px] grid-cols-2 md:grid-cols-4`;

const STEP_STYLES: Record<StepState, ReturnType<typeof css>> = {
  pending: css`
    border-color: #2a2a2a;
    opacity: 0.55;
  `,
  active: css`
    border-color: var(--accent);
    box-shadow: 0 0 18px rgba(var(--accent-rgb), 0.35);
  `,
  passed: css`
    border-color: var(--accent-muted);
  `,
  blocked: css`
    border-color: #ff5a5a;
    box-shadow: 0 0 18px rgba(255, 90, 90, 0.35);
  `,
};

const Step = styled.li(({ state }: { state: StepState }) => [
  tw`relative flex flex-col gap-[6px] p-[10px] bg-[#111] border-[1px] border-solid rounded-[4px]`,
  css`
    transition: border-color 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
  `,
  STEP_STYLES[state],
]);

const StepHead = tw.span`flex flex-row items-center gap-[8px] text-sm font-semibold text-white`;

const StepNumber = styled.span(({ state }: { state: StepState }) => [
  tw`flex items-center justify-center w-[20px] h-[20px] rounded-full text-[11px] font-bold bg-[#1d1d1d] text-[#999]`,
  (state === "active" || state === "passed") && tw`bg-[var(--accent)] text-[#101010]`,
  state === "blocked" && tw`bg-[#ff5a5a] text-[#101010]`,
]);

const Tech = tw.span`text-[11px] text-[#999]`;

const Log = styled.div(() => [
  tw`mt-[14px] p-[12px] min-h-[120px] text-[12px] leading-[1.7] text-[#bbb] bg-[#0a0f0c] border-[1px] border-solid border-[#1E1E1E]`,
  css`
    font-family: ${MONO};
  `,
]);

const LogLine = styled.div(({ tone }: { tone: "plain" | "good" | "bad" }) => [
  tw`whitespace-pre-wrap break-words`,
  tone === "good" && tw`text-[var(--accent)]`,
  tone === "bad" && tw`text-[#ff8a8a]`,
]);

const stepState = (index: number, run: RunState, blockedIndex: number): StepState => {
  if (run.status === "idle" || index >= run.reached) {
    return "pending";
  }

  if (index === blockedIndex && run.status === "blocked") {
    return "blocked";
  }

  return index === run.reached - 1 && run.status === "running" ? "active" : "passed";
};

// An interactive wireframe of a transaction moving through the stack: each step lights up in turn and the
// log narrates it, and an unsafe request is stopped at the security step before anything is signed.
export const TxFlow: FC<TxFlowContent> = ({ title, description, note, resetLabel, logLabel, hashLabel, steps, scenarios }: TxFlowContent) => {
  const [run, setRun] = useState<RunState>(IDLE);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const play = (scenario: FlowScenario) => {
    clearTimers();

    const blockedIndex = scenario.blockedAt ? steps.findIndex((step) => step.id === scenario.blockedAt) : -1;
    const total = blockedIndex >= 0 ? blockedIndex + 1 : steps.length;
    const finalStatus: RunStatus = blockedIndex >= 0 ? "blocked" : "done";
    const hash = blockHash(`${scenario.label}:${Date.now()}`);

    if (prefersReducedMotion()) {
      setRun({ scenario, reached: total, status: finalStatus, hash });

      return;
    }

    setRun({ scenario, reached: 1, status: "running", hash });

    for (let step = 2; step <= total + 1; step += 1) {
      timers.current.push(window.setTimeout(() => {
        setRun({ scenario, reached: Math.min(step, total), status: step > total ? finalStatus : "running", hash });
      }, (step - 1) * STEP_MS));
    }
  };

  const reset = () => {
    clearTimers();
    setRun(IDLE);
  };

  const blockedIndex = run.scenario?.blockedAt ? steps.findIndex((step) => step.id === run.scenario?.blockedAt) : -1;
  const lines = run.scenario ? run.scenario.lines.slice(0, run.reached) : [];
  const isFinished = run.status === "done" || run.status === "blocked";

  return (
    <Wrapper>
      <Title>{title}</Title>
      <Text>{description}</Text>
      <Note>{note}</Note>
      <Controls>
        {scenarios.map((scenario, index) => (
          <Button key={scenario.label} type="button" variant={index === 0 ? "primary" : "danger"} disabled={run.status === "running"} onClick={() => play(scenario)}>
            {scenario.label}
          </Button>
        ))}
        <Button type="button" variant="plain" disabled={run.status === "idle"} onClick={reset}>{resetLabel}</Button>
      </Controls>
      <Pipeline>
        {steps.map((step, index) => {
          const state = stepState(index, run, blockedIndex);

          return (
            <Step key={step.id} state={state}>
              <StepHead>
                <StepNumber state={state} aria-hidden="true">{index + 1}</StepNumber>
                {step.name}
              </StepHead>
              <Tech>{step.tech.join(", ")}</Tech>
            </Step>
          );
        })}
      </Pipeline>
      <Log role="log" aria-live="polite" aria-label={logLabel}>
        {run.scenario && !run.scenario.blockedAt && <LogLine tone="plain">{`${hashLabel} ${run.hash}`}</LogLine>}
        {lines.map((line, index) => (
          <LogLine key={line} tone={index === blockedIndex && run.status === "blocked" ? "bad" : "plain"}>{`> ${line}`}</LogLine>
        ))}
        {isFinished && run.scenario && <LogLine tone={run.status === "blocked" ? "bad" : "good"}>{run.scenario.result}</LogLine>}
      </Log>
    </Wrapper>
  );
};

import { FC, useEffect, useState } from "react";

import tw, { styled } from "twin.macro";

import { useDeploysStateHook } from "@/components/Game/hooks/useDeploysStateHook";
import { ZONE_ACCENTS } from "@/config/zones";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { recordOf } from "@/packages/core/domain";
import { fill } from "@/packages/text/format";
import { deployScript, hostFor, HostPlan, hostName, moveScript, nextHost, UNIVERSE_STACKS } from "@/services/devops";
import { media } from "@/styles/mixins";
import { DevOpsConsoleContent, DevOpsHost, HostId, UniverseStack } from "@/types/devops";

interface ConsoleProps {
  content: DevOpsConsoleContent;
  hosts: readonly DevOpsHost[];
  plan: HostPlan;
}

type JobKind = "deploy" | "move";

interface Job {
  stack: UniverseStack;
  kind: JobKind;
  from: HostId;
  to: HostId;
  lines: string[];
  shown: number;
  isDone: boolean;
  // The plan it was started under: a new one ships the stack again, to where that one puts it.
  plan: HostPlan;
}

// A line a moment, and a beat on the last before the stack goes live.
const LINE_MS = 420;
const SETTLE_MS = 500;
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const placeAll = (plan: HostPlan) => recordOf(UNIVERSE_STACKS, (stack) => hostFor(plan, stack));

const Layout = styled.div`
  ${tw`grid gap-[18px] items-start`}

  ${media.lg} {
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  }
`;

const Stacks = tw.ul`list-none m-0 p-0 flex flex-col gap-[8px]`;

// Live is a data attribute on one rule written with the page, not a prop, which would add a rule as the first stack
// goes live and restyle everything on the screen.
const StackRow = styled.li`
  ${tw`grid items-center gap-x-[10px] gap-y-[2px] p-[10px] bg-[#0d0d0d] border-[1px] border-solid border-[#1E1E1E]`}

  grid-template-columns: minmax(0, 1fr) auto;
  border-left: 3px solid var(--stack);
  transition: border-color 0.3s ease;

  &[data-live] {
    border-color: var(--stack);
  }
`;

const StackName = tw.span`text-sm font-semibold text-white`;

const StackHost = tw.span`col-start-1 text-xs text-[#999]`;

const StackActions = tw.div`row-start-1 row-span-2 col-start-2 flex flex-row gap-[6px]`;

const Small = styled.button`
  ${tw`cursor-pointer text-xs py-[7px] px-[10px] bg-transparent border-[1px] border-solid border-[var(--accent-muted)] text-[var(--accent)] rounded-[2px]`}

  &:hover,
  &:focus-visible {
    border-color: var(--accent);
  }
`;

const All = styled(Small)`
  ${tw`mt-[10px] bg-[var(--accent)] text-[#101010] border-[var(--accent)] font-semibold`}
`;

const Screen = tw.div`flex flex-col min-w-0 bg-[#070707] border-[1px] border-solid border-[#1E1E1E]`;

const Bar = tw.div`flex flex-row items-center gap-[6px] px-[12px] py-[8px] border-0 border-b-[1px] border-solid border-[#1E1E1E] text-xs text-[#8a8a8a]`;

const Dot = tw.span`w-[8px] h-[8px] rounded-full bg-[#2a2a2a]`;

// The pipe a stack's container travels along as it ships: from the build on the left to its host on the right.
const Track = tw.div`relative h-[34px] mx-[12px] mt-[12px] border-0 border-b-[1px] border-dashed border-[#2a2a2a]`;

const Carrier = styled.div`
  ${tw`absolute left-0 top-0 h-full pointer-events-none`}

  width: calc(100% - 26px);
  transform: translateX(calc(var(--at, 0) * 100%));
  transition: transform 0.4s ease;

  ${media.reducedMotion} {
    transition: none;
  }
`;

const Crate = styled.span`
  ${tw`absolute bottom-[4px] left-0 w-[26px] h-[16px] border-[1px] border-solid border-[var(--accent)] bg-[#140b09]`}

  border-top: 4px solid var(--stack, var(--accent));
`;

const Ends = tw.div`flex flex-row justify-between px-[12px] pt-[6px] text-xs text-[#8a8a8a]`;

const Target = styled.span`

  color: var(--stack, var(--accent));
`;

// The lines are styled from the log, which is written with the page, so the first line printed adds no rule of its own
// (which would restyle everything on the screen). A long command wraps rather than scrolling the log sideways on a phone.
const Log = styled.ol`
  ${tw`list-none m-0 p-[12px] flex flex-col gap-[4px] min-h-[132px] text-xs text-[#bbb]`}

  & > li {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-family: ${MONO};
  }

  & > li > span {
    color: var(--accent);
  }
`;

const Status = tw.p`m-0 px-[12px] pb-[12px] text-sm text-white`;

// The DevOps console: each universe's stack shipped to the host the guide picked for its part, or moved on to
// another with no downtime, its commands printed a line at a time as its container travels the pipe, and every
// one that goes live counted as a deploy shipped for the finale's board. Under reduced motion each lands at once.
export const Console: FC<ConsoleProps> = ({ content, hosts, plan }: ConsoleProps) => {
  const { shipDeploy } = useDeploysStateHook();
  const isReduced = useReducedMotion();
  const [placed, setPlaced] = useState<Readonly<Record<UniverseStack, HostId>>>(() => placeAll(plan));
  const [live, setLive] = useState<ReadonlySet<UniverseStack>>(() => new Set());
  const [queue, setQueue] = useState<ReadonlyArray<{ stack: UniverseStack; kind: JobKind }>>([]);
  const [job, setJob] = useState<Job | null>(null);
  // Numbered, so the same line said again is read out again.
  const [status, setStatus] = useState({ text: content.idle, id: 0 });

  // A new plan puts every stack back where it says, not yet shipped there.
  useEffect(() => {
    setPlaced(placeAll(plan));
    setLive(new Set());
  }, [plan]);

  // A stack on its way when the plan changes goes back to the front of the queue, to ship where the new plan says.
  useEffect(() => {
    if (!job || job.isDone || job.plan === plan) {
      return;
    }

    setQueue((current) => [{ stack: job.stack, kind: job.kind }, ...current.filter((entry) => entry.stack !== job.stack || entry.kind !== job.kind)]);
    setJob(null);
  }, [job, plan]);

  // The next job in the queue starts once the last is done.
  useEffect(() => {
    if ((job && !job.isDone) || queue.length === 0) {
      return;
    }

    const [next, ...rest] = queue;
    const from = placed[next.stack];
    const to = next.kind === "move" ? nextHost(next.stack, from) : from;
    const lines = next.kind === "move" ? moveScript(content, next.stack, from, to) : deployScript(content, next.stack, to);

    setQueue(rest);
    setJob({ ...next, from, to, lines, shown: isReduced ? lines.length : 1, isDone: false, plan });
  }, [job, queue, placed, plan, content, isReduced]);

  // A line at a time, then live.
  useEffect(() => {
    if (!job || job.isDone) {
      return;
    }

    if (job.shown < job.lines.length) {
      const timer = window.setTimeout(() => setJob({ ...job, shown: job.shown + 1 }), LINE_MS);

      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      const stack = content.stacks[job.stack];

      setPlaced((current) => ({ ...current, [job.stack]: job.to }));
      setLive((current) => new Set(current).add(job.stack));
      const text = job.kind === "move"
        ? fill(content.moved, { stack, from: hostName(hosts, job.from), to: hostName(hosts, job.to) })
        : fill(content.shipped, { stack, host: hostName(hosts, job.to) });

      setStatus((current) => ({ text, id: current.id + 1 }));
      setJob({ ...job, isDone: true });
      shipDeploy();
    }, isReduced ? 0 : SETTLE_MS);

    return () => window.clearTimeout(timer);
  }, [job, content, hosts, isReduced, shipDeploy]);

  const ask = (stack: UniverseStack, kind: JobKind) => setQueue((current) =>
    (current.some((entry) => entry.stack === stack && entry.kind === kind) ? current : [...current, { stack, kind }]));

  const deployAll = () => setQueue((current) => [
    ...current,
    ...UNIVERSE_STACKS
      .filter((stack) => !current.some((entry) => entry.stack === stack))
      .map((stack): { stack: UniverseStack; kind: JobKind } => ({ stack, kind: "deploy" })),
  ]);

  const shown = job ? job.lines.slice(0, job.shown) : [];
  const at = job ? job.shown / job.lines.length : 0;

  return (
    <Layout>
      <div>
        <Stacks>
          {UNIVERSE_STACKS.map((stack) => (
            <StackRow key={stack} data-live={live.has(stack) ? "" : undefined} style={{ "--stack": ZONE_ACCENTS[stack] }}>
              <StackName>{content.stacks[stack]}</StackName>
              <StackHost>{live.has(stack) ? fill(content.liveOn, { host: hostName(hosts, placed[stack]) }) : hostName(hosts, placed[stack])}</StackHost>
              <StackActions>
                <Small type="button" onClick={() => ask(stack, "deploy")} aria-label={`${content.deploy}: ${content.stacks[stack]}`}>
                  {content.deploy}
                </Small>
                <Small type="button" onClick={() => ask(stack, "move")} aria-label={`${content.move}: ${content.stacks[stack]}`}>
                  {content.move}
                </Small>
              </StackActions>
            </StackRow>
          ))}
        </Stacks>
        <All type="button" onClick={deployAll}>
          {content.deployAll}
        </All>
      </div>
      <Screen style={job ? { "--stack": ZONE_ACCENTS[job.stack], "--at": at } : undefined}>
        <Bar aria-hidden="true">
          <Dot />
          <Dot />
          <Dot />
          <span>{content.label}</span>
        </Bar>
        <Track aria-hidden="true">
          <Carrier>
            <Crate />
          </Carrier>
        </Track>
        <Ends aria-hidden="true">
          <span>{job ? content.stacks[job.stack] : ""}</span>
          <Target>{job ? hostName(hosts, job.to) : ""}</Target>
        </Ends>
        <Log aria-label={content.label}>
          {shown.map((line, index) => (
            <li key={`${job?.stack ?? ""}-${index}`}>
              <span>{`${content.prompt}$ `}</span>
              {line}
            </li>
          ))}
        </Log>
        <Status role="status">
          <span key={status.id}>{status.text}</span>
        </Status>
      </Screen>
    </Layout>
  );
};

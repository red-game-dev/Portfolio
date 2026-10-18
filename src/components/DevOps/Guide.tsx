import { FC } from "react";

import tw, { css, styled } from "twin.macro";

import { GUIDE_OPTIONS, HostPlan, hostName } from "@/services/devops";
import { media } from "@/styles/mixins";
import { DevOpsGuideContent, DevOpsHost, GuideAnswers, GuideQuestion } from "@/types/devops";

interface GuideProps {
  content: DevOpsGuideContent;
  hosts: readonly DevOpsHost[];
  answers: GuideAnswers;
  plan: HostPlan;
  onChoose: <Q extends GuideQuestion>(question: Q, value: GuideAnswers[Q]) => void;
}

const Layout = styled.div(() => [
  tw`grid gap-[18px] items-start`,
  css`
    ${media.lg} {
      grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    }
  `,
]);

const Questions = tw.div`flex flex-col gap-[14px]`;

const Group = tw.fieldset`m-0 p-0 border-0 flex flex-col gap-[6px] min-w-0`;

const Name = tw.legend`p-0 mb-[4px] text-sm font-semibold text-white`;

const Options = tw.div`flex flex-row flex-wrap gap-[8px]`;

// An answer as a pill: the radio inside it, its words beside it, filled once chosen.
const Option = styled.label(({ isChosen }: { isChosen: boolean }) => [
  tw`flex flex-row items-center gap-[6px] px-[10px] py-[7px] text-xs cursor-pointer border-[1px] border-solid border-[var(--accent-muted)]
     text-[var(--accent)]`,
  isChosen && [
    tw`border-[var(--accent)] text-white`,
    css`
      background: rgba(var(--accent-rgb), 0.16);
    `,
  ],
  css`
    &:focus-within {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    input {
      accent-color: var(--accent);
      margin: 0;
    }
  `,
]);

const Result = tw.div`flex flex-col gap-[10px] min-w-0`;

const ResultTitle = tw.h4`m-0 text-sm font-semibold text-white`;

const Plan = tw.dl`m-0 flex flex-col gap-[1px] bg-[#1E1E1E] border-[1px] border-solid border-[#1E1E1E]`;

const Row = styled.div(() => [
  tw`grid gap-[4px] p-[12px] bg-[#0d0d0d]`,
  css`
    ${media.md} {
      grid-template-columns: 130px minmax(0, 1fr);
      gap: 14px;
    }
  `,
]);

const Layer = tw.dt`text-xs uppercase tracking-wide text-[var(--accent)]`;

const Pick = tw.dd`m-0 flex flex-col gap-[2px] min-w-0`;

const Host = tw.span`text-sm font-semibold text-white`;

const Reason = tw.span`text-sm text-[#aaa]`;

interface ChoiceProps<Q extends GuideQuestion> {
  question: Q;
  content: DevOpsGuideContent;
  value: GuideAnswers[Q];
  onChoose: GuideProps["onChoose"];
}

const Choice = <Q extends GuideQuestion>({ question, content, value, onChoose }: ChoiceProps<Q>) => {
  const words = content.questions[question];

  return (
    <Group>
      <Name>{words.label}</Name>
      <Options>
        {GUIDE_OPTIONS[question].map((option) => (
          <Option key={option} isChosen={option === value}>
            <input type="radio" name={`devops-${question}`} value={option} checked={option === value} onChange={() => onChoose(question, option)} />
            {words.options[option]}
          </Option>
        ))}
      </Options>
    </Group>
  );
};

// Where should it run: four questions about a product, and beside them where I would run each part of it and why,
// worked out as the answers change by `recommendHosts`. The console under it ships each universe to the same plan.
export const Guide: FC<GuideProps> = ({ content, hosts, answers, plan, onChoose }: GuideProps) => (
  <Layout>
    <Questions>
      <Choice question="traffic" content={content} value={answers.traffic} onChoose={onChoose} />
      <Choice question="budget" content={content} value={answers.budget} onChoose={onChoose} />
      <Choice question="team" content={content} value={answers.team} onChoose={onChoose} />
      <Choice question="latency" content={content} value={answers.latency} onChoose={onChoose} />
    </Questions>
    <Result>
      <ResultTitle id="devops-plan">{content.result}</ResultTitle>
      <Plan aria-labelledby="devops-plan">
        {plan.map(({ layer, host, reason }) => (
          <Row key={layer}>
            <Layer>{content.layers[layer]}</Layer>
            <Pick>
              <Host>{hostName(hosts, host)}</Host>
              <Reason>{content.reasons[reason]}</Reason>
            </Pick>
          </Row>
        ))}
      </Plan>
    </Result>
  </Layout>
);

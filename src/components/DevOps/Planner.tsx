import { FC, useCallback, useMemo, useState } from "react";

import { Console } from "@/components/DevOps/Console";
import { Guide } from "@/components/DevOps/Guide";
import { Lead } from "@/components/DevOps/styles";
import { Panel, PanelTitle } from "@/components/Panel";
import { DEFAULT_GUIDE_ANSWERS, recommendHosts } from "@/services/devops";
import { DevOpsContent, GuideAnswers, GuideQuestion } from "@/types/devops";

interface PlannerProps {
  content: DevOpsContent;
}

// Where should it run, and the console that ships to it: the answers live here, so changing one re-renders these two
// panels and not the rest of the section.
export const Planner: FC<PlannerProps> = ({ content }: PlannerProps) => {
  const [answers, setAnswers] = useState<GuideAnswers>(DEFAULT_GUIDE_ANSWERS);
  const plan = useMemo(() => recommendHosts(answers), [answers]);
  const choose = useCallback(<Q extends GuideQuestion>(question: Q, value: GuideAnswers[Q]) => setAnswers((current) => {
    const next = { ...current };

    next[question] = value;

    return next;
  }), []);

  return (
    <>
      <Panel>
        <PanelTitle>{content.guide.title}</PanelTitle>
        <Lead>{content.guide.intro}</Lead>
        <Guide content={content.guide} hosts={content.hosts.items} answers={answers} plan={plan} onChoose={choose} />
      </Panel>
      <Panel>
        <PanelTitle>{content.console.title}</PanelTitle>
        <Lead>{content.console.intro}</Lead>
        <Console content={content.console} hosts={content.hosts.items} plan={plan} />
      </Panel>
    </>
  );
};

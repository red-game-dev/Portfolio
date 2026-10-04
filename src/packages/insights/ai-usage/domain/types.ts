export interface AiUsageIntro {
  title: string;
  description: string[];
}

export interface AiUsageTask {
  name: string;
  // Whole percentage points.
  share: number;
}

export interface AiUsageScreen {
  // Short lines for an animated headline. Keep each one under about 20 characters.
  message: string[];
  // The same fact as one sentence, for screen readers.
  label: string;
}

export interface AiUsageMix {
  title: string;
  description: string[];
  tasks: AiUsageTask[];
  notes: string[];
}

export interface AiUsageAreaGroup {
  // A volume band such as "Over a thousand prompts each". Bands, not exact counts.
  label: string;
  items: string[];
}

// Subjects rather than kinds of work. They overlap, so unlike the task mix they never sum to a whole.
export interface AiUsageAreas {
  title: string;
  description: string[];
  groups: AiUsageAreaGroup[];
  notes: string[];
}

export interface AiUsagePrinciple {
  title: string;
  description: string;
}

export interface AiUsageExamples {
  title: string;
  items: AiUsagePrinciple[];
}

// `TIcon` is whatever the host renders icons with (an SVG definition, a name, a component), so the
// domain never depends on an icon library.
export interface AiUsageStage<TIcon = unknown> {
  name: string;
  icon: TIcon;
  principles: AiUsagePrinciple[];
}

export interface AiUsageAgents<TIcon = unknown> {
  title: string;
  description: string[];
  stages: Array<AiUsageStage<TIcon>>;
  examples: AiUsageExamples;
  footer: string;
}

export interface AiUsageMilestone {
  period: string;
  title: string;
  description: string;
  isCurrent?: boolean;
}

export interface AiUsageTimeline {
  title: string;
  milestones: AiUsageMilestone[];
}

export interface AiUsageSections<TIcon = unknown> {
  screen: AiUsageScreen;
  mix: AiUsageMix;
  areas: AiUsageAreas;
  agents: AiUsageAgents<TIcon>;
  timeline: AiUsageTimeline;
}

export interface AiUsageContent<TIcon = unknown> extends AiUsageSections<TIcon> {
  intro: AiUsageIntro;
}

export interface AiUsageTaskView extends AiUsageTask {
  label: string;
}

export interface AiUsageMixView extends Omit<AiUsageMix, "tasks"> {
  tasks: AiUsageTaskView[];
  // Cells per row. The largest share fills its row, so one cell is always one percentage point.
  trackLength: number;
}

export interface AiUsageView<TIcon = unknown> extends Omit<AiUsageContent<TIcon>, "mix"> {
  mix: AiUsageMixView;
}

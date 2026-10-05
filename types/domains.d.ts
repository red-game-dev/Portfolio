// One thing I have done in a field, with where it shipped. Used by the Web3 and iGaming sections.
export interface DomainCapability {
  name: string;
  detail: string;
  places: string[];
  link?: {
    label: string;
    url: string;
  };
}

export interface StackItem {
  name: string;
  // What it is for, shown under the name on token standards.
  detail?: string;
}

export interface StackGroup {
  label: string;
  items: StackItem[];
}

export interface FlowStep {
  id: string;
  name: string;
  tech: string[];
}

// One run through the flow. `lines` narrate the steps in order; a run with `blockedAt` stops at that step.
export interface FlowScenario {
  label: string;
  lines: string[];
  blockedAt?: string;
  result: string;
}

export interface TxFlowContent {
  title: string;
  description: string;
  note: string;
  resetLabel: string;
  logLabel: string;
  hashLabel: string;
  steps: FlowStep[];
  scenarios: FlowScenario[];
}

export interface Web3Content {
  statement: string;
  stackTitle: string;
  stack: StackGroup[];
  flow: TxFlowContent;
  validatorsLabel: string;
  validators: string[];
  blockLabel: string;
  previousLabel: string;
  pendingLabel: string;
  confirmedLabel: string;
  capabilities: DomainCapability[];
}

export interface IGamingContent {
  statement: string;
  liveLabel: string;
  proofLabel: string;
  proof: string[];
  cards: DomainCapability[];
  quote: {
    text: string;
    source: string;
  };
}

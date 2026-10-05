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

export interface Web3Content {
  statement: string;
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

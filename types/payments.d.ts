import { PaymentMethodId } from "@/config/payments";

// The words of the terminal a reader pays at, above the payments drawings.
export interface PaymentTerminalContent {
  // Names the terminal and its ways to pay for screen readers.
  label: string;
  hint: string;
  // What the terminal's screen shows while it waits, and as it pays.
  amount: string;
  processing: string;
  approved: string;
  // Each way to pay's button: "{method}" is replaced with the method's name.
  payWith: string;
  // Read out once a payment goes through: "{method}" is replaced with the method's name.
  approvedLine: string;
  methods: Record<PaymentMethodId, string>;
}

export interface PaymentsContent {
  terminal: PaymentTerminalContent;
  // The link at the foot of the section to the payments case studies.
  caseStudies: string;
}

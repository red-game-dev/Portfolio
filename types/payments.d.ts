import { PaymentGroupId, PaymentMethodId } from "@/config/payments";

// The words of the counter a reader pays at, above the payments drawings.
export interface PaymentTerminalContent {
  // Names the counter and its ways to pay for screen readers.
  label: string;
  hint: string;
  // The total the cashier rings up and the terminal shows.
  amount: string;
  // The names over each group of ways to pay.
  groups: Record<PaymentGroupId, string>;
  // Each way to pay's button: "{method}" is replaced with the method's name.
  payWith: string;
  // Read out once a payment goes through: "{method}" is replaced with the method's name.
  approvedLine: string;
  methods: Record<PaymentMethodId, string>;
  // The name and the picture the counter's own red card is printed with.
  cardholder: string;
  portrait: string;
  // The credit the scanned head of the customer paying by face is used under, its licence named and linked.
  credit: { text: string; licence: string; url: string };
}

export interface PaymentsContent {
  terminal: PaymentTerminalContent;
  // The panel the section closes on: the payment problems from the case studies, each opening them on payments.
  caseStudies: {
    title: string;
    description: string;
    link: string;
  };
}

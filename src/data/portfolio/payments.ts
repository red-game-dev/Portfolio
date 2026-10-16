import { PortfolioData } from "@/types/portfolio";

// The payments section's own words: the terminal a reader pays at, and the way on to the case studies. The
// drawings below it are in src/data/blueprints/payments.ts.
export const paymentsContent: Pick<PortfolioData, "payments"> = {
  payments: {
    terminal: {
      label: "A card terminal",
      hint: "Pay with a card, a phone wallet or a QR code. Each payment opens the next drawing.",
      amount: "€18.40",
      processing: "Processing",
      approved: "Approved",
      payWith: "Pay with {method}",
      approvedLine: "{method}: approved. The next drawing is open.",
      methods: {
        visa: "Visa, by chip and PIN",
        mastercard: "Mastercard, contactless",
        amex: "American Express, swiped",
        discover: "Discover, contactless",
        jcb: "JCB, by chip and PIN",
        diners: "Diners Club, swiped",
        applePay: "Apple Pay",
        googlePay: "Google Pay",
        paypal: "PayPal, by QR code",
        alipay: "Alipay, by QR code",
        wechat: "WeChat Pay, by QR code",
        bitcoin: "Bitcoin, by QR code",
        ethereum: "Ethereum, by QR code",
      },
    },
    caseStudies: "Payment problems I solved, as case studies",
  },
};

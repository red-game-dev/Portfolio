import { PortfolioData } from "@/types/portfolio";

import { profileContent } from "./profile";

// The payments section's own words: the terminal a reader pays at, and the way on to the case studies. The
// drawings below it are in src/data/blueprints/payments.ts.
export const paymentsContent: Pick<PortfolioData, "payments"> = {
  payments: {
    terminal: {
      // The red card prints the holder's name and portrait: the profile's own.
      cardholder: profileContent.details.name.toUpperCase(),
      portrait: profileContent.details.image,
      label: "A shop counter with a card terminal",
      hint: "You are the customer: pick how to pay. The cashier rings it up and opens the app for it, you pay at the terminal, " +
        "and each payment opens the next drawing.",
      amount: "€18.40",
      groups: { new: "New at the counter", cards: "Cards", wallets: "Phone wallets", qr: "QR apps", crypto: "Crypto" },
      payWith: "Pay with {method}",
      approvedLine: "{method}: approved. The next drawing is open.",
      customerFace: "/images/payments/customer-face.webp",
      credit: {
        text: "The customer paying by face is Female_Adult_15 from Microsoft's Rocketbox avatars, her hair made blonde, used under the",
        licence: "MIT licence",
        url: "https://github.com/microsoft/Microsoft-Rocketbox/blob/master/LICENSE.md",
      },
      methods: {
        visa: "Visa, by chip and PIN",
        mastercard: "Mastercard, contactless",
        amex: "American Express, swiped",
        discover: "Discover, contactless",
        jcb: "JCB, by chip and PIN",
        diners: "Diners Club, swiped",
        ramp: "Ramp, contactless",
        applePay: "Apple Pay",
        googlePay: "Google Pay",
        paypal: "PayPal, by QR code",
        alipay: "Alipay, by QR code",
        wechat: "WeChat Pay, by QR code",
        gcash: "GCash, by QR code",
        maya: "Maya, by QR code",
        bitcoin: "Bitcoin, by QR code",
        ethereum: "Ethereum, by QR code",
        solana: "Solana, by QR code",
        arbitrum: "Arbitrum, by QR code",
        polygon: "Polygon, by QR code",
        bnb: "BNB Chain, by QR code",
        usdc: "USDC, by QR code",
        usdt: "USDT, by QR code",
        revolut: "Revolut, by face",
      },
    },
    caseStudies: {
      title: "Payment problems I solved",
      description: "Real problems I met building payments and the systems around them, each told in the case studies as a boss beaten.",
      link: "Open the payment case studies",
    },
  },
};

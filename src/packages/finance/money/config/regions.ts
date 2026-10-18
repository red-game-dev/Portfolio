import { CurrencyCode, RegionCode } from "../domain/types";

// The currency each country or territory pays in at a till, by ISO 3166 code.
const EURO = [
  "AD", "AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MC", "ME", "MT", "NL", "PT", "SI",
  "SK", "SM", "VA", "XK",
];

export const REGION_CURRENCY: Readonly<Record<RegionCode, CurrencyCode>> = {
  ...Object.fromEntries(EURO.map((region) => [region, "EUR"])),
  AE: "AED", AR: "ARS", AU: "AUD", BD: "BDT", BG: "BGN", BH: "BHD", BR: "BRL", CA: "CAD", CH: "CHF", CL: "CLP", CN: "CNY",
  CO: "COP", CR: "CRC", CZ: "CZK", DK: "DKK", DO: "DOP", DZ: "DZD", EC: "USD", EG: "EGP", GB: "GBP", GE: "GEL", GH: "GHS",
  GT: "GTQ", HK: "HKD", HU: "HUF", ID: "IDR", IL: "ILS", IN: "INR", IS: "ISK", JM: "JMD", JO: "JOD", JP: "JPY", KE: "KES",
  KH: "KHR", KR: "KRW", KW: "KWD", KZ: "KZT", LB: "LBP", LI: "CHF", LK: "LKR", MA: "MAD", MO: "MOP", MX: "MXN", MY: "MYR",
  NG: "NGN", NO: "NOK", NP: "NPR", NZ: "NZD", OM: "OMR", PA: "USD", PE: "PEN", PH: "PHP", PK: "PKR", PL: "PLN", PR: "USD",
  PY: "PYG", QA: "QAR", RO: "RON", RS: "RSD", SA: "SAR", SE: "SEK", SG: "SGD", SV: "USD", TH: "THB", TN: "TND", TR: "TRY",
  TW: "TWD", TZ: "TZS", UA: "UAH", UG: "UGX", US: "USD", UY: "UYU", UZ: "UZS", VN: "VND", ZA: "ZAR",
};

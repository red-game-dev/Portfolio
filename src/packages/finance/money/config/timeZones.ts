import { RegionCode } from "../domain/types";

// The region a time zone lies in, for the zones most devices are set to (IANA names). A zone shared by several
// countries, or one not listed, says nothing, and the visitor's languages are asked instead.
export const TIME_ZONE_REGION: Readonly<Record<string, RegionCode>> = {
  "Africa/Accra": "GH", "Africa/Algiers": "DZ", "Africa/Cairo": "EG", "Africa/Casablanca": "MA", "Africa/Dar_es_Salaam": "TZ",
  "Africa/Johannesburg": "ZA", "Africa/Kampala": "UG", "Africa/Lagos": "NG", "Africa/Nairobi": "KE", "Africa/Tunis": "TN",
  "America/Argentina/Buenos_Aires": "AR", "America/Asuncion": "PY", "America/Bogota": "CO", "America/Chicago": "US",
  "America/Costa_Rica": "CR", "America/Denver": "US", "America/Edmonton": "CA", "America/El_Salvador": "SV",
  "America/Guatemala": "GT", "America/Guayaquil": "EC", "America/Halifax": "CA", "America/Jamaica": "JM", "America/Lima": "PE",
  "America/Los_Angeles": "US", "America/Mexico_City": "MX", "America/Montevideo": "UY", "America/New_York": "US",
  "America/Panama": "PA", "America/Phoenix": "US", "America/Puerto_Rico": "PR", "America/Santiago": "CL",
  "America/Santo_Domingo": "DO", "America/Sao_Paulo": "BR", "America/Toronto": "CA", "America/Vancouver": "CA",
  "America/Anchorage": "US", "America/Detroit": "US", "America/Winnipeg": "CA", "America/Monterrey": "MX",
  "America/Tijuana": "MX", "America/Cancun": "MX", "America/Manaus": "BR", "America/Fortaleza": "BR", "Pacific/Honolulu": "US",
  "Asia/Almaty": "KZ", "Asia/Amman": "JO", "Asia/Bahrain": "BH", "Asia/Bangkok": "TH", "Asia/Beirut": "LB", "Asia/Colombo": "LK",
  "Asia/Dhaka": "BD", "Asia/Dubai": "AE", "Asia/Ho_Chi_Minh": "VN", "Asia/Hong_Kong": "HK", "Asia/Jakarta": "ID",
  "Asia/Jerusalem": "IL", "Asia/Kathmandu": "NP", "Asia/Karachi": "PK", "Asia/Kolkata": "IN", "Asia/Calcutta": "IN",
  "Asia/Kuala_Lumpur": "MY", "Asia/Kuwait": "KW", "Asia/Macau": "MO", "Asia/Makassar": "ID", "Asia/Manila": "PH",
  "Asia/Muscat": "OM", "Asia/Phnom_Penh": "KH", "Asia/Qatar": "QA", "Asia/Riyadh": "SA", "Asia/Saigon": "VN", "Asia/Seoul": "KR",
  "Asia/Shanghai": "CN", "Asia/Singapore": "SG", "Asia/Taipei": "TW", "Asia/Tashkent": "UZ", "Asia/Tbilisi": "GE",
  "Asia/Tel_Aviv": "IL", "Asia/Tokyo": "JP", "Asia/Jayapura": "ID",
  "Atlantic/Reykjavik": "IS", "Australia/Adelaide": "AU", "Australia/Brisbane": "AU", "Australia/Melbourne": "AU",
  "Australia/Perth": "AU", "Australia/Sydney": "AU", "Australia/Hobart": "AU", "Australia/Darwin": "AU",
  "Europe/Amsterdam": "NL", "Europe/Andorra": "AD", "Europe/Athens": "GR", "Europe/Belgrade": "RS", "Europe/Berlin": "DE",
  "Europe/Bratislava": "SK", "Europe/Brussels": "BE", "Europe/Bucharest": "RO", "Europe/Budapest": "HU", "Europe/Copenhagen": "DK",
  "Europe/Dublin": "IE", "Europe/Helsinki": "FI", "Europe/Istanbul": "TR", "Europe/Kiev": "UA", "Europe/Kyiv": "UA",
  "Europe/Lisbon": "PT", "Europe/Ljubljana": "SI", "Europe/London": "GB", "Europe/Luxembourg": "LU", "Europe/Madrid": "ES",
  "Europe/Malta": "MT", "Europe/Monaco": "MC", "Europe/Oslo": "NO", "Europe/Paris": "FR", "Europe/Prague": "CZ",
  "Europe/Riga": "LV", "Europe/Rome": "IT", "Europe/Sofia": "BG", "Europe/Stockholm": "SE", "Europe/Tallinn": "EE",
  "Europe/Vienna": "AT", "Europe/Vilnius": "LT", "Europe/Warsaw": "PL", "Europe/Zagreb": "HR", "Europe/Zurich": "CH",
  "Europe/Nicosia": "CY", "Asia/Nicosia": "CY", "Europe/Podgorica": "ME", "Europe/Vaduz": "LI", "Europe/Belfast": "GB",
  "Pacific/Auckland": "NZ", "Atlantic/Canary": "ES", "Atlantic/Madeira": "PT", "Atlantic/Azores": "PT",
};

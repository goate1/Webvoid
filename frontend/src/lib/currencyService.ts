export const DEFAULT_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.35,
  AUD: 1.52,
  JPY: 150.0,
  CNY: 7.20,
  INR: 92.5079, // User's requested rate ($38 -> 3515.30)
  BRL: 4.98,
  MXN: 16.80,
  CHF: 0.88,
  SEK: 10.30,
  NOK: 10.60,
  DKK: 6.85,
  NZD: 1.64,
  SGD: 1.34,
  HKD: 7.82,
  KRW: 1330.0,
  AED: 3.67,
  SAR: 3.75,
  TRY: 32.0,
  PKR: 278.0,
  IDR: 15700.0,
  MYR: 4.70,
  THB: 35.80,
  PHP: 56.0,
  ZAR: 18.70,
  RUB: 91.50,
  TWD: 31.50,
  VND: 24700.0,
  ILS: 3.65,
  EGP: 47.50,
  ARS: 850.0,
  COP: 3900.0,
  CLP: 970.0,
  PEN: 3.70,
  UAH: 38.50,
  PLN: 3.95,
  CZK: 23.30,
  HUF: 365.0,
  RON: 4.60,
  // Additional currencies for all countries in CountrySelector
  BEF: 35.70, // Belgium (uses EUR now, but keeping for compatibility)
  ATS: 14.50, // Austria (uses EUR now, but keeping for compatibility)
  GRD: 91.50, // Greece (uses EUR now, but keeping for compatibility)
  PTE: 45.20, // Portugal (uses EUR now, but keeping for compatibility)
  IEP: 82.30, // Ireland (uses EUR now, but keeping for compatibility)
  BGN: 1.82,  // Bulgaria
  RSD: 105.0, // Serbia
  HRK: 7.20,  // Croatia
  MAD: 9.85,  // Morocco
  DZD: 135.0, // Algeria
  TND: 3.10,  // Tunisia
  KWD: 0.31,  // Kuwait
  QAR: 3.64,  // Qatar
  BHD: 0.38,  // Bahrain
  OMR: 0.38,  // Oman
  IRR: 42000.0, // Iran
  IQD: 1310.0, // Iraq
  SYP: 13000.0, // Syria
  LBP: 15000.0, // Lebanon
  JOD: 0.71,  // Jordan
  BYN: 3.25,  // Belarus (if needed)
  NGN: 775.0, // Nigeria (updated)
  KES: 145.0, // Kenya (updated)
  VEF: 3600000.0, // Venezuela (if needed)
  BOB: 6.90,  // Bolivia (if needed)
  PYG: 7350.0, // Paraguay (if needed)
  UYU: 38.50, // Uruguay (if needed)
  GEL: 2.75,  // Georgia (if needed)
  AMD: 385.0, // Armenia (if needed)
  AZN: 1.70,  // Azerbaijan (if needed)
  KZT: 450.0, // Kazakhstan (if needed)
  UZS: 12700.0, // Uzbekistan (if needed)
  KGS: 89.0,  // Kyrgyzstan (if needed)
  TJS: 10.90, // Tajikistan (if needed)
  TMT: 3.50,  // Turkmenistan (if needed)
  MNT: 3400.0, // Mongolia (if needed)
  LKR: 300.0, // Sri Lanka (if needed)
  NPR: 132.0, // Nepal
  BTN: 83.0,  // Bhutan
  BDT: 117.0, // Bangladesh (updated)
  MVR: 15.40, // Maldives (if needed)
  MMK: 2100.0, // Myanmar (if needed)
  LAK: 21000.0, // Laos (if needed)
  KHR: 4100.0, // Cambodia (if needed)
  AWG: 1.80,  // Aruba (if needed)
  CUP: 24.0,  // Cuba (if needed)
  HTG: 135.0, // Haiti (if needed)
  XCD: 2.70,  // East Caribbean (if needed)
  BBD: 2.00,  // Barbados (if needed)
  TTD: 6.75,  // Trinidad & Tobago (if needed)
  JMD: 155.0, // Jamaica (if needed)
  BSD: 1.00,  // Bahamas (if needed)
  BZD: 2.00,  // Belize (if needed)
  GTQ: 7.80,  // Guatemala (if needed)
  HNL: 24.50, // Honduras (if needed)
  NIO: 36.50, // Nicaragua (if needed)
  CRC: 540.0,  // Costa Rica (if needed)
  PAN: 1.00,  // Panama (if needed)
  DOP: 58.0,  // Dominican Republic (if needed)
  XOF: 600.0, // West African CFA (for some African countries)
  XAF: 600.0, // Central African CFA (for some African countries)
  XPF: 110.0, // CFP Franc (for French territories)
  WST: 2.60,  // Samoa (if needed)
  FJD: 2.25,  // Fiji (if needed)
  VUV: 120.0, // Vanuatu (if needed)
  SBD: 8.30,  // Solomon Islands (if needed)
  PGK: 3.80,  // Papua New Guinea (if needed)
  TOP: 2.30,  // Tonga (if needed)
  KID: 1.45,  // Kiribati (if needed)
  SCR: 45.0,  // Seychelles (if needed)
  MUR: 45.0,  // Mauritius (if needed)
};

export interface CurrencyDetails {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: CurrencyDetails[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', locale: 'es-MX' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', locale: 'da-DK' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', locale: 'zh-HK' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', locale: 'ar-SA' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', locale: 'tr-TR' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', locale: 'en-PK' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', locale: 'th-TH' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', locale: 'en-PH' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', locale: 'ru-RU' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', locale: 'zh-TW' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', locale: 'vi-VN' },
  { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel', locale: 'he-IL' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', locale: 'ar-EG' },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso', locale: 'es-AR' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso', locale: 'es-CO' },
  { code: 'CLP', symbol: '$', name: 'Chilean Peso', locale: 'es-CL' },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', locale: 'es-PE' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', locale: 'uk-UA' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', locale: 'pl-PL' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', locale: 'cs-CZ' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', locale: 'hu-HU' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu', locale: 'ro-RO' },
  // Additional currencies for all countries in CountrySelector
  { code: 'BEF', symbol: '₣', name: 'Belgian Franc', locale: 'fr-BE' },
  { code: 'ATS', symbol: 'öS', name: 'Austrian Schilling', locale: 'de-AT' },
  { code: 'GRD', symbol: 'δρχ', name: 'Greek Drachma', locale: 'el-GR' },
  { code: 'PTE', symbol: '$', name: 'Portuguese Escudo', locale: 'pt-PT' },
  { code: 'IEP', symbol: '£', name: 'Irish Pound', locale: 'en-IE' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev', locale: 'bg-BG' },
  { code: 'RSD', symbol: 'дин', name: 'Serbian Dinar', locale: 'sr-RS' },
  { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna', locale: 'hr-HR' },
  { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham', locale: 'ar-MA' },
  { code: 'DZD', symbol: 'د.ج', name: 'Algerian Dinar', locale: 'ar-DZ' },
  { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar', locale: 'ar-TN' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', locale: 'ar-KW' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal', locale: 'ar-QA' },
  { code: 'BHD', symbol: 'د.ب', name: 'Bahraini Dinar', locale: 'ar-BH' },
  { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial', locale: 'ar-OM' },
  { code: 'IRR', symbol: '﷼', name: 'Iranian Rial', locale: 'fa-IR' },
  { code: 'IQD', symbol: 'د.ع', name: 'Iraqi Dinar', locale: 'ar-IQ' },
  { code: 'SYP', symbol: '£', name: 'Syrian Pound', locale: 'ar-SY' },
  { code: 'LBP', symbol: 'ل.ل', name: 'Lebanese Pound', locale: 'ar-LB' },
  { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar', locale: 'ar-JO' },
  { code: 'BYN', symbol: 'Br', name: 'Belarusian Ruble', locale: 'be-BY' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', locale: 'en-KE' },
  { code: 'VEF', symbol: 'Bs', name: 'Venezuelan Bolívar', locale: 'es-VE' },
  { code: 'BOB', symbol: 'Bs', name: 'Bolivian Boliviano', locale: 'es-BO' },
  { code: 'PYG', symbol: '₲', name: 'Paraguayan Guaraní', locale: 'es-PY' },
  { code: 'UYU', symbol: '$', name: 'Uruguayan Peso', locale: 'es-UY' },
  { code: 'GEL', symbol: '₾', name: 'Georgian Lari', locale: 'ka-GE' },
  { code: 'AMD', symbol: '֏', name: 'Armenian Dram', locale: 'hy-AM' },
  { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat', locale: 'az-AZ' },
  { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge', locale: 'kk-KZ' },
  { code: 'UZS', symbol: 'so\'m', name: 'Uzbekistani Som', locale: 'uz-UZ' },
  { code: 'KGS', symbol: 'som', name: 'Kyrgyzstani Som', locale: 'ky-KG' },
  { code: 'TJS', symbol: 'смн', name: 'Tajikistani Somoni', locale: 'tg-TJ' },
  { code: 'TMT', symbol: 'm', name: 'Turkmenistani Manat', locale: 'tk-TM' },
  { code: 'MNT', symbol: '₮', name: 'Mongolian Tugrik', locale: 'mn-MN' },
  { code: 'LKR', symbol: 'රු', name: 'Sri Lankan Rupee', locale: 'si-LK' },
  { code: 'NPR', symbol: 'रु', name: 'Nepalese Rupee', locale: 'ne-NP' },
  { code: 'BTN', symbol: 'Nu.', name: 'Bhutanese Ngultrum', locale: 'dz-BT' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', locale: 'bn-BD' },
  { code: 'MVR', symbol: 'ރ.', name: 'Maldivian Rufiyaa', locale: 'dv-MV' },
  { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat', locale: 'my-MM' },
  { code: 'LAK', symbol: '₭', name: 'Lao Kip', locale: 'lo-LA' },
  { code: 'KHR', symbol: '៛', name: 'Cambodian Riel', locale: 'km-KH' },
  { code: 'AWG', symbol: 'ƒ', name: 'Aruban Florin', locale: 'nl-AW' },
  { code: 'CUP', symbol: '$', name: 'Cuban Peso', locale: 'es-CU' },
  { code: 'HTG', symbol: 'G', name: 'Haitian Gourde', locale: 'ht-HT' },
  { code: 'XCD', symbol: '$', name: 'East Caribbean Dollar', locale: 'en-XC' },
  { code: 'BBD', symbol: '$', name: 'Barbadian Dollar', locale: 'en-BB' },
  { code: 'TTD', symbol: '$', name: 'Trinidad and Tobago Dollar', locale: 'en-TT' },
  { code: 'JMD', symbol: '$', name: 'Jamaican Dollar', locale: 'en-JM' },
  { code: 'BSD', symbol: '$', name: 'Bahamian Dollar', locale: 'en-BS' },
  { code: 'BZD', symbol: '$', name: 'Belize Dollar', locale: 'en-BZ' },
  { code: 'GTQ', symbol: 'Q', name: 'Guatemalan Quetzal', locale: 'es-GT' },
  { code: 'HNL', symbol: 'L', name: 'Honduran Lempira', locale: 'es-HN' },
  { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Córdoba', locale: 'es-NI' },
  { code: 'CRC', symbol: '₡', name: 'Costa Rican Colón', locale: 'es-CR' },
  { code: 'PAN', symbol: 'B/.', name: 'Panamanian Balboa', locale: 'es-PA' },
  { code: 'DOP', symbol: '$', name: 'Dominican Peso', locale: 'es-DO' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', locale: 'fr-SN' },
  { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', locale: 'fr-CM' },
  { code: 'XPF', symbol: '₣', name: 'CFP Franc', locale: 'fr-PF' },
  { code: 'WST', symbol: '$', name: 'Samoan Tala', locale: 'sm-WS' },
  { code: 'FJD', symbol: '$', name: 'Fijian Dollar', locale: 'en-FJ' },
  { code: 'VUV', symbol: 'VT', name: 'Vanuatu Vatu', locale: 'en-VU' },
  { code: 'SBD', symbol: '$', name: 'Solomon Islands Dollar', locale: 'en-SB' },
  { code: 'PGK', symbol: 'K', name: 'Papua New Guinean Kina', locale: 'en-PG' },
  { code: 'TOP', symbol: 'T$', name: 'Tongan Paʻanga', locale: 'to-TO' },
  { code: 'KID', symbol: '$', name: 'Kiribati Dollar', locale: 'en-KI' },
  { code: 'SCR', symbol: '₨', name: 'Seychellois Rupee', locale: 'en-SC' },
  { code: 'MUR', symbol: '₨', name: 'Mauritian Rupee', locale: 'en-MU' },
];

/**
 * Converts an amount from USD to the target currency.
 * @param amount Amount in USD
 * @param targetCurrency Target currency code (e.g., 'INR')
 * @returns Converted amount
 */
export const convertFromUSD = (amount: number, targetCurrency: string): number => {
  const rate = DEFAULT_RATES[targetCurrency] || 1;
  return amount * rate;
};

export const convertToUSD = (amount: number, fromCurrency: string): number => {
  const rate = DEFAULT_RATES[fromCurrency.toUpperCase()] || 1;
  return amount / rate;
};

/**
 * Formats a price according to the currency and locale.
 * @param amount Amount in target currency
 * @param currencyCode Currency code
 * @returns Formatted string
 */
export const formatCurrency = (amount: number, currencyCode: string): string => {
  if (amount <= 0) return 'FREE';
  
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
  
  return new Intl.NumberFormat(currencyInfo.locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};

/**
 * Converts and formats a price from USD.
 * @param amountUSD Amount in USD
 * @param targetCurrency Target currency code
 * @returns Formatted string
 */
export const formatFromUSD = (amountUSD: number, targetCurrency: string): string => {
  const converted = convertFromUSD(amountUSD, targetCurrency);
  return formatCurrency(converted, targetCurrency);
};

/**
 * Zero-decimal currencies in Stripe
 * See: https://stripe.com/docs/currencies#zero-decimal
 */
export const ZERO_DECIMAL_CURRENCIES = [
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
];

/**
 * Converts an amount for Stripe API (smallest unit).
 * @param amount Amount in currency units
 * @param currencyCode Currency code
 * @returns Amount in smallest units
 */
export const getStripeAmount = (amount: number, currencyCode: string): number => {
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.includes(currencyCode.toUpperCase());
  return isZeroDecimal ? Math.round(amount) : Math.round(amount * 100);
};

/**
 * Maps country codes to their respective currency codes
 */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // North America
  'US': 'USD',
  'CA': 'CAD',
  'MX': 'MXN',
  
  // Europe
  'GB': 'GBP',
  'DE': 'EUR',
  'FR': 'EUR',
  'IT': 'EUR',
  'ES': 'EUR',
  'NL': 'EUR',
  'BE': 'EUR',
  'AT': 'EUR',
  'CH': 'CHF',
  'SE': 'SEK',
  'NO': 'NOK',
  'DK': 'DKK',
  'FI': 'EUR',
  'PL': 'PLN',
  'CZ': 'CZK',
  'HU': 'HUF',
  'RO': 'RON',
  'BG': 'BGN',
  'RS': 'RSD',
  'HR': 'HRK',
  'GR': 'EUR',
  'PT': 'EUR',
  'IE': 'EUR',
  
  // Asia-Pacific
  'AU': 'AUD',
  'NZ': 'NZD',
  'JP': 'JPY',
  'CN': 'CNY',
  'HK': 'HKD',
  'SG': 'SGD',
  'KR': 'KRW',
  'TH': 'THB',
  'ID': 'IDR',
  'PH': 'PHP',
  'MY': 'MYR',
  'TW': 'TWD',
  'VN': 'VND',
  'IN': 'INR',
  
  // Middle East
  'SA': 'SAR',
  'AE': 'AED',
  'KW': 'KWD',
  'QA': 'QAR',
  'BH': 'BHD',
  'OM': 'OMR',
  'IL': 'ILS',
  'IR': 'IRR',
  'IQ': 'IQD',
  'SY': 'SYP',
  'LB': 'LBP',
  'JO': 'JOD',
  'TR': 'TRY',
  'EG': 'EGP',
  
  // South America
  'BR': 'BRL',
  'AR': 'ARS',
  'CL': 'CLP',
  'PE': 'PEN',
  'CO': 'COP',
  'VE': 'VEF',
  'BO': 'BOB',
  'PY': 'PYG',
  'UY': 'UYU',
  
  // Africa
  'ZA': 'ZAR',
  'NG': 'NGN',
  'KE': 'KES',
  'MA': 'MAD',
  'DZ': 'DZD',
  'TN': 'TND',
  
  // Eastern Europe/Central Asia
  'RU': 'RUB',
  'UA': 'UAH',
  'BY': 'BYN',
  
  // Others
  'BD': 'BDT',
  'PK': 'PKR',
  'LK': 'LKR',
  'NP': 'NPR',
  'BT': 'BTN',
};

/**
 * Gets the currency code for a given country code
 * @param countryCode Country code (e.g., 'US', 'GB')
 * @returns Currency code (e.g., 'USD', 'GBP')
 */
export const getCurrencyForCountry = (countryCode: string): string => {
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || 'USD';
};

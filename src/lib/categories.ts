export type CategoryType = "income" | "essential" | "discretionary" | "giving" | "savings";

export interface DefaultCategory {
  name: string;
  type: CategoryType;
  color: string;
}

// Categories are seeded once, on first run. Users can add/edit/delete afterward.
// Colors for the 8 highest-prevalence categories come from the validated
// categorical palette (fixed hue order, CVD-safe adjacent pairs). Remaining,
// lower-prevalence categories use distinct secondary colors; dashboard charts
// fold anything past the top 7 + "Other" into a single muted bucket.
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "Income", type: "income", color: "#2a78d6" }, // slot 1 blue
  { name: "Housing & Rent", type: "essential", color: "#eb6834" }, // slot 2 orange
  { name: "Groceries", type: "essential", color: "#1baf7a" }, // slot 3 aqua
  { name: "Dining & Takeout", type: "discretionary", color: "#eda100" }, // slot 4 yellow
  { name: "Shopping", type: "discretionary", color: "#e87ba4" }, // slot 5 magenta
  { name: "Zakat & Sadaqa", type: "giving", color: "#008300" }, // slot 6 green
  { name: "Transportation", type: "essential", color: "#4a3aa7" }, // slot 7 violet
  { name: "Entertainment", type: "discretionary", color: "#e34948" }, // slot 8 red
  { name: "Utilities", type: "essential", color: "#0e7490" },
  { name: "Health & Medical", type: "essential", color: "#be123c" },
  { name: "Insurance", type: "essential", color: "#475569" },
  { name: "Debt & Loan Payments", type: "essential", color: "#78350f" },
  { name: "Subscriptions", type: "discretionary", color: "#9333ea" },
  { name: "Travel", type: "discretionary", color: "#0d9488" },
  { name: "Personal Care", type: "discretionary", color: "#db2777" },
  { name: "Savings & Investments", type: "savings", color: "#1d4ed8" },
  { name: "Fees & Charges", type: "essential", color: "#57534e" },
  { name: "Other", type: "discretionary", color: "#9ca3af" },
];

// Keyword rules used to auto-categorize imported transactions by description.
// Matching is case-insensitive substring matching, first match wins, in order.
export const CATEGORY_KEYWORD_RULES: Array<{ category: string; keywords: string[] }> = [
  {
    category: "Zakat & Sadaqa",
    keywords: [
      "zakat",
      "sadaqa",
      "sadaqah",
      "islamic relief",
      "penny appeal",
      "muslim aid",
      "charity",
      "donation",
      "launchgood",
      "masjid",
      "mosque",
    ],
  },
  {
    category: "Income",
    keywords: [
      "payroll",
      "salary",
      "direct dep",
      "paycheck",
      "employer",
      "interest paid",
      "dividend",
      "venmo cashout",
      "tax refund",
      "irs treas",
    ],
  },
  {
    category: "Housing & Rent",
    keywords: ["rent", "mortgage", "landlord", "property mgmt", "apartments", "realty"],
  },
  {
    category: "Utilities",
    keywords: [
      "electric",
      "power co",
      "water dept",
      "gas company",
      "utility",
      "utilities",
      "internet",
      "comcast",
      "xfinity",
      "spectrum",
      "at&t",
      "verizon fios",
      "sewer",
      "waste mgmt",
      "trash",
    ],
  },
  {
    category: "Groceries",
    keywords: [
      "grocery",
      "supermarket",
      "walmart",
      "target",
      "costco",
      "trader joe",
      "whole foods",
      "kroger",
      "safeway",
      "aldi",
      "publix",
      "sprouts",
      "halal market",
      "food market",
    ],
  },
  {
    category: "Transportation",
    keywords: [
      "uber",
      "lyft",
      "gas station",
      "shell",
      "chevron",
      "exxon",
      "bp gas",
      "parking",
      "toll",
      "transit",
      "metro",
      "dmv",
      "auto repair",
      "car wash",
    ],
  },
  {
    category: "Health & Medical",
    keywords: [
      "pharmacy",
      "cvs",
      "walgreens",
      "clinic",
      "medical",
      "dental",
      "doctor",
      "hospital",
      "urgent care",
      "optometry",
    ],
  },
  {
    category: "Insurance",
    keywords: ["insurance", "geico", "progressive ins", "state farm", "allstate"],
  },
  {
    category: "Debt & Loan Payments",
    keywords: ["loan pymt", "loan payment", "student loan", "credit card payment", "auto loan"],
  },
  {
    category: "Dining & Takeout",
    keywords: [
      "restaurant",
      "cafe",
      "coffee",
      "starbucks",
      "mcdonald",
      "chipotle",
      "doordash",
      "grubhub",
      "ubereats",
      "uber eats",
      "pizza",
      "deli",
      "bakery",
      "bar & grill",
    ],
  },
  {
    category: "Entertainment",
    keywords: [
      "netflix",
      "hulu",
      "disney+",
      "spotify",
      "movie",
      "cinema",
      "theater",
      "concert",
      "ticketmaster",
      "steam games",
      "playstation",
      "xbox",
    ],
  },
  {
    category: "Subscriptions",
    keywords: [
      "subscription",
      "monthly membership",
      "prime membership",
      "icloud",
      "google storage",
      "adobe",
      "audible",
      "gym membership",
      "planet fitness",
    ],
  },
  {
    category: "Shopping",
    keywords: ["amazon", "ebay", "best buy", "macy", "nordstrom", "ikea", "home depot", "etsy"],
  },
  {
    category: "Travel",
    keywords: ["airlines", "airbnb", "hotel", "expedia", "booking.com", "delta air", "southwest"],
  },
  {
    category: "Personal Care",
    keywords: ["salon", "barber", "spa", "cosmetics", "sephora"],
  },
  {
    category: "Savings & Investments",
    keywords: ["transfer to savings", "brokerage", "401k", "fidelity", "vanguard", "robinhood", "acorns"],
  },
  {
    category: "Fees & Charges",
    keywords: ["overdraft", "atm fee", "service fee", "maintenance fee", "late fee", "nsf fee"],
  },
];

export function guessCategory(description: string): string {
  const desc = description.toLowerCase();
  for (const rule of CATEGORY_KEYWORD_RULES) {
    if (rule.keywords.some((kw) => desc.includes(kw))) {
      return rule.category;
    }
  }
  return "Other";
}

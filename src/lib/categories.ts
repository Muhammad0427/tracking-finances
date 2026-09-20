export type CategoryType = "income" | "essential" | "discretionary" | "giving" | "savings";

export interface DefaultCategory {
  name: string;
  type: CategoryType;
  color: string;
  /** Seeded monthly budget cap, in dollars. Omitted = "manual budget" (set later on the Budget page). */
  monthlyBudget?: number;
}

// Categories are seeded once, on first run. Users can add/edit/delete afterward,
// and set/change a monthly budget on each from the Budget page at any time.
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "Income", type: "income", color: "#2a78d6" },

  // Bills — each its own card rather than a single lumped "Utilities" bucket
  { name: "DTE Energy", type: "essential", color: "#ca8a04" },
  { name: "Detroit Water", type: "essential", color: "#0284c7" },
  { name: "Comcast Internet", type: "essential", color: "#6366f1" },
  { name: "Metro / MetroPCS", type: "essential", color: "#ec4899" },
  { name: "T-Mobile", type: "essential", color: "#a21caf" },

  // Household
  { name: "Groceries", type: "essential", color: "#1baf7a", monthlyBudget: 600 },
  { name: "Restaurants / Uber Eats", type: "discretionary", color: "#eda100" },
  { name: "Toiletries", type: "essential", color: "#14b8a6" },
  { name: "Household Supplies", type: "essential", color: "#64748b" },
  { name: "Shopping / Online Purchases", type: "discretionary", color: "#e87ba4", monthlyBudget: 250 },
  { name: "Hair & Maintenance", type: "discretionary", color: "#db2777", monthlyBudget: 300 },

  // Vehicle
  { name: "Gas – Car", type: "essential", color: "#92400e" },
  { name: "Oil Changes", type: "essential", color: "#78716c" },
  { name: "Car Repairs & Maintenance", type: "essential", color: "#b45309" },

  // Home
  { name: "Home Repairs & Maintenance", type: "essential", color: "#854d0e" },
  { name: "Housing & Rent", type: "essential", color: "#eb6834" },

  // Everything else
  { name: "Health / Medical", type: "essential", color: "#be123c" },
  { name: "Taxes", type: "essential", color: "#334155" },
  { name: "Debt & Loan Payments", type: "essential", color: "#78350f" },
  { name: "Savings & Investments", type: "savings", color: "#1d4ed8" },
  { name: "Quran", type: "essential", color: "#059669" },
  { name: "Zakat & Sadaqa", type: "giving", color: "#008300" },
  { name: "Insurance", type: "essential", color: "#475569" },
  { name: "Subscriptions", type: "discretionary", color: "#9333ea" },
  { name: "Travel", type: "discretionary", color: "#0d9488" },
  { name: "Transportation", type: "essential", color: "#4a3aa7" },
  { name: "Entertainment", type: "discretionary", color: "#e34948" },
  { name: "Utilities", type: "essential", color: "#0e7490" },
  { name: "Fees & Charges", type: "essential", color: "#57534e" },
  { name: "Other / Miscellaneous", type: "discretionary", color: "#9ca3af" },
];

// Keyword rules used to auto-categorize imported transactions by description.
// Matching is case-insensitive substring matching, first match wins, in order —
// so brand-specific rules (DTE, Comcast, MetroPCS, ...) come before generic
// fallback rules (Utilities, Transportation) that could otherwise catch them.
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
    category: "Quran",
    keywords: ["quran", "qur'an", "islamic bookstore", "quran academy", "quran class"],
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
    category: "DTE Energy",
    keywords: ["dte energy", "dte"],
  },
  {
    category: "Detroit Water",
    keywords: ["detroit water", "dwsd"],
  },
  {
    category: "Comcast Internet",
    keywords: ["comcast", "xfinity"],
  },
  {
    category: "Metro / MetroPCS",
    keywords: ["metropcs", "metro pcs", "metro by t-mobile", "metro by tmobile"],
  },
  {
    category: "T-Mobile",
    keywords: ["t-mobile", "tmobile", "t mobile"],
  },
  {
    category: "Taxes",
    keywords: ["irs", "state tax", "turbotax", "h&r block", "tax payment", "dept of treasury"],
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
    category: "Oil Changes",
    keywords: ["jiffy lube", "valvoline", "take 5 oil", "oil change", "quick lube"],
  },
  {
    category: "Car Repairs & Maintenance",
    keywords: ["auto repair", "mechanic", "tire shop", "midas", "firestone", "pep boys", "meineke"],
  },
  {
    category: "Gas – Car",
    keywords: [
      "gas station",
      "shell",
      "chevron",
      "exxon",
      "bp gas",
      "marathon gas",
      "sunoco",
      "speedway",
      "mobil",
    ],
  },
  {
    category: "Home Repairs & Maintenance",
    keywords: ["home depot", "lowes", "hardware store", "handyman", "plumber", "hvac", "contractor"],
  },
  {
    category: "Health / Medical",
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
    // Checked before Transportation so "Uber Eats" / "Ubereats" (which contain
    // "uber") route here instead of being caught by Transportation's "uber".
    category: "Restaurants / Uber Eats",
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
    category: "Transportation",
    keywords: ["uber", "lyft", "parking", "toll", "transit", "dmv", "car wash"],
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
    category: "Shopping / Online Purchases",
    keywords: ["amazon", "tmall", "ebay", "best buy", "macy", "nordstrom", "ikea", "etsy"],
  },
  {
    category: "Travel",
    keywords: ["airlines", "airbnb", "hotel", "expedia", "booking.com", "delta air", "southwest"],
  },
  {
    category: "Toiletries",
    keywords: ["toiletries", "personal care items"],
  },
  {
    category: "Household Supplies",
    keywords: ["household supplies", "cleaning supplies"],
  },
  {
    category: "Hair & Maintenance",
    keywords: ["salon", "barber", "barbershop", "hair salon", "nail salon", "spa", "cosmetics", "sephora"],
  },
  {
    category: "Savings & Investments",
    keywords: ["transfer to savings", "brokerage", "401k", "fidelity", "vanguard", "robinhood", "acorns"],
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
      "spectrum",
      "at&t",
      "verizon fios",
      "sewer",
      "waste mgmt",
      "trash",
    ],
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
  return "Other / Miscellaneous";
}

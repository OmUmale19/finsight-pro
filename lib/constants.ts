export const APP_NAME = "FinSight Pro";

export const CATEGORY_RULES = [
  { matchers: ["swiggy", "zomato", "ubereats"], category: "Food" },
  { matchers: ["uber", "ola", "rapido", "metro"], category: "Transport" },
  { matchers: ["netflix", "spotify", "youtube", "prime"], category: "Subscriptions" },
  { matchers: ["bigbasket", "blinkit", "zepto", "grofers"], category: "Groceries" },
  { matchers: ["apollo", "pharmacy", "medplus"], category: "Healthcare" },
  { matchers: ["amazon", "flipkart", "myntra"], category: "Shopping" },
  { matchers: ["rent", "maintenance"], category: "Housing" },
  { matchers: ["salary", "refund", "interest"], category: "Income" }
] as const;

export const ESSENTIAL_CATEGORIES = ["Housing", "Groceries", "Transport", "Healthcare", "Utilities", "Insurance"];
export const NON_ESSENTIAL_CATEGORIES = ["Food", "Shopping", "Entertainment", "Subscriptions", "Travel"];

export const DEMO_INSIGHT_MESSAGES = [
  "Weekend spending trends are significantly higher than weekday averages.",
  "Food expenses tend to peak after 9 PM, indicating late-night ordering habits.",
  "Transport outflow has stabilized, improving month-over-month consistency."
];

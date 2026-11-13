/**
 * Quote and contact inquiry models + validation. Shared by the forms (instant
 * feedback) and the API routes (authoritative). Dependency-free.
 */
export const LIMITS = { short: 120, long: 4000, minFillMs: 2500 } as const;

export const QUOTE_FIELDS = [
  "mode", "serviceType", "direction",
  "origin", "originCountry", "destination", "destinationCountry", "readyDate",
  "commodity", "packaging", "pieces", "weight", "weightUnit", "dimensions", "hazardous",
  "name", "company", "email", "phone", "message",
] as const;

export const CONTACT_FIELDS = ["topic", "name", "company", "email", "phone", "message"] as const;

export type QuoteField = (typeof QUOTE_FIELDS)[number];
export type ContactField = (typeof CONTACT_FIELDS)[number];
export type Quote = Record<QuoteField, string>;
export type Contact = Record<ContactField, string>;
export type Errors<K extends string> = Partial<Record<K, string>>;

export const QUOTE_LABELS: Record<QuoteField, string> = {
  mode: "Mode",
  serviceType: "Service type",
  direction: "Direction",
  origin: "Origin (city / postal code)",
  originCountry: "Origin country",
  destination: "Destination (city / postal code)",
  destinationCountry: "Destination country",
  readyDate: "Cargo ready date",
  commodity: "Commodity",
  packaging: "Packaging",
  pieces: "Pieces / units",
  weight: "Total weight",
  weightUnit: "Weight unit",
  dimensions: "Dimensions / volume",
  hazardous: "Dangerous goods",
  name: "Name",
  company: "Company",
  email: "Email",
  phone: "Phone",
  message: "Notes",
};

export const CONTACT_LABELS: Record<ContactField, string> = {
  topic: "Topic",
  name: "Name",
  company: "Company",
  email: "Email",
  phone: "Phone",
  message: "Message",
};

/** Which quote fields belong to which form step (for step-by-step validation). */
export const QUOTE_STEPS: { title: string; fields: QuoteField[] }[] = [
  { title: "Shipment", fields: ["mode", "serviceType", "direction"] },
  { title: "Route", fields: ["origin", "originCountry", "destination", "destinationCountry", "readyDate"] },
  { title: "Cargo", fields: ["commodity", "packaging", "pieces", "weight", "weightUnit", "dimensions", "hazardous"] },
  { title: "Contact", fields: ["name", "company", "email", "phone", "message"] },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\d\s.-]{7,25}$/;

function normalize<K extends string>(raw: Record<string, unknown>, keys: readonly K[]): Record<K, string> {
  const out = {} as Record<K, string>;
  for (const k of keys) out[k] = typeof raw[k] === "string" ? (raw[k] as string).trim() : "";
  return out;
}

export const normalizeQuote = (raw: Record<string, unknown>) => normalize(raw, QUOTE_FIELDS) as Quote;
export const normalizeContact = (raw: Record<string, unknown>) => normalize(raw, CONTACT_FIELDS) as Contact;

function common<K extends string>(v: Record<K | "email" | "phone" | "name", string>, keys: readonly K[], longKeys: K[], e: Errors<string>) {
  if (!v.name) e.name = "Please enter your name.";
  if (!v.email) e.email = "Please enter your email address.";
  else if (!EMAIL_RE.test(v.email)) e.email = "Please enter a valid email address.";
  if (v.phone && !PHONE_RE.test(v.phone)) e.phone = "Please enter a valid phone number.";
  for (const k of keys) {
    const max = longKeys.includes(k) ? LIMITS.long : LIMITS.short;
    if (v[k].length > max) e[k] = `Please keep this under ${max} characters.`;
  }
}

export function validateQuote(q: Quote): Errors<QuoteField> {
  const e: Errors<QuoteField> = {};
  if (!q.mode) e.mode = "Choose how you'd like to ship (or “Not sure yet”).";
  if (!q.origin) e.origin = "Where is the shipment coming from?";
  if (!q.originCountry) e.originCountry = "Origin country is required.";
  if (!q.destination) e.destination = "Where is it going?";
  if (!q.destinationCountry) e.destinationCountry = "Destination country is required.";
  if (!q.commodity) e.commodity = "Briefly describe what you're shipping.";
  if (q.weight && !/^\d+([.,]\d+)?$/.test(q.weight)) e.weight = "Enter a number, e.g. 1200.";
  common(q, QUOTE_FIELDS, ["message", "dimensions", "commodity"], e);
  return e;
}

export function validateContact(c: Contact): Errors<ContactField> {
  const e: Errors<ContactField> = {};
  if (!c.message) e.message = "Please enter a message.";
  common(c, CONTACT_FIELDS, ["message"], e);
  return e;
}

/** Rows for the email body: label + value, skipping empty fields and merging weight + unit. */
export function quoteRows(q: Quote): [string, string][] {
  const rows: [string, string][] = [];
  for (const k of QUOTE_FIELDS) {
    if (k === "weightUnit" || !q[k]) continue;
    rows.push([QUOTE_LABELS[k], k === "weight" ? `${q.weight} ${q.weightUnit}`.trim() : q[k]]);
  }
  return rows;
}

export function contactRows(c: Contact): [string, string][] {
  return CONTACT_FIELDS.filter((k) => c[k]).map((k) => [CONTACT_LABELS[k], c[k]]);
}

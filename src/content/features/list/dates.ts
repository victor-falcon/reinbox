/*
 * Date groups for the thread list ("Today", "Yesterday", "This month", then
 * one per month). Gmail only exposes the date as a localized string in the
 * time cell's `title`, e.g. "mié, 14 oct 2026, 16:20" or
 * "Wed, Oct 14, 2026, 4:20 PM", so it is parsed with month names from Intl.
 */

export interface DateGroup {
  key: string;
  label: string;
  // Weekday and date, only for Today and Yesterday.
  sub?: string;
}

const DAY_MS = 86_400_000;

// Gmail sets <html lang> to its UI language, which may differ from the browser's.
export function locale(): string {
  for (const tag of [document.documentElement.lang, navigator.language]) {
    if (!tag) continue;
    try {
      return Intl.getCanonicalLocales(tag)[0];
    } catch {
      // Not a valid BCP 47 tag: try the next one.
    }
  }
  return "en";
}

function normalizeWord(word: string, lang: string): string {
  return word.normalize("NFC").toLocaleLowerCase(lang).replace(/\.+$/, "");
}

const monthCache = new Map<string, Map<string, number>>();

// Short and long month names, standalone and in context ("oct", "octubre",
// "Okt.", "октября"…), for the UI language with English as a fallback.
function monthNames(lang: string): Map<string, number> {
  let names = monthCache.get(lang);
  if (names) return names;
  names = new Map();
  for (const tag of [lang, "en"]) {
    for (let month = 0; month < 12; month++) {
      const date = new Date(2000, month, 15);
      for (const width of ["short", "long"] as const) {
        const standalone = new Intl.DateTimeFormat(tag, { month: width }).format(date);
        const inContext = new Intl.DateTimeFormat(tag, { day: "numeric", month: width })
          .formatToParts(date)
          .find((part) => part.type === "month")?.value;
        for (const name of [standalone, inContext]) {
          const key = name && normalizeWord(name, tag);
          // Numeric names ("10月") are read as plain numbers instead.
          if (key && !/\d/.test(key) && !names.has(key)) names.set(key, month);
        }
      }
    }
  }
  monthCache.set(lang, names);
  return names;
}

function validDate(year: number, month: number, day: number): Date | undefined {
  const date = new Date(year, month, day);
  return date.getMonth() === month && date.getDate() === day ? date : undefined;
}

/** Parses the date out of Gmail's localized time-cell title. */
export function parseGmailDate(title: string, lang: string): Date | undefined {
  // Drop the time so its digits are not read as the day.
  const text = title.replace(/\d{1,2}[:.]\d{2}(?:[:.]\d{2})?/g, " ");
  const months = monthNames(lang);
  // The last match wins: in "mar, 8 sept 2026" the Spanish weekday "mar"
  // (martes) is also the short name of March.
  let month: number | undefined;
  for (const raw of text.split(/[\s,()/]+/)) {
    const found = months.get(normalizeWord(raw, lang));
    if (found !== undefined) month = found;
  }
  const numbers = text.match(/\d+/g) ?? [];

  const year = numbers.find((n) => n.length === 4);
  if (!year) return undefined;
  const rest = numbers.filter((n) => n !== year && n.length <= 2).map(Number);
  if (month !== undefined) {
    return rest.length > 0 ? validDate(Number(year), month, rest[0]) : undefined;
  }
  // No month name: only year-first numeric dates are unambiguous (2026年10月14日).
  if (numbers[0] === year && rest.length >= 2) return validDate(Number(year), rest[0] - 1, rest[1]);
  return undefined;
}

function capitalize(text: string, lang: string): string {
  return text.charAt(0).toLocaleUpperCase(lang) + text.slice(1);
}

function computeGroup(date: Date, today: Date, lang: string): DateGroup {
  const days = Math.round((today.getTime() - date.getTime()) / DAY_MS);
  const relative = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const weekday = new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long" });

  // Future dates (scheduled, clock skew) count as today.
  if (days <= 0) {
    return { key: "today", label: capitalize(relative.format(0, "day"), lang), sub: weekday.format(date) };
  }
  if (days === 1) {
    return { key: "yesterday", label: capitalize(relative.format(-1, "day"), lang), sub: weekday.format(date) };
  }
  if (date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth()) {
    return { key: "month", label: capitalize(relative.format(0, "month"), lang) };
  }
  const sameYear = date.getFullYear() === today.getFullYear();
  const format = new Intl.DateTimeFormat(lang, sameYear ? { month: "long" } : { month: "long", year: "numeric" });
  return { key: `${date.getFullYear()}-${date.getMonth()}`, label: capitalize(format.format(date), lang) };
}

// Intl formatters are slow to build and every row asks on every DOM change.
const groupCache = new Map<string, DateGroup>();

/** The group `date` (a local midnight) belongs to, relative to `now`. */
export function dateGroup(date: Date, now: Date, lang: string): DateGroup {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const key = `${lang} ${today.getTime()} ${date.getTime()}`;
  let group = groupCache.get(key);
  if (!group) {
    if (groupCache.size > 500) groupCache.clear();
    group = computeGroup(date, today, lang);
    groupCache.set(key, group);
  }
  return group;
}

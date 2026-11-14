import * as chrono from 'chrono-node/en';
import { addHours, format, setHours, setMinutes, startOfDay } from 'date-fns';

// Finds dates in text read from a photo or document (exam timetables, fee
// notices, invitations, bills) and turns each into a draft calendar event.
// Parsing is on-device with chrono; Indian documents are day-first, so the
// British-English parser reads 05/11/2026 as 5 November.

export interface DetectedEvent {
  key: string;
  title: string;
  start: Date;
  end: Date;
  /** False when the document gave only a date; the event then starts at 9:00 AM. */
  hasTime: boolean;
  /** The line the date was found on, shown so the user can check it. */
  sourceLine: string;
}

export const DATE_ONLY_START_HOUR = 9;
const MAX_TITLE = 80;

// Words that sit next to a date but don't describe the event.
const FILLER =
  /\b(last date|due date|on|date|dated|dt|due|by|from|at|is|are|will be|shall be|scheduled|held|to be|starts?|begins?|commences?|till|until|between|venue|deadline|reminder|w\.e\.f)\b/gi;
const LEADING_LINK_WORDS = /^((for|of|the|and|to|in|a|an)\s+)+/i;
/** A written calendar date: 12/12, 12-12-2026, 5 Dec, 5th of December, Dec 5. */
const EXPLICIT_DATE =
  /\d{1,2}[/\-.]\d{1,2}|\d{1,2}(st|nd|rd|th)?\s*(of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}/i;

function cleanTitle(text: string): string {
  const cleaned = text
    .replace(FILLER, ' ')
    .replace(/[|:;,.\-–—_()[\]{}*#"'`~]+/g, ' ')
    .replace(/\b(am|pm|hrs?|ist)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(LEADING_LINK_WORDS, '');
  const letters = (cleaned.match(/[a-z]/gi) ?? []).length;
  if (letters < 3) return '';
  // OCR'd headings are often ALL CAPS; make them readable.
  const titled = cleaned === cleaned.toUpperCase() ? cleaned.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()) : cleaned;
  return titled.charAt(0).toUpperCase() + titled.slice(1, MAX_TITLE);
}

export function extractEvents(text: string, now: Date = new Date()): DetectedEvent[] {
  const lines = text.split(/\r?\n/);
  const offsets: number[] = [];
  let offset = 0;
  for (const line of lines) {
    offsets.push(offset);
    offset += line.length + 1;
  }
  const lineAt = (index: number) => {
    let i = offsets.length - 1;
    while (i > 0 && offsets[i] > index) i--;
    return i;
  };

  const results = chrono.GB.parse(text, now, { forwardDate: true });
  const minYear = now.getFullYear() - 1;
  const maxYear = now.getFullYear() + 5;
  const seen = new Set<string>();
  const events: DetectedEvent[] = [];

  for (const result of results) {
    // Only explicit calendar dates: "12/12/2026", "5 Dec", "Dec 5th". Skips
    // bare times, weekdays and words like "today" that documents use loosely.
    if (!EXPLICIT_DATE.test(result.text) || !result.start.isCertain('day') || !result.start.isCertain('month')) continue;
    const parsed = result.start.date();
    if (parsed.getFullYear() < minYear || parsed.getFullYear() > maxYear) continue;

    const hasTime = result.start.isCertain('hour');
    const start = hasTime ? parsed : setMinutes(setHours(startOfDay(parsed), DATE_ONLY_START_HOUR), 0);
    let end = addHours(start, 1);
    if (result.end) {
      const endDate = result.end.date();
      const candidate = result.end.isCertain('hour') ? endDate : setMinutes(setHours(startOfDay(endDate), 18), 0);
      if (candidate > start) end = candidate;
    }

    const index = lineAt(result.index);
    const line = lines[index].trim();
    const sameLine = cleanTitle(line.replace(result.text, ' '));
    // A date on its own line usually belongs to the heading just above it.
    let title = sameLine;
    for (let back = index - 1; !title && back >= Math.max(0, index - 2); back--) {
      title = cleanTitle(lines[back]);
    }
    title ||= 'Event from document';

    // The same date mentioned twice ("Parent meeting" / "Reminder: Parent meeting") is one event.
    const when = format(start, 'yyyy-MM-dd HH:mm');
    const lower = title.toLowerCase();
    const repeat = events.some(
      (e) =>
        format(e.start, 'yyyy-MM-dd HH:mm') === when &&
        (e.title.toLowerCase().includes(lower) || lower.includes(e.title.toLowerCase())),
    );
    const key = `${when}|${lower}`;
    if (repeat || seen.has(key)) continue;
    seen.add(key);
    events.push({ key, title, start, end, hasTime, sourceLine: line.slice(0, 160) });
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

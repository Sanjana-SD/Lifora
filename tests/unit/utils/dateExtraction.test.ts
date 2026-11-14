import { extractEvents } from '@/utils/dateExtraction';

const NOW = new Date(2026, 10, 14, 10, 0); // Sat 14 Nov 2026
const summary = (text: string) =>
  extractEvents(text, NOW).map((e) => [e.title, e.start.toString().slice(4, 21), e.hasTime]);

describe('extractEvents', () => {
  it('reads an exam timetable: day-first dates, times, and titles from the same line', () => {
    const text = `ST. XAVIER'S COLLEGE
END SEMESTER EXAMINATION TIMETABLE
Mathematics - 02/12/2026 - 10:00 AM
Physics: 05/12/2026 at 2 pm
Chemistry 09-12-2026`;
    expect(summary(text)).toEqual([
      ['Mathematics', 'Dec 02 2026 10:00', true],
      ['Physics', 'Dec 05 2026 14:00', true],
      ['Chemistry', 'Dec 09 2026 09:00', false],
    ]);
  });

  it('takes the title from the heading above a date on its own line', () => {
    const text = `Annual Day Celebration
Date: 20th December 2026
Venue: Main Auditorium`;
    expect(summary(text)).toEqual([['Annual Day Celebration', 'Dec 20 2026 09:00', false]]);
  });

  it('reads written months and fee deadlines', () => {
    const text = `Last date for fee payment: 30 Nov 2026
Electricity bill due by 5 Dec`;
    expect(summary(text)).toEqual([
      ['Fee payment', 'Nov 30 2026 09:00', false],
      ['Electricity bill', 'Dec 05 2026 09:00', false],
    ]);
  });

  it('keeps a date range as one event ending on the last day', () => {
    const [e] = extractEvents('Winter vacation 24/12/2026 - 02/01/2027', NOW);
    expect(e.title).toBe('Winter vacation');
    expect(e.start).toEqual(new Date(2026, 11, 24, 9, 0));
    expect(e.end).toEqual(new Date(2027, 0, 2, 18, 0));
  });

  it('ignores bare times, weekdays, relative words, and implausible years', () => {
    expect(extractEvents('Call me at 10:30 tomorrow or on Friday', NOW)).toEqual([]);
    expect(extractEvents('Established 12/03/1998', NOW)).toEqual([]);
    expect(extractEvents('No dates here at all', NOW)).toEqual([]);
  });

  it('removes duplicates and sorts by date', () => {
    const text = `Parent meeting 10/12/2026
Reminder: Parent meeting 10/12/2026
Sports day 01/12/2026`;
    expect(summary(text).map((s) => s[0])).toEqual(['Sports day', 'Parent meeting']);
  });

  it('tidies ALL-CAPS OCR text and falls back to a generic title', () => {
    expect(summary('PROJECT SUBMISSION 15/12/2026')[0][0]).toBe('Project Submission');
    expect(summary('15/12/2026')[0][0]).toBe('Event from document');
  });
});

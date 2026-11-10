import { router, type Href } from 'expo-router';

import type { EventOccurrence } from '@/types/event';
import { dayKey } from '@/utils/calendarGrid';

export function eventDetailsHref(o: Pick<EventOccurrence, 'seriesId' | 'originalStart'>): Href {
  return `/calendar/event-details?seriesId=${o.seriesId}&start=${encodeURIComponent(o.originalStart.toISOString())}` as Href;
}

export function openOccurrence(o: Pick<EventOccurrence, 'seriesId' | 'originalStart'>) {
  router.push(eventDetailsHref(o));
}

export function addEventOn(day: Date) {
  router.push(`/calendar/add-event?date=${dayKey(day)}` as Href);
}

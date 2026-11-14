import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  router: { push: jest.fn(), back: jest.fn() },
  useFocusEffect: jest.fn(),
}));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///photo.jpg', fileName: 'timetable.jpg' }] }),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: false, canAskAgain: false }),
}));

const mockCreateEvent = jest.fn().mockResolvedValue(1);
jest.mock('@/services/calendarService', () => ({
  EVENT_TITLE_MAX_LENGTH: 120,
  createEvent: (...args: unknown[]) => mockCreateEvent(...args),
}));
jest.mock('@/services/notificationService', () => ({
  ensurePermission: jest.fn().mockResolvedValue('granted'),
  getPermissionState: jest.fn().mockResolvedValue('granted'),
  getExactAlarmState: jest.fn().mockResolvedValue('granted'),
  requestExactAlarms: jest.fn(),
}));

const mockYear = new Date().getFullYear() + 1;
const mockText = `END SEMESTER EXAMINATION
Mathematics - 02/12/${mockYear} - 10:00 AM
Physics: 05/12/${mockYear}
Old notice 01/01/${new Date().getFullYear() - 1}`;

jest.mock('@/services/documentTextService', () => {
  const actual = jest.requireActual('@/services/documentTextService');
  return { ...actual, canReadImages: () => true, canReadPdfs: () => true, readImageText: jest.fn(() => Promise.resolve(mockText)) };
});

import ImportDocumentScreen from '@/app/calendar/import-document';
import { renderWithTheme } from '../../testUtils';

beforeEach(() => jest.clearAllMocks());

describe('Add dates from a document', () => {
  it('finds dates in a photo, lets the user review them, and adds events with a reminder', async () => {
    const { getByText, findByText, getByDisplayValue, getAllByText } = await renderWithTheme(<ImportDocumentScreen />);
    await fireEvent.press(getByText('Choose a photo or screenshot'));

    expect(await findByText('3 dates found')).toBeTruthy();
    expect(getByDisplayValue('Mathematics')).toBeTruthy();
    expect(getByDisplayValue('Physics')).toBeTruthy();
    // A date that has passed is shown but left out by default.
    expect(getAllByText('This date has passed')).toHaveLength(1);

    await fireEvent.changeText(getByDisplayValue('Physics'), 'Physics exam');
    await fireEvent.press(getByText('2 days before'));
    await fireEvent.press(getByText('Add 2 events to calendar'));

    await waitFor(() => expect(mockCreateEvent).toHaveBeenCalledTimes(2));
    const [maths, physics] = mockCreateEvent.mock.calls.map((c) => c[0]);
    expect(maths).toMatchObject({ title: 'Mathematics', notificationOffsetMinutes: 2880 });
    expect(maths.startAt).toEqual(new Date(mockYear, 11, 2, 10, 0));
    expect(physics).toMatchObject({ title: 'Physics exam', notificationOffsetMinutes: 2880 });
    expect(physics.startAt).toEqual(new Date(mockYear, 11, 5, 9, 0));
    expect(physics.description).toContain('timetable.jpg');
    expect(await findByText('Added 2 events')).toBeTruthy();
  });

  it('defaults the reminder to one day before', async () => {
    const { getByText, findByText } = await renderWithTheme(<ImportDocumentScreen />);
    await fireEvent.press(getByText('Choose a photo or screenshot'));
    await findByText('3 dates found');
    await fireEvent.press(getByText('Add 2 events to calendar'));
    await waitFor(() => expect(mockCreateEvent).toHaveBeenCalled());
    expect(mockCreateEvent.mock.calls[0][0].notificationOffsetMinutes).toBe(1440);
  });

  it('explains when camera access is off', async () => {
    const { getByText, findByText } = await renderWithTheme(<ImportDocumentScreen />);
    await fireEvent.press(getByText('Take a photo'));
    expect(await findByText(/Camera access is off/)).toBeTruthy();
  });
});

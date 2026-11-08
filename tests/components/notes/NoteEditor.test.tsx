import { act, fireEvent } from '@testing-library/react-native';
import React from 'react';

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  router: { back: jest.fn() },
}));

jest.mock('@/services/noteService', () => {
  const actual = jest.requireActual('@/services/noteService');
  return {
    ...actual,
    saveNote: jest.fn(),
    discardIfEmpty: jest.fn(),
    deleteNote: jest.fn(),
    setPinned: jest.fn(),
    setFavourite: jest.fn(),
  };
});

import { NoteEditor } from '@/components/notes/NoteEditor';
import * as noteService from '@/services/noteService';
import { renderWithTheme } from '../../testUtils';

const saveNote = noteService.saveNote as jest.Mock;
const discardIfEmpty = noteService.discardIfEmpty as jest.Mock;

const flushPromises = () => act(async () => {});

beforeEach(() => {
  jest.clearAllMocks();
  saveNote.mockImplementation((id: number | null) => Promise.resolve(id ?? 42));
  discardIfEmpty.mockResolvedValue(false);
});

describe('NoteEditor', () => {
  it('saves text typed right before leaving, without waiting for the debounce', async () => {
    const { getByLabelText, unmount } = await renderWithTheme(<NoteEditor initialNote={null} />);
    await fireEvent.changeText(getByLabelText('Note title'), 'Typed then pressed Back');

    expect(saveNote).not.toHaveBeenCalled();
    await unmount();
    await flushPromises();

    expect(saveNote).toHaveBeenCalledTimes(1);
    expect(saveNote).toHaveBeenCalledWith(null, expect.objectContaining({ title: 'Typed then pressed Back' }));
  });

  it('autosaves after the debounce and reuses the new id for later saves', async () => {
    jest.useFakeTimers();
    try {
      const { getByLabelText } = await renderWithTheme(<NoteEditor initialNote={null} />);
      await fireEvent.changeText(getByLabelText('Note title'), 'First');
      await act(async () => {
        await jest.advanceTimersByTimeAsync(700);
      });
      await fireEvent.changeText(getByLabelText('Note body'), 'More');
      await act(async () => {
        await jest.advanceTimersByTimeAsync(700);
      });

      expect(saveNote.mock.calls[0][0]).toBeNull();
      expect(saveNote.mock.calls[1][0]).toBe(42);
    } finally {
      jest.useRealTimers();
    }
  });

  it('asks the service to discard a note left empty on exit', async () => {
    const existing = {
      id: 5,
      title: 'Old',
      body: '',
      colorKey: 'default' as const,
      category: null,
      isPinned: false,
      isFavourite: false,
      createdAt: '',
      updatedAt: '',
    };
    const { getByLabelText, unmount } = await renderWithTheme(<NoteEditor initialNote={existing} />);
    await fireEvent.changeText(getByLabelText('Note title'), '');
    await unmount();
    await flushPromises();

    expect(discardIfEmpty).toHaveBeenCalledWith(5, expect.objectContaining({ title: '', body: '' }));
  });
});

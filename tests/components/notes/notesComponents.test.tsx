import { fireEvent } from '@testing-library/react-native';
import React from 'react';

import { SegmentedControl } from '@/components/common/SegmentedControl';
import { ChecklistCard } from '@/components/notes/ChecklistCard';
import { ChecklistItemRow } from '@/components/notes/ChecklistItemRow';
import { NoteCard } from '@/components/notes/NoteCard';
import type { ChecklistItem, ChecklistSummary } from '@/types/checklist';
import type { Note } from '@/types/note';
import { renderWithTheme } from '../../testUtils';

const note = (overrides: Partial<Note> = {}): Note => ({
  id: 1,
  title: 'Groceries',
  body: 'milk\neggs',
  colorKey: 'green',
  category: 'Personal',
  isPinned: false,
  isFavourite: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const summary = (overrides: Partial<ChecklistSummary> = {}): ChecklistSummary => ({
  id: 1,
  title: 'Shopping List',
  templateKey: 'shopping',
  createdAt: '',
  updatedAt: '',
  totalItems: 5,
  completedItems: 2,
  ...overrides,
});

describe('NoteCard', () => {
  it('shows title, snippet, and category', async () => {
    const { getByText } = await renderWithTheme(<NoteCard note={note()} onPress={() => {}} />);
    expect(getByText('Groceries')).toBeTruthy();
    expect(getByText('milk eggs')).toBeTruthy();
    expect(getByText(/Personal/)).toBeTruthy();
  });

  it('labels pinned and favourite notes for screen readers, not by color alone', async () => {
    const { getByLabelText } = await renderWithTheme(
      <NoteCard note={note({ isPinned: true, isFavourite: true })} onPress={() => {}} />,
    );
    expect(getByLabelText('Note: Groceries, pinned, favourite')).toBeTruthy();
  });

  it('falls back to the first body line as its title', async () => {
    const { getByText } = await renderWithTheme(
      <NoteCard note={note({ title: '', body: 'First line\nSecond' })} onPress={() => {}} />,
    );
    expect(getByText('First line')).toBeTruthy();
    expect(getByText('Second')).toBeTruthy();
  });

  it('calls onPress', async () => {
    const onPress = jest.fn();
    const { getByText } = await renderWithTheme(<NoteCard note={note()} onPress={onPress} />);
    await fireEvent.press(getByText('Groceries'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('ChecklistCard', () => {
  it('shows progress as count and percentage', async () => {
    const { getByText } = await renderWithTheme(<ChecklistCard checklist={summary()} onPress={() => {}} />);
    expect(getByText('2/5 done · 40%')).toBeTruthy();
  });

  it('marks a fully completed checklist', async () => {
    const { getByText } = await renderWithTheme(
      <ChecklistCard checklist={summary({ completedItems: 5 })} onPress={() => {}} />,
    );
    expect(getByText('Completed')).toBeTruthy();
  });

  it('handles an empty checklist', async () => {
    const { getByText, queryByText } = await renderWithTheme(
      <ChecklistCard checklist={summary({ totalItems: 0, completedItems: 0 })} onPress={() => {}} />,
    );
    expect(getByText('No items yet')).toBeTruthy();
    expect(queryByText('Completed')).toBeNull();
  });
});

describe('ChecklistItemRow', () => {
  const item: ChecklistItem = { id: 3, checklistId: 1, label: 'Milk', isCompleted: false, sortOrder: 0 };

  it('toggles and deletes', async () => {
    const onToggle = jest.fn();
    const onDelete = jest.fn();
    const { getByRole, getByLabelText } = await renderWithTheme(
      <ChecklistItemRow item={item} onToggle={onToggle} onRename={() => {}} onDelete={onDelete} />,
    );
    await fireEvent.press(getByRole('checkbox'));
    await fireEvent.press(getByLabelText('Delete item: Milk'));
    expect(onToggle).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
  });

  it('renames on end editing, and reverts instead of saving an empty label', async () => {
    const onRename = jest.fn();
    const { getByLabelText } = await renderWithTheme(
      <ChecklistItemRow item={item} onToggle={() => {}} onRename={onRename} onDelete={() => {}} />,
    );
    const input = getByLabelText('Edit item: Milk');

    await fireEvent.changeText(input, '   ');
    await fireEvent(input, 'endEditing');
    expect(onRename).not.toHaveBeenCalled();
    expect(input.props.value).toBe('Milk');

    await fireEvent.changeText(input, ' Oat milk ');
    await fireEvent(input, 'endEditing');
    expect(onRename).toHaveBeenCalledWith('Oat milk');
  });
});

describe('SegmentedControl', () => {
  it('reports the selected segment', async () => {
    const onChange = jest.fn();
    const options = [
      { value: 'notes', label: 'Notes' },
      { value: 'checklists', label: 'Checklists' },
    ] as const;
    const { getByText, getAllByRole } = await renderWithTheme(
      <SegmentedControl options={options} value="notes" onChange={onChange} />,
    );
    expect(getAllByRole('tab')[0].props.accessibilityState.selected).toBe(true);
    await fireEvent.press(getByText('Checklists'));
    expect(onChange).toHaveBeenCalledWith('checklists');
  });
});

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { EmptyState } from '@/components/common/EmptyState';
import { ThemeProvider } from '@/hooks/useTheme';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('EmptyState', () => {
  it('renders title and description', async () => {
    const { getByText } = await renderWithTheme(
      <EmptyState title="Nothing here yet" description="Tap + to add one." />,
    );
    expect(getByText('Nothing here yet')).toBeTruthy();
    expect(getByText('Tap + to add one.')).toBeTruthy();
  });

  it('fires the action callback when its button is pressed', async () => {
    const onAction = jest.fn();
    const { getByText } = await renderWithTheme(
      <EmptyState title="No notes" actionLabel="Add Note" onAction={onAction} />,
    );
    fireEvent.press(getByText('Add Note'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('omits the action button when no handler is given', async () => {
    const { queryByText } = await renderWithTheme(<EmptyState title="No notes" />);
    expect(queryByText('Add Note')).toBeNull();
  });
});

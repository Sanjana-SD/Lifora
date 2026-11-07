import { fireEvent } from '@testing-library/react-native';
import React from 'react';

import { Button } from '@/components/common/Button';
import { renderWithTheme } from '../testUtils';

describe('Button', () => {
  it('renders its label', async () => {
    const { getByText } = await renderWithTheme(<Button label="Add Expense" onPress={() => {}} />);
    expect(getByText('Add Expense')).toBeTruthy();
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    const { getByText } = await renderWithTheme(<Button label="Save" onPress={onPress} />);
    fireEvent.press(getByText('Save'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    const { getByText } = await renderWithTheme(<Button label="Save" onPress={onPress} disabled />);
    fireEvent.press(getByText('Save'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

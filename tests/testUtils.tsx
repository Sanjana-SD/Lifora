import { render } from '@testing-library/react-native';
import React from 'react';

import { ThemeProvider } from '@/hooks/useTheme';

export function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

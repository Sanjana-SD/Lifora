import React from 'react';

import { Button } from './Button';
import { Dialog } from './Dialog';

export type EditScope = 'this' | 'all';

interface ScopeDialogProps {
  visible: boolean;
  title: string;
  destructive?: boolean;
  onChoose: (scope: EditScope) => void;
  onCancel: () => void;
}

/** "This event" vs "All events in the series" for recurring events (PRD 2.4). */
export function ScopeDialog({ visible, title, destructive = false, onChoose, onCancel }: ScopeDialogProps) {
  const variant = destructive ? 'danger' : 'primary';
  return (
    <Dialog visible={visible} title={title} message="This is a repeating event." onRequestClose={onCancel}>
      <Button label="This event only" variant={variant} onPress={() => onChoose('this')} />
      <Button label="All events in the series" variant="secondary" onPress={() => onChoose('all')} />
      <Button label="Cancel" variant="ghost" onPress={onCancel} />
    </Dialog>
  );
}

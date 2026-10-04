import type { Reminder } from '../../types';

export type ReminderPermission = {
  status: 'granted' | 'undetermined' | 'denied' | 'unavailable';
  canAskAgain: boolean;
};
export type ReminderMessage = { title: string; body: string; route: '/meditate' | '/sleep' | '/breathing' };
export type ReminderListeners = {
  onReceive: (message: ReminderMessage) => void;
  onOpen: (route: ReminderMessage['route']) => void;
};
export interface ReminderDelivery {
  kind: 'native' | 'web';
  getPermission(): Promise<ReminderPermission>;
  requestPermission(): Promise<ReminderPermission>;
  sync(reminders: Reminder[]): Promise<void>;
  test(): Promise<void>;
  subscribe(listeners: ReminderListeners): () => void;
  openSettings(): Promise<void>;
}

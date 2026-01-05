import { createStore } from 'solid-js/store';

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'warning' | 'error';
}

const [notifications, setNotifications] = createStore<Notification[]>([]);

let nextId = 0;

export const useNotifications = () => notifications;

export const addNotification = (message: string, type: 'success' | 'warning' | 'error') => {
  const id = nextId++;
  setNotifications([...notifications, { id, message, type }]);
  setTimeout(() => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, 3000);
};

export const NotificationService = {
  showSuccess: (msg: string) => addNotification(msg, 'success'),
  showWarning: (msg: string) => addNotification(msg, 'warning'),
  showError: (msg: string) => addNotification(msg, 'error'),
};

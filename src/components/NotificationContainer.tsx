import { Component, For } from 'solid-js';
import { useNotifications } from '../store/notificationStore';
import styles from './NotificationContainer.module.css';

const NotificationContainer: Component = () => {
  const notifications = useNotifications();

  return (
    <div class={styles.container}>
      <For each={notifications}>
        {(item) => (
          <div class={`${styles.notification} ${styles[item.type]}`}>
            <div class={styles.content}>
              {item.message}
            </div>
            <div class={styles.close}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </div>
          </div>
        )}
      </For>
    </div>
  );
};

export default NotificationContainer;

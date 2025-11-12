import { createContext, ReactNode, useContext, useState } from 'react';

type NotificationContextValue = {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  lastReadAt: Date;
  markAsRead: (readTime?: Date) => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadAt, setLastReadAt] = useState<Date>(new Date(0));

  function markAsRead(readTime?: Date) {
    const timestamp = readTime ?? new Date();
    setLastReadAt(timestamp);
    setUnreadCount(0);
  }

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        setUnreadCount,
        lastReadAt,
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return ctx;
}

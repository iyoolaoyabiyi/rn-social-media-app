import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type NotificationContextValue = {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  lastReadAt: Date;
  markAsRead: (readTime?: Date) => void;
  hydrated: boolean;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

const STORAGE_KEY = '@framez:last_read_at';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadAt, setLastReadAt] = useState<Date>(new Date(0));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setLastReadAt(new Date(stored));
        }
      } catch (err) {
        console.log('Failed to load notification timestamp', err);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const markAsRead = useCallback(async (readTime?: Date) => {
    const base = readTime ?? new Date();
    const timestamp = new Date(base.getTime() + 1); // ensure next query excludes current likes
    setLastReadAt(timestamp);
    setUnreadCount(0);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, timestamp.toISOString());
    } catch (err) {
      console.log('Failed to persist lastReadAt', err);
    }
  }, []);

  const value = useMemo(
    () => ({
      unreadCount,
      setUnreadCount,
      lastReadAt,
      markAsRead,
      hydrated,
    }),
    [unreadCount, lastReadAt, markAsRead, hydrated]
  );

  return (
    <NotificationContext.Provider value={value}>
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

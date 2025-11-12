import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';

type RefreshScope = 'posts' | 'notifications';

type RefreshContextValue = {
  tokens: Record<RefreshScope, number>;
  triggerRefresh: (scope: RefreshScope) => void;
};

const RefreshContext = createContext<RefreshContextValue | undefined>(
  undefined
);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<Record<RefreshScope, number>>({
    posts: 0,
    notifications: 0,
  });

  const value = useMemo(
    () => ({
      tokens,
      triggerRefresh: (scope: RefreshScope) =>
        setTokens((prev) => ({
          ...prev,
          [scope]: prev[scope] + 1,
        })),
    }),
    [tokens]
  );

  return (
    <RefreshContext.Provider value={value}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh(scope: RefreshScope) {
  const context = useContext(RefreshContext);

  if (!context) {
    throw new Error('useRefresh must be used within RefreshProvider');
  }

  return {
    refreshToken: context.tokens[scope],
    triggerRefresh: () => context.triggerRefresh(scope),
  };
}

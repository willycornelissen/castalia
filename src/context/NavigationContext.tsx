import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { siteConfig } from '@/config/site.config';
import {
  getNavigationMenu,
  saveNavigationMenu,
} from '@/services/navigation.service';
import type { NavItem } from '@/types/site';

interface NavigationContextValue {
  items: NavItem[];
  loading: boolean;
  refreshNavigation: () => Promise<void>;
  updateNavigation: (nextItems: NavItem[]) => Promise<NavItem[]>;
}

const fallbackContext: NavigationContextValue = {
  items: siteConfig.navigation,
  loading: false,
  refreshNavigation: async () => {},
  updateNavigation: saveNavigationMenu,
};

const NavigationContext = createContext<NavigationContextValue>(fallbackContext);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NavItem[]>(() =>
    siteConfig.navigation.map((item) => ({ ...item }))
  );
  const [loading, setLoading] = useState(true);

  const refreshNavigation = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await getNavigationMenu();
      setItems(loaded);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const loaded = await getNavigationMenu();
        if (active) setItems(loaded);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const updateNavigation = useCallback(async (nextItems: NavItem[]) => {
    const saved = await saveNavigationMenu(nextItems);
    setItems(saved);
    return saved;
  }, []);

  return (
    <NavigationContext.Provider
      value={{ items, loading, refreshNavigation, updateNavigation }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  return useContext(NavigationContext);
}

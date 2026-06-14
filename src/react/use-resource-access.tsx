'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { resolveResourceIdForPath } from '../core/catalogue';
import { getResourceAccessConfig } from './configure';

export type CanAccessPathOptions = {
  strict?: boolean;
};

export type ResourceAccessContextValue = {
  loading: boolean;
  error: string | null;
  allowedIds: Set<string>;
  refresh: () => Promise<void>;
  canAccessResource: (resourceId: string) => boolean;
  canAccessPath: (href: string, options?: CanAccessPathOptions) => boolean;
};

const ResourceAccessContext = createContext<ResourceAccessContextValue | null>(null);

function useResourceAccessState(): ResourceAccessContextValue {
  const [allowedIds, setAllowedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const cfg = getResourceAccessConfig();
    const headers = cfg.getAuthHeaders();
    const userId = headers['X-User-Id'] ?? headers['x-user-id'];

    if (!userId && !headers.Authorization) {
      setAllowedIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const mePath = cfg.meEndpoint ?? '/resource-access/me';
      const res = await fetch(`${cfg.getApiBaseUrl()}${mePath}`, { headers });
      if (!res.ok) {
        throw new Error(`Failed to load resource access (${res.status})`);
      }
      const data = (await res.json()) as { allowed_resource_ids: string[] };
      setAllowedIds(new Set(data.allowed_resource_ids ?? []));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load resource access');
      setAllowedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const canAccessResource = useCallback(
    (resourceId: string) => allowedIds.has(resourceId),
    [allowedIds],
  );

  const canAccessPath = useCallback(
    (href: string, options?: CanAccessPathOptions) => {
      const cfg = getResourceAccessConfig();
      const resourceId = resolveResourceIdForPath(href, cfg.sidebarResourceByPath);
      if (!resourceId) {
        return true;
      }
      if (loading) {
        return options?.strict ? false : true;
      }
      return canAccessResource(resourceId);
    },
    [canAccessResource, loading],
  );

  return {
    loading,
    error,
    allowedIds,
    refresh,
    canAccessResource,
    canAccessPath,
  };
}

export function ResourceAccessProvider({ children }: { children: ReactNode }) {
  const value = useResourceAccessState();
  return (
    <ResourceAccessContext.Provider value={value}>{children}</ResourceAccessContext.Provider>
  );
}

export function useResourceAccess(): ResourceAccessContextValue {
  const context = useContext(ResourceAccessContext);
  if (context) {
    return context;
  }
  return useResourceAccessState();
}

export function useMemoizedSidebarFilter<T extends { href?: string; children?: T[] }>(
  items: T[],
  canAccessPath: (href: string) => boolean,
): T[] {
  return useMemo(() => filterSidebarItems(items, canAccessPath), [items, canAccessPath]);
}

function filterSidebarItems<T extends { href?: string; children?: T[] }>(
  items: T[],
  canAccessPath: (href: string) => boolean,
): T[] {
  return items
    .map((item) => {
      if (item.children?.length) {
        const children = filterSidebarItems(item.children, canAccessPath);
        if (children.length === 0) {
          return null;
        }
        return { ...item, children };
      }
      if (item.href && item.href !== '#') {
        return canAccessPath(item.href) ? item : null;
      }
      return item;
    })
    .filter(Boolean) as T[];
}

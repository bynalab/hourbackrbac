import type { ResourceCatalogueConfig } from '../core/types';

export interface ResourceAccessClientConfig {
  /** Base API URL including prefix, e.g. `http://localhost:4000/api` */
  getApiBaseUrl: () => string;
  /** Auth headers for API calls, e.g. `{ 'X-User-Id': userId }` or `{ Authorization: 'Bearer ...' }` */
  getAuthHeaders: () => Record<string, string>;
  /** Path for current user's allowed ids (default `/resource-access/me`) */
  meEndpoint?: string;
  /** Admin API paths — defaults match package Nest controllers under `admin/resource-access` */
  adminEndpoints?: {
    getUserAccess: (userId: string) => string;
    toggle: (userId: string) => string;
    batch?: (userId: string) => string;
  };
  /** From host catalogue — used for route guards */
  sidebarResourceByPath: Record<string, string>;
  /** Optional toast/error handlers for admin editor */
  onError?: (message: string) => void;
}

let config: ResourceAccessClientConfig | null = null;

export function configureResourceAccess(next: ResourceAccessClientConfig): void {
  config = next;
}

export function getResourceAccessConfig(): ResourceAccessClientConfig {
  if (!config) {
    throw new Error(
      'Resource access not configured. Call configureResourceAccess() in your app setup.',
    );
  }
  return config;
}

export function isResourceAccessConfigured(): boolean {
  return config !== null;
}

export type { ResourceCatalogueConfig };

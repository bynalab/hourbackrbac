'use client';

import type { ReactNode } from 'react';
import { useResourceAccess } from './use-resource-access';

export interface CanAccessProps {
  resourceId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function CanAccess({ resourceId, children, fallback = null }: CanAccessProps) {
  const { canAccessResource, loading } = useResourceAccess();

  if (loading) {
    return <>{fallback}</>;
  }

  if (!canAccessResource(resourceId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

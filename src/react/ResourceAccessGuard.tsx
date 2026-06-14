'use client';

import { Suspense, useEffect, useMemo, type ReactNode } from 'react';
import { isProtectedPath } from '../core/catalogue';
import { getResourceAccessConfig } from './configure';
import { useResourceAccess } from './use-resource-access';

const loadingFallback = (
  <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: 40,
          height: 40,
          border: '2px solid #e5e7eb',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px',
        }}
      />
      <p style={{ color: '#4b5563', fontSize: 14 }}>Checking permissions…</p>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function ResourceAccessGuardInner({
  children,
  accessDeniedPath = '/access-denied',
}: {
  children: ReactNode;
  accessDeniedPath?: string;
}) {
  const pathname =
    typeof window !== 'undefined' ? window.location.pathname : '/';
  const { canAccessPath, loading } = useResourceAccess();
  const cfg = getResourceAccessConfig();

  const protectedRoute = isProtectedPath(pathname, cfg.sidebarResourceByPath);
  const allowed = useMemo(
    () => !protectedRoute || canAccessPath(pathname, { strict: true }),
    [protectedRoute, canAccessPath, pathname],
  );

  useEffect(() => {
    if (!loading && protectedRoute && !allowed && typeof window !== 'undefined') {
      const target = `${accessDeniedPath}?path=${encodeURIComponent(pathname)}`;
      window.location.replace(target);
    }
  }, [loading, protectedRoute, allowed, pathname, accessDeniedPath]);

  if (protectedRoute && loading) {
    return loadingFallback;
  }

  if (protectedRoute && !allowed) {
    return loadingFallback;
  }

  return <>{children}</>;
}

/** Next.js: pass `usePathname` result via wrapper in host app for SSR-safe routing. */
export function ResourceAccessGuard({
  children,
  pathname,
  onAccessDenied,
  accessDeniedPath = '/access-denied',
}: {
  children: ReactNode;
  /** Required for Next.js — host passes `usePathname()` */
  pathname?: string;
  onAccessDenied?: (pathname: string) => void;
  accessDeniedPath?: string;
}) {
  if (pathname !== undefined && onAccessDenied) {
    return (
      <PathAwareResourceAccessGuard
        pathname={pathname}
        onAccessDenied={onAccessDenied}
        accessDeniedPath={accessDeniedPath}
      >
        {children}
      </PathAwareResourceAccessGuard>
    );
  }

  return (
    <Suspense fallback={loadingFallback}>
      <ResourceAccessGuardInner accessDeniedPath={accessDeniedPath}>
        {children}
      </ResourceAccessGuardInner>
    </Suspense>
  );
}

function PathAwareResourceAccessGuard({
  children,
  pathname,
  onAccessDenied,
  accessDeniedPath,
}: {
  children: ReactNode;
  pathname: string;
  onAccessDenied: (pathname: string) => void;
  accessDeniedPath?: string;
}) {
  const { canAccessPath, loading } = useResourceAccess();
  const cfg = getResourceAccessConfig();
  const protectedRoute = isProtectedPath(pathname, cfg.sidebarResourceByPath);
  const allowed = useMemo(
    () => !protectedRoute || canAccessPath(pathname, { strict: true }),
    [protectedRoute, canAccessPath, pathname],
  );

  useEffect(() => {
    if (!loading && protectedRoute && !allowed) {
      onAccessDenied(pathname);
    }
  }, [loading, protectedRoute, allowed, pathname, onAccessDenied]);

  if (protectedRoute && (loading || !allowed)) {
    return loadingFallback;
  }

  return <>{children}</>;
}

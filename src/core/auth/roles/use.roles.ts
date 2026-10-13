import { useCallback, useMemo } from 'react';

import { useAuth } from '../components/use.auth';
import {
  getRoles,
  hasAllRoles,
  hasAnyRole,
  hasRoles,
  type IRoleCheckOptions,
  type RoleQuery,
} from './roles';

/**
 * Roles of the logged-in user + checks (re-renders when `userMeta` changes).
 *
 * ```tsx
 * const { can } = useRoles();
 * if (can('admin:user || dev:user')) …
 * ```
 */
export const useRoles = (options?: IRoleCheckOptions) => {
  const { userMeta } = useAuth();
  const superUserBypass = options?.superUserBypass;

  const roles = useMemo(() => getRoles(userMeta), [userMeta]);
  const can = useCallback(
    (query: RoleQuery | null | undefined) => hasRoles(userMeta, query, { superUserBypass }),
    [userMeta, superUserBypass]
  );
  const canAll = useCallback(
    (list: readonly RoleQuery[]) => hasAllRoles(userMeta, list, { superUserBypass }),
    [userMeta, superUserBypass]
  );
  const canAny = useCallback(
    (list: readonly RoleQuery[]) => hasAnyRole(userMeta, list, { superUserBypass }),
    [userMeta, superUserBypass]
  );

  return { roles, can, canAll, canAny, superUser: Boolean(userMeta?.superUser) };
};

/** Shortcut: `const isAdmin = useHasRoles('admin:user');` */
export const useHasRoles = (query: RoleQuery | null | undefined, options?: IRoleCheckOptions) =>
  useRoles(options).can(query);

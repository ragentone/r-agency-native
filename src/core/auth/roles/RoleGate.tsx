import type { ReactNode } from 'react';

import type { IRoleCheckOptions, RoleQuery } from './roles';
import { useHasRoles } from './use.roles';

interface IProps extends IRoleCheckOptions {
  /** e.g. `'admin:user || dev:user'` or `{ and: ['dev:user', { not: 'banned:user' }] }`. */
  roles: RoleQuery;
  children: ReactNode;
  /** Rendered when the check fails (default nothing). */
  fallback?: ReactNode;
}

/** Renders `children` only for users whose roles satisfy `roles`. */
export const RoleGate = ({ roles, children, fallback = null, ...options }: IProps) =>
  useHasRoles(roles, options) ? children : fallback;

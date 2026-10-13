/**
 * User role registry (core): apps register the roles they understand, the admin area
 * (`src/module/admin`) offers exactly these roles in its select fields.
 *
 * ```ts
 * // apps/timeline/app.tsx
 * Core.roles.registerGroup('timeline', { label: 'timeline:roles.group', sortOrder: 50 });
 * Core.roles.register({
 *   role: 'timeline:moderator:user',
 *   label: 'timeline:roles.moderator.label',
 *   description: 'timeline:roles.moderator.description',
 *   group: 'timeline',
 * });
 *
 * Core.roles.getRoles();              // every registered role, sorted by group + sortOrder
 * Core.roles.get('admin:user');       // definition or undefined
 * const { roles, groups } = useUserRoleRegistry(); // React, re-renders on (un)register
 * ```
 *
 * Roles are strings `scope:…:name` (2–4 segments, lower case), same rule as the backend.
 * Registering only describes a role – who has it is stored on the user (`userRole`).
 */
import { useSyncExternalStore } from 'react';

export const USER_ROLE_PATTERN = /^[a-z0-9][a-z0-9_.-]{0,48}(:[a-z0-9][a-z0-9_.-]{0,48}){1,3}$/;

export const USER_ROLE_GROUP_SYSTEM = 'system';

export interface IUserRoleDefinition {
  /** e.g. `timeline:moderator:user`. */
  role: string;
  /** Translation key (`ns:key`) or plain text. */
  label: string;
  /** Translation key or plain text. */
  description?: string;
  /** Group in select fields – default: first segment (`timeline:moderator:user` → `timeline`). */
  group?: string;
  sortOrder?: number;
  /** `false` → shown, but can't be granted / taken in the admin area (e.g. set by the system). */
  assignable?: boolean;
}

export interface IUserRoleGroupConfig {
  /** Translation key or plain text. */
  label: string;
  sortOrder?: number;
}

export interface IUserRoleManager {
  /** Registers one or more roles – returns an unregister function. Same role replaces. */
  register(definition: IUserRoleDefinition | IUserRoleDefinition[]): () => void;
  unregister(role: string): void;
  get(role: string): IUserRoleDefinition | undefined;
  has(role: string): boolean;
  /** Sorted: group sortOrder → role sortOrder → role. */
  getRoles(): IUserRoleDefinition[];
  /** Only roles the admin area may grant / take. */
  getAssignableRoles(): IUserRoleDefinition[];
  registerGroup(id: string, config: IUserRoleGroupConfig): void;
  getGroups(): Record<string, IUserRoleGroupConfig>;
  /** Group id of a role (explicit `group` or first segment). */
  groupOf(role: string): string;
  subscribe(listener: () => void): () => void;
  /** Snapshot version for `useSyncExternalStore`. */
  getVersion(): number;
}

const definitions = new Map<string, IUserRoleDefinition>();
const groups: Record<string, IUserRoleGroupConfig> = {
  [USER_ROLE_GROUP_SYSTEM]: { label: 'auth:roles.groups.system', sortOrder: 0 },
};
const listeners = new Set<() => void>();
let version = 0;
let sorted: IUserRoleDefinition[] = [];

const firstSegment = (role: string) => role.split(':')[0] ?? role;

const groupOf = (role: string): string => definitions.get(role)?.group ?? firstSegment(role);

const changed = () => {
  version += 1;
  const groupOrder = (id: string) => groups[id]?.sortOrder ?? 100;
  sorted = [...definitions.values()].sort(
    (a, b) =>
      groupOrder(groupOf(a.role)) - groupOrder(groupOf(b.role)) ||
      groupOf(a.role).localeCompare(groupOf(b.role)) ||
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      a.role.localeCompare(b.role)
  );
  listeners.forEach(listener => listener());
};

const UserRoleManager: IUserRoleManager = {
  register(definition) {
    const list = Array.isArray(definition) ? definition : [definition];
    const stored: IUserRoleDefinition[] = [];
    list.forEach(item => {
      const role = item.role.trim().toLowerCase();
      if (!USER_ROLE_PATTERN.test(role)) {
        console.warn(`[roles] invalid role "${item.role}" – expected scope:…:name`);
        return;
      }
      const entry = { ...item, role };
      definitions.set(role, entry);
      stored.push(entry);
    });
    changed();
    return () => {
      // Only removes what this call registered (a later re-register wins).
      stored.forEach(entry => {
        if (definitions.get(entry.role) === entry) definitions.delete(entry.role);
      });
      changed();
    };
  },
  unregister(role) {
    if (definitions.delete(role)) changed();
  },
  get: role => definitions.get(role),
  has: role => definitions.has(role),
  getRoles: () => sorted,
  getAssignableRoles: () => sorted.filter(item => item.assignable !== false),
  registerGroup(id, config) {
    groups[id] = config;
    changed();
  },
  getGroups: () => groups,
  groupOf,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getVersion: () => version,
};

// System roles (backend `UserAccessRole` + Google sign-in).
UserRoleManager.register([
  {
    role: 'default:user',
    label: 'auth:roles.items.default.label',
    description: 'auth:roles.items.default.description',
    group: USER_ROLE_GROUP_SYSTEM,
    sortOrder: 0,
  },
  {
    role: 'admin:user',
    label: 'auth:roles.items.admin.label',
    description: 'auth:roles.items.admin.description',
    group: USER_ROLE_GROUP_SYSTEM,
    sortOrder: 10,
  },
  {
    role: 'dev:user',
    label: 'auth:roles.items.dev.label',
    description: 'auth:roles.items.dev.description',
    group: USER_ROLE_GROUP_SYSTEM,
    sortOrder: 20,
  },
  {
    role: 'google:user',
    label: 'auth:roles.items.google.label',
    description: 'auth:roles.items.google.description',
    group: USER_ROLE_GROUP_SYSTEM,
    sortOrder: 30,
    assignable: false,
  },
]);

/** Registered roles + groups – re-renders when apps (un)register roles. */
export const useUserRoleRegistry = () => {
  useSyncExternalStore(UserRoleManager.subscribe, UserRoleManager.getVersion);
  return {
    roles: UserRoleManager.getRoles(),
    assignable: UserRoleManager.getAssignableRoles(),
    groups: UserRoleManager.getGroups(),
    get: UserRoleManager.get,
    groupOf: UserRoleManager.groupOf,
  };
};

export { UserRoleManager };

/**
 * Role checks with AND / OR / NOT logic for `userMeta.role` (backend roles like `admin:user`, `dev:user`).
 *
 * Queries can be written as expression string or as object:
 *
 * ```ts
 * hasRoles(user, 'admin:user');                                   // single role
 * hasRoles(user, 'admin:user && dev:user');                       // AND
 * hasRoles(user, 'admin:user || dev:user');                       // OR
 * hasRoles(user, 'admin:user || (dev:user && !google:user)');      // nested + NOT
 * hasRoles(user, 'admin:* AND NOT banned:user');                  // wildcard + keywords
 * hasRoles(user, ['admin:user', 'dev:user']);                     // array = OR (one of)
 * hasRoles(user, { and: ['dev:user', { or: ['admin:user', 'tester:user'] }] });
 * hasRoles(user, { not: 'banned:user' });
 * ```
 *
 * Operators: `&&` `&` `AND` · `||` `|` `OR` · `!` `NOT` · `( )`. Precedence: NOT > AND > OR.
 * Wildcards: `admin:*` matches every `admin:…` role, `*` matches any role.
 */

/** Object form of a role query. */
export type RoleQuery =
  | string
  | readonly RoleQuery[]
  | { and: readonly RoleQuery[] }
  | { or: readonly RoleQuery[] }
  | { not: RoleQuery };

export interface IRoleCheckOptions {
  /** `superUser` passes every check (default `false`). */
  superUserBypass?: boolean;
}

/** Anything that carries roles: `userMeta`, a role list or a single role string. */
export type RoleSource =
  | { role?: unknown; roles?: unknown; userRole?: unknown; superUser?: boolean | null }
  | readonly string[]
  | string
  | null
  | undefined;

// ---------------------------------------------------------------- normalize

const splitRoles = (value: string) =>
  value
    .split(/[\s,;]+/)
    .map(role => role.trim())
    .filter(Boolean);

const collect = (value: unknown, out: Set<string>) => {
  if (!value) return;
  if (typeof value === 'string') {
    splitRoles(value).forEach(role => out.add(role));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(item => collect(item, out));
    return;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    // e.g. `{ alias: 'admin:user' }` or `{ name: … }` from other endpoints.
    const named = record.alias ?? record.name ?? record.role ?? record.key;
    if (named !== undefined) {
      collect(named, out);
      return;
    }
    // Role map as the backend sends it (`userMeta.role` = entity `userRole`):
    // `{ 'default:user': true, 'admin:user': true, 'dev:user': false }` → active roles only.
    Object.entries(record).forEach(([role, active]) => {
      if (active === true && role.trim()) out.add(role.trim());
    });
  }
};

/** All roles of a user / list as unique, trimmed strings. */
export const getRoles = (source: RoleSource): string[] => {
  const out = new Set<string>();
  if (typeof source === 'string' || Array.isArray(source)) {
    collect(source, out);
  } else if (source && typeof source === 'object') {
    const record = source as Exclude<RoleSource, string | readonly string[] | null | undefined>;
    collect(record.role, out);
    collect(record.roles, out);
    collect(record.userRole, out);
  }
  return [...out];
};

const isSuperUser = (source: RoleSource) =>
  Boolean(
    source &&
    typeof source === 'object' &&
    !Array.isArray(source) &&
    'superUser' in source &&
    source.superUser
  );

// ---------------------------------------------------------------- expression parser

type RoleNode =
  | { type: 'role'; pattern: string }
  | { type: 'and' | 'or'; nodes: RoleNode[] }
  | { type: 'not'; node: RoleNode }
  | { type: 'true' };

type Token = { type: 'and' | 'or' | 'not' | '(' | ')' } | { type: 'role'; value: string };

const tokenize = (input: string): Token[] => {
  const tokens: Token[] = [];
  const re = /\s*(&&|\|\||[&|!()]|[^\s&|!()]+)/y;
  let pos = 0;
  while (pos < input.length) {
    re.lastIndex = pos;
    const match = re.exec(input);
    if (!match) {
      if (input.slice(pos).trim())
        throw new RoleQueryError(`Unexpected input at ${pos}: "${input}"`);
      break;
    }
    pos = re.lastIndex;
    const raw = match[1];
    const upper = raw.toUpperCase();
    if (raw === '&&' || raw === '&' || upper === 'AND') tokens.push({ type: 'and' });
    else if (raw === '||' || raw === '|' || upper === 'OR') tokens.push({ type: 'or' });
    else if (raw === '!' || upper === 'NOT') tokens.push({ type: 'not' });
    else if (raw === '(' || raw === ')') tokens.push({ type: raw });
    else tokens.push({ type: 'role', value: raw });
  }
  return tokens;
};

export class RoleQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoleQueryError';
  }
}

const parse = (input: string): RoleNode => {
  const tokens = tokenize(input);
  if (tokens.length === 0) return { type: 'true' };
  let pos = 0;
  const peek = () => tokens[pos];

  const parseOr = (): RoleNode => {
    const nodes = [parseAnd()];
    while (peek()?.type === 'or') {
      pos += 1;
      nodes.push(parseAnd());
    }
    return nodes.length === 1 ? nodes[0] : { type: 'or', nodes };
  };
  const parseAnd = (): RoleNode => {
    const nodes = [parseUnary()];
    while (peek()?.type === 'and') {
      pos += 1;
      nodes.push(parseUnary());
    }
    return nodes.length === 1 ? nodes[0] : { type: 'and', nodes };
  };
  const parseUnary = (): RoleNode => {
    if (peek()?.type === 'not') {
      pos += 1;
      return { type: 'not', node: parseUnary() };
    }
    return parsePrimary();
  };
  const parsePrimary = (): RoleNode => {
    const token = tokens[pos++];
    if (!token) throw new RoleQueryError(`Unexpected end of role query: "${input}"`);
    if (token.type === '(') {
      const node = parseOr();
      if (tokens[pos++]?.type !== ')')
        throw new RoleQueryError(`Missing ")" in role query: "${input}"`);
      return node;
    }
    if (token.type === 'role') return { type: 'role', pattern: token.value };
    throw new RoleQueryError(`Unexpected "${token.type}" in role query: "${input}"`);
  };

  const node = parseOr();
  if (pos < tokens.length)
    throw new RoleQueryError(`Unexpected "${tokens[pos].type}" in role query: "${input}"`);
  return node;
};

const parsed = new Map<string, RoleNode>();

/** Parses (and caches) an expression – throws `RoleQueryError` on syntax errors. */
export const parseRoleQuery = (input: string): RoleNode => {
  let node = parsed.get(input);
  if (!node) {
    node = parse(input);
    parsed.set(input, node);
  }
  return node;
};

// ---------------------------------------------------------------- matching

const wildcard = new Map<string, RegExp>();

const matchesPattern = (roles: ReadonlySet<string>, pattern: string) => {
  if (!pattern.includes('*')) return roles.has(pattern);
  if (pattern === '*') return roles.size > 0;
  let re = wildcard.get(pattern);
  if (!re) {
    re = new RegExp(
      `^${pattern
        .split('*')
        .map(part => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
        .join('.*')}$`
    );
    wildcard.set(pattern, re);
  }
  for (const role of roles) if (re.test(role)) return true;
  return false;
};

const evalNode = (node: RoleNode, roles: ReadonlySet<string>): boolean => {
  switch (node.type) {
    case 'true':
      return true;
    case 'role':
      return matchesPattern(roles, node.pattern);
    case 'not':
      return !evalNode(node.node, roles);
    case 'and':
      return node.nodes.every(child => evalNode(child, roles));
    case 'or':
      return node.nodes.some(child => evalNode(child, roles));
  }
};

const evalQuery = (query: RoleQuery, roles: ReadonlySet<string>): boolean => {
  if (typeof query === 'string') return evalNode(parseRoleQuery(query), roles);
  if (Array.isArray(query)) return query.length === 0 || query.some(item => evalQuery(item, roles));
  if ('and' in query) return query.and.every(item => evalQuery(item, roles));
  if ('or' in query) return query.or.length === 0 || query.or.some(item => evalQuery(item, roles));
  if ('not' in query) return !evalQuery(query.not, roles);
  return false;
};

/**
 * `true` when the roles of `source` satisfy `query`. An empty query passes.
 * Invalid expressions log a warning and fail (deny by default).
 */
export const hasRoles = (
  source: RoleSource,
  query: RoleQuery | null | undefined,
  options: IRoleCheckOptions = {}
): boolean => {
  if (query === null || query === undefined) return true;
  if (options.superUserBypass && isSuperUser(source)) return true;
  try {
    return evalQuery(query, new Set(getRoles(source)));
  } catch (error) {
    console.warn('[roles]', error);
    return false;
  }
};

/** Has every one of the roles (AND). */
export const hasAllRoles = (
  source: RoleSource,
  roles: readonly RoleQuery[],
  options?: IRoleCheckOptions
) => hasRoles(source, { and: roles }, options);

/** Has at least one of the roles (OR). */
export const hasAnyRole = (
  source: RoleSource,
  roles: readonly RoleQuery[],
  options?: IRoleCheckOptions
) => hasRoles(source, { or: roles }, options);

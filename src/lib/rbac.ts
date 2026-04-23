export type AppRole = 'owner' | 'admin' | 'employee';

export type AppPermission =
  | 'products:create'
  | 'products:edit'
  | 'products:delete'
  | 'categories:create'
  | 'categories:edit'
  | 'categories:delete'
  | 'stores:create'
  | 'stores:delete'
  | 'transactions:create'
  | 'transactions:delete';

const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  owner: [
    'products:create',
    'products:edit',
    'products:delete',
    'categories:create',
    'categories:edit',
    'categories:delete',
    'stores:create',
    'stores:delete',
    'transactions:create',
    'transactions:delete',
  ],
  admin: [
    'products:create',
    'products:edit',
    'categories:create',
    'categories:edit',
    'stores:create',
    'transactions:create',
  ],
  employee: [
    'transactions:create',
  ],
};

export function normalizeRole(rawRole?: string | null): AppRole {
  const role = String(rawRole || '').trim().toLowerCase();
  if (role === 'owner' || role === 'admin' || role === 'employee') {
    return role;
  }
  return 'employee';
}

export function hasPermission(role: string | null | undefined, permission: AppPermission) {
  const normalizedRole = normalizeRole(role);
  return ROLE_PERMISSIONS[normalizedRole].includes(permission);
}

export function getRequestRole(request: Request): AppRole {
  return normalizeRole(request.headers.get('x-user-role'));
}

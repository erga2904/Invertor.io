import { AppRole, normalizeRole } from '@/lib/rbac';

type ClientUser = {
  email: string;
  name: string;
  role: AppRole;
};

export function getClientUser(): ClientUser {
  if (typeof window === 'undefined') {
    return { email: '', name: '', role: 'employee' };
  }

  try {
    const rawUser = localStorage.getItem('user');
    const parsedUser = rawUser ? JSON.parse(rawUser) : null;
    return {
      email: parsedUser?.email || localStorage.getItem('userEmail') || '',
      name: parsedUser?.name || '',
      role: normalizeRole(parsedUser?.role),
    };
  } catch {
    return {
      email: localStorage.getItem('userEmail') || '',
      name: '',
      role: 'employee',
    };
  }
}

export function buildClientAuthHeaders(extraHeaders?: Record<string, string>) {
  const user = getClientUser();
  const headers: Record<string, string> = {
    ...(extraHeaders || {}),
    'x-user-role': user.role,
  };

  if (user.email) headers['x-user-email'] = user.email;
  if (user.name) headers['x-user-name'] = user.name;

  return headers;
}

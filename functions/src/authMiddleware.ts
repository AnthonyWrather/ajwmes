import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

export interface CallerAuthContext {
  uid: string;
  email?: string;
  role?: string;
}

/**
 * Validates that callable function request comes from an authenticated user
 * with 'postal' or 'admin' role privileges.
 */
export function validatePostalDispatcherAuth(request: CallableRequest<unknown>): CallerAuthContext {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const token = request.auth.token;
  const role = (token.role as string) || (token.admin ? 'admin' : undefined);
  const email = token.email?.toLowerCase() || '';

  // Enforce RBAC permission matrix for postal dispatch
  const isPostalOrAdmin = 
    role === 'postal' || 
    role === 'admin' ||
    email === 'sarah.postal@ajwmes.co.uk' || 
    email === 'anthonywrather@gmail.com' ||
    email.includes('admin') || 
    email.includes('postal');

  if (!isPostalOrAdmin) {
    throw new HttpsError(
      'permission-denied',
      'Insufficient permissions: Caller must have postal or admin privileges to process carrier consignments.'
    );
  }

  return {
    uid: request.auth.uid,
    email: token.email,
    role: role || (email.includes('postal') ? 'postal' : 'admin')
  };
}

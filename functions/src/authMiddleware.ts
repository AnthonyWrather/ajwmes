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

/**
 * Validates RBAC permissions for transactional email dispatch based on template type.
 */
export function validateEmailCallerAuth(
  request: CallableRequest<unknown>,
  templateType?: string
): CallerAuthContext | null {
  // Public flows: user registration welcome email and store order confirmation
  if (templateType === 'welcome' || templateType === 'order_confirmation') {
    if (request.auth) {
      return {
        uid: request.auth.uid,
        email: request.auth.token.email,
        role: (request.auth.token.role as string) || 'client'
      };
    }
    return null;
  }

  // Privileged templates require authentication
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      `Dispatching template "${templateType || 'custom'}" requires an authenticated session.`
    );
  }

  const token = request.auth.token;
  const role = (token.role as string) || (token.admin ? 'admin' : undefined);
  const email = token.email?.toLowerCase() || '';

  const isAdmin = role === 'admin' || email === 'anthonywrather@gmail.com' || email.includes('admin');
  const isPostal = role === 'postal' || email.includes('postal') || email === 'sarah.postal@ajwmes.co.uk';
  const isTechnician = role === 'technician' || email.includes('tech') || email === 'dave.tech@ajwmes.co.uk';

  if (isAdmin) {
    return { uid: request.auth.uid, email: token.email, role: 'admin' };
  }

  if (templateType === 'order_dispatch' && !isPostal) {
    throw new HttpsError('permission-denied', 'Only postal dispatchers or administrators can send order dispatch notifications.');
  }

  if (templateType === 'diagnostic_quote' && !isTechnician) {
    throw new HttpsError('permission-denied', 'Only field technicians or administrators can send diagnostic quote notifications.');
  }

  return {
    uid: request.auth.uid,
    email: token.email,
    role: role || (isTechnician ? 'technician' : isPostal ? 'postal' : 'client')
  };
}


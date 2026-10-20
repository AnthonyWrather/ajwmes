import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessRoute,
  canPerformAction,
  getAccessibleRoutes,
  getDefaultRouteForRole,
  checkRouteAccess,
  checkActionPermission,
  enforceAction,
  AppRoute,
  RbacAction
} from './rbac';
import { UserRole } from '../types';

describe('RBAC authorization engine (src/lib/rbac.ts)', () => {
  describe('Route-Level Access Control (canAccessRoute)', () => {
    it('grants guest access strictly to public and configurator routes', () => {
      const publicRoutes: AppRoute[] = ['home', 'store', 'tracker', 'designer', 'replica'];
      const protectedRoutes: AppRoute[] = ['portal', 'technician', 'postal', 'admin'];

      for (const route of publicRoutes) {
        assert.equal(canAccessRoute('guest', route), true, `guest should access ${route}`);
      }
      for (const route of protectedRoutes) {
        assert.equal(canAccessRoute('guest', route), false, `guest must not access ${route}`);
      }
    });

    it('grants client access to vessel portal and public tools, but rejects operational stations', () => {
      assert.equal(canAccessRoute('client', 'portal'), true);
      assert.equal(canAccessRoute('client', 'home'), true);
      assert.equal(canAccessRoute('client', 'store'), true);
      assert.equal(canAccessRoute('client', 'designer'), true);
      assert.equal(canAccessRoute('client', 'technician'), false);
      assert.equal(canAccessRoute('client', 'postal'), false);
      assert.equal(canAccessRoute('client', 'admin'), false);
    });

    it('grants technician access to diagnostic workstation and field tools', () => {
      assert.equal(canAccessRoute('technician', 'technician'), true);
      assert.equal(canAccessRoute('technician', 'home'), true);
      assert.equal(canAccessRoute('technician', 'store'), true);
      assert.equal(canAccessRoute('technician', 'postal'), false);
      assert.equal(canAccessRoute('technician', 'admin'), false);
    });

    it('grants postal operator access to fulfillment queue', () => {
      assert.equal(canAccessRoute('postal', 'postal'), true);
      assert.equal(canAccessRoute('postal', 'home'), true);
      assert.equal(canAccessRoute('postal', 'store'), true);
      assert.equal(canAccessRoute('postal', 'technician'), false);
      assert.equal(canAccessRoute('postal', 'admin'), false);
    });

    it('grants admin unrestricted access to every route in the system', () => {
      const allRoutes: AppRoute[] = [
        'home', 'store', 'tracker', 'designer', 'replica',
        'portal', 'technician', 'postal', 'admin'
      ];
      for (const route of allRoutes) {
        assert.equal(canAccessRoute('admin', route), true, `admin must access ${route}`);
      }
    });

    it('grants site admin access to public storefront and custom panel routes, but denies operational stations', () => {
      const publicRoutes: AppRoute[] = ['home', 'store', 'tracker', 'designer', 'replica'];
      const operationalRoutes: AppRoute[] = ['portal', 'technician', 'postal', 'admin'];

      for (const route of publicRoutes) {
        assert.equal(canAccessRoute('site', route), true, `site should access ${route}`);
      }
      for (const route of operationalRoutes) {
        assert.equal(canAccessRoute('site', route), false, `site must not access ${route}`);
      }
    });

    it('returns false for unknown or invalid routes safely', () => {
      assert.equal(canAccessRoute('admin', 'unknown_route' as any), false);
    });
  });

  describe('Primary Default Landing Route (getDefaultRouteForRole)', () => {
    it('returns role-aligned operational entry points', () => {
      assert.equal(getDefaultRouteForRole('guest'), 'home');
      assert.equal(getDefaultRouteForRole('site'), 'home');
      assert.equal(getDefaultRouteForRole('client'), 'portal');
      assert.equal(getDefaultRouteForRole('technician'), 'technician');
      assert.equal(getDefaultRouteForRole('postal'), 'postal');
      assert.equal(getDefaultRouteForRole('admin'), 'admin');
    });

    it('defaults unknown role to home route', () => {
      assert.equal(getDefaultRouteForRole('unknown_role' as any), 'home');
    });
  });

  describe('getAccessibleRoutes helper', () => {
    it('returns correct subset for each role', () => {
      const guestRoutes = getAccessibleRoutes('guest');
      assert.deepEqual(guestRoutes, ['home', 'store', 'tracker', 'designer', 'replica']);

      const siteRoutes = getAccessibleRoutes('site');
      assert.deepEqual(siteRoutes, ['home', 'store', 'tracker', 'designer', 'replica']);

      const adminRoutes = getAccessibleRoutes('admin');
      assert.equal(adminRoutes.length, 9);
      assert.ok(adminRoutes.includes('admin'));
      assert.ok(adminRoutes.includes('technician'));
    });
  });

  describe('checkRouteAccess diagnostic information', () => {
    it('returns allowed: true with fallback route for authorized request', () => {
      const result = checkRouteAccess('technician', 'technician');
      assert.equal(result.allowed, true);
      assert.equal(result.currentRole, 'technician');
      assert.equal(result.route, 'technician');
      assert.equal(result.fallbackRoute, 'home');
    });

    it('returns detailed explanation and target default fallback when denied', () => {
      const result = checkRouteAccess('guest', 'admin');
      assert.equal(result.allowed, false);
      assert.equal(result.currentRole, 'guest');
      assert.equal(result.fallbackRoute, 'home');
      assert.ok(result.reason?.includes('Access Denied'));
      assert.ok(result.reason?.includes('Anthony Wrather (Admin)'));
    });

    it('handles unrecognized route defensively', () => {
      const result = checkRouteAccess('guest', 'non_existent' as any);
      assert.equal(result.allowed, false);
      assert.ok(result.reason?.includes('unrecognized in the system RBAC registry'));
    });
  });

  describe('Action-Level Access Control (canPerformAction & checkActionPermission)', () => {
    it('governs administrative privileges exclusively for admin', () => {
      const adminActions: RbacAction[] = [
        'access_admin_dashboard',
        'edit_catalog_pricing',
        'create_catalog_snapshot',
        'restore_catalog_snapshot',
        'draft_supplier_purchase_order',
        'restock_catalog_inventory',
        'manage_user_roles'
      ];

      for (const action of adminActions) {
        assert.equal(canPerformAction('admin', action), true, `admin can ${action}`);
        assert.equal(canPerformAction('site', action), false, `site cannot ${action}`);
        assert.equal(canPerformAction('guest', action), false, `guest cannot ${action}`);
        assert.equal(canPerformAction('client', action), false, `client cannot ${action}`);
        assert.equal(canPerformAction('technician', action), false, `technician cannot ${action}`);
        assert.equal(canPerformAction('postal', action), false, `postal cannot ${action}`);
      }
    });

    it('governs website administration actions exclusively for site role', () => {
      const siteActions: RbacAction[] = [
        'manage_site_settings',
        'manage_api_keys',
        'switch_environments',
        'manage_site_roles'
      ];

      for (const action of siteActions) {
        assert.equal(canPerformAction('site', action), true, `site can ${action}`);
        assert.equal(canPerformAction('admin', action), false, `admin cannot ${action}`);
        assert.equal(canPerformAction('guest', action), false, `guest cannot ${action}`);
        assert.equal(canPerformAction('client', action), false, `client cannot ${action}`);
        assert.equal(canPerformAction('technician', action), false, `technician cannot ${action}`);
        assert.equal(canPerformAction('postal', action), false, `postal cannot ${action}`);
      }
    });

    it('governs pontoon technician diagnostic logging actions', () => {
      assert.equal(canPerformAction('technician', 'log_diagnostic_hours'), true);
      assert.equal(canPerformAction('technician', 'log_materials_used'), true);
      assert.equal(canPerformAction('technician', 'update_job_status'), true);
      assert.equal(canPerformAction('guest', 'log_diagnostic_hours'), false);
    });

    it('governs workshop postal dispatch actions', () => {
      assert.equal(canPerformAction('postal', 'pack_postal_consignment'), true);
      assert.equal(canPerformAction('postal', 'assign_tracking_number'), true);
      assert.equal(canPerformAction('postal', 'print_packing_slip'), true);
      assert.equal(canPerformAction('technician', 'pack_postal_consignment'), false);
    });

    it('handles undefined actions safely', () => {
      assert.equal(canPerformAction('admin', 'invalid_action' as any), false);
      const res = checkActionPermission('admin', 'invalid_action' as any);
      assert.equal(res.allowed, false);
      assert.ok(res.reason?.includes('not defined in the RBAC registry'));
    });
  });

  describe('Centralized Action Enforcement Middleware (enforceAction)', () => {
    it('executes callback and returns result when user role is authorized', () => {
      let executed = false;
      const result = enforceAction('admin', 'edit_catalog_pricing', () => {
        executed = true;
        return 'price-updated';
      });

      assert.equal(executed, true);
      assert.equal(result, 'price-updated');
    });

    it('intercepts unauthorized calls, triggers onDenied, and returns null', () => {
      let executed = false;
      let deniedCheck: any = null;

      const result = enforceAction(
        'client',
        'edit_catalog_pricing',
        () => {
          executed = true;
          return 'price-updated';
        },
        (check) => {
          deniedCheck = check;
        }
      );

      assert.equal(executed, false);
      assert.equal(result, null);
      assert.ok(deniedCheck);
      assert.equal(deniedCheck.allowed, false);
      assert.equal(deniedCheck.action, 'edit_catalog_pricing');
      assert.ok(deniedCheck.reason?.includes('Permission Denied'));
    });

    it('logs console warning when onDenied callback is omitted', () => {
      const originalWarn = console.warn;
      let warnedMessage = '';
      console.warn = (msg: string) => {
        warnedMessage = msg;
      };

      try {
        const result = enforceAction('guest', 'manage_user_roles', () => 'done');
        assert.equal(result, null);
        assert.ok(warnedMessage.includes('[RBAC ENFORCEMENT BLOCK]'));
      } finally {
        console.warn = originalWarn;
      }
    });
  });
});
